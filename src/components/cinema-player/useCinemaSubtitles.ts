import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { loadSubtitleCues, type SubtitleCue, type SubtitleOption } from "../../services/subtitles";
import type { CaptionStyle } from "./cinemaPlayerTypes";
import { alignSubtitleTimelines, subtitleTimeAt, subtitleTimeScale } from "./subtitleTiming";

const STANDARD_FRAME_RATES = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];
const DEFAULT_SUBTITLE_OFFSET = -0.5;

function cueTextAt(cues: SubtitleCue[], time: number) {
  let low = 0;
  let high = cues.length - 1;
  let match = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (cues[middle].startTime <= time) {
      match = middle;
      low = middle + 1;
    } else high = middle - 1;
  }
  if (match < 0) return "";
  const active: string[] = [];
  for (let index = match; index >= 0 && cues[index].startTime >= time - 15; index -= 1) {
    const cue = cues[index];
    if (cue.endTime >= time) active.unshift(cue.text);
  }
  return active.join("\n");
}

interface UseCinemaSubtitlesOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  options: SubtitleOption[];
  preferredId?: string;
  selectionKey?: string;
}

export function useCinemaSubtitles({
  videoRef,
  options,
  preferredId,
  selectionKey,
}: UseCinemaSubtitlesOptions) {
  const cues = useRef<SubtitleCue[]>([]);
  const lastText = useRef("");
  const manuallySelected = useRef(false);
  const failedSubtitleIds = useRef(new Set<string>());
  const activeSelectionKey = useRef(selectionKey);
  const automaticOffset = useRef(0);
  const timeScale = useRef(1);
  const [selectedId, setSelectedId] = useState("off");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [manualOffset, setManualOffset] = useState(DEFAULT_SUBTITLE_OFFSET);
  const [style, setStyle] = useState<CaptionStyle>({
    size: "medium",
    background: "soft",
    color: "white",
    italic: false,
    bold: false,
  });
  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedId),
    [options, selectedId],
  );
  const referenceOption = useMemo(
    () => selectedOption?.language === "tur"
      ? options.find((option) => option.language === "eng")
      : undefined,
    [options, selectedOption?.language],
  );
  const selectedUrl = selectedOption?.url;
  const referenceUrl = referenceOption?.url;

  const select = useCallback((id: string) => {
    manuallySelected.current = true;
    failedSubtitleIds.current.clear();
    cues.current = [];
    lastText.current = "";
    automaticOffset.current = 0;
    timeScale.current = 1;
    setText("");
    setManualOffset(DEFAULT_SUBTITLE_OFFSET);
    setSelectedId(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const keyChanged = activeSelectionKey.current !== selectionKey;
    if (keyChanged) {
      activeSelectionKey.current = selectionKey;
      manuallySelected.current = false;
      failedSubtitleIds.current.clear();
      cues.current = [];
      lastText.current = "";
      setText("");
      setManualOffset(DEFAULT_SUBTITLE_OFFSET);
    }
    if (!keyChanged && (manuallySelected.current || (selectedId !== "off" && options.some((option) => option.id === selectedId)))) return;
    const preferred = options.find((option) => option.id === preferredId) ?? options[0];
    const nextId = preferred?.id ?? "off";
    if (nextId !== selectedId) queueMicrotask(() => {
      if (!cancelled) setSelectedId(nextId);
    });
    return () => { cancelled = true; };
  }, [options, preferredId, selectedId, selectionKey]);

  useEffect(() => {
    const selected = selectedUrl ? ({ url: selectedUrl } as SubtitleOption) : undefined;
    const reference = referenceUrl ? ({ url: referenceUrl } as SubtitleOption) : undefined;
    const controller = new AbortController();
    cues.current = [];
    automaticOffset.current = 0;
    timeScale.current = 1;
    queueMicrotask(() => {
      if (!controller.signal.aborted) setText("");
    });
    if (!selected) return () => controller.abort();
    queueMicrotask(() => {
      if (!controller.signal.aborted) setLoading(true);
    });
    Promise.all([
      loadSubtitleCues(selected, controller.signal),
      reference ? loadSubtitleCues(reference, controller.signal).catch(() => [] as SubtitleCue[]) : Promise.resolve([] as SubtitleCue[]),
    ])
      .then(([nextCues, referenceCues]) => {
        if (controller.signal.aborted) return;
        cues.current = nextCues;
        const alignment = referenceCues.length
          ? alignSubtitleTimelines(nextCues, referenceCues)
          : null;
        if (alignment) {
          automaticOffset.current = alignment.offset;
          timeScale.current = alignment.scale;
        }
      })
      .catch(() => {
        if (controller.signal.aborted || !selectedOption) return;
        failedSubtitleIds.current.add(selectedOption.id);
        const fallback = options.find((option) =>
          option.language === selectedOption.language &&
          option.id !== selectedOption.id &&
          !failedSubtitleIds.current.has(option.id)
        );
        if (fallback) setSelectedId(fallback.id);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [options, referenceUrl, selectedId, selectedOption, selectedUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedOption?.fps || !video.getVideoPlaybackQuality) return;
    let previousTime = video.currentTime;
    let previousFrames = video.getVideoPlaybackQuality().totalVideoFrames;
    const timer = window.setInterval(() => {
      if (video.paused || video.seeking) return;
      const quality = video.getVideoPlaybackQuality();
      const elapsed = video.currentTime - previousTime;
      const decoded = quality.totalVideoFrames - previousFrames;
      if (elapsed < 5 || decoded <= 0) return;
      previousTime = video.currentTime;
      previousFrames = quality.totalVideoFrames;
      const measured = decoded / elapsed;
      const nearest = STANDARD_FRAME_RATES.reduce((best, candidate) =>
        Math.abs(candidate - measured) < Math.abs(best - measured) ? candidate : best
      );
      if (Math.abs(nearest - measured) <= 0.8) {
        timeScale.current = subtitleTimeScale(selectedOption.fps!, nearest);
      }
    }, 3_000);
    return () => window.clearInterval(timer);
  }, [selectedOption?.fps, videoRef]);

  useEffect(() => {
    if (selectedId === "off") return;
    const video = videoRef.current;
    if (!video) return;
    let frame = 0;
    const tick = () => {
      const nextText = cueTextAt(
        cues.current,
        subtitleTimeAt(
          video.currentTime,
          automaticOffset.current + manualOffset,
          timeScale.current,
        ),
      );
      if (nextText !== lastText.current) {
        lastText.current = nextText;
        setText(nextText);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [manualOffset, selectedId, videoRef]);

  const toggle = useCallback(() => {
    if (selectedId !== "off") select("off");
    else select(options.find((option) => option.id === preferredId)?.id ?? options[0]?.id ?? "off");
  }, [options, preferredId, select, selectedId]);

  const adjustOffset = useCallback((delta: number) => {
    setManualOffset((current) => Number(Math.max(-30, Math.min(30, current + delta)).toFixed(2)));
  }, []);

  return {
    selectedId,
    selectedLanguage: selectedOption?.language,
    select,
    toggle,
    text,
    loading,
    style,
    setStyle,
    manualOffset,
    adjustOffset,
    resetOffset: () => setManualOffset(DEFAULT_SUBTITLE_OFFSET),
  };
}

export type CinemaCaptionsController = ReturnType<typeof useCinemaSubtitles>;
