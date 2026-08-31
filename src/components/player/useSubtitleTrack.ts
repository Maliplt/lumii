import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  loadSubtitleCues,
  type SubtitleCue,
  type SubtitleOption,
} from "../../services/subtitles";
import type { CaptionAppearance } from "./playerTypes";

interface SubtitleTrackOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  subtitles: SubtitleOption[];
  preferredId?: string;
  selectionKey?: string;
  mediaKey?: string;
}

interface CapturableVideo extends HTMLVideoElement {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
}

interface VadFrame {
  time: number;
  speech: number;
}

const VAD_ASSET_PATH = "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/";
const ONNX_ASSET_PATH = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.29.0/dist/";
const STANDARD_FRAME_RATES = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60];
const VAD_TIME_SCALES = [1, 25 / 23.976, 23.976 / 25, 25 / 24, 24 / 25];
const MAX_TIMING_REFERENCES = 6;

function textAt(cues: SubtitleCue[], time: number) {
  let low = 0;
  let high = cues.length - 1;
  let candidate = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (cues[middle].startTime <= time) {
      candidate = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  if (candidate < 0) return "";

  const active: string[] = [];
  for (let index = candidate; index >= 0 && cues[index].startTime >= time - 15; index -= 1) {
    const cue = cues[index];
    if (cue.startTime <= time && cue.endTime >= time) active.unshift(cue.text);
  }
  return active.join("\n");
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function cueActiveAt(cues: SubtitleCue[], time: number) {
  let low = 0;
  let high = cues.length - 1;
  let candidate = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (cues[middle].startTime <= time) {
      candidate = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  for (let index = candidate; index >= 0 && cues[index].startTime >= time - 12; index -= 1) {
    if (cues[index].endTime >= time) return true;
  }
  return false;
}

function nearestCueStartDistance(cues: SubtitleCue[], time: number) {
  let low = 0;
  let high = cues.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (cues[middle].startTime < time) low = middle + 1;
    else high = middle - 1;
  }
  return Math.min(
    Math.abs((cues[low]?.startTime ?? Infinity) - time),
    Math.abs((cues[low - 1]?.startTime ?? Infinity) - time),
  );
}

function nearestCueStart(cues: SubtitleCue[], time: number) {
  let low = 0;
  let high = cues.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (cues[middle].startTime < time) low = middle + 1;
    else high = middle - 1;
  }
  const before = cues[low - 1]?.startTime;
  const after = cues[low]?.startTime;
  if (before == null) return after ?? time;
  if (after == null) return before;
  return Math.abs(before - time) <= Math.abs(after - time) ? before : after;
}

function subtitlePairScore(
  target: SubtitleCue[],
  reference: SubtitleCue[],
  offset: number,
  scale: number,
) {
  const referenceStep = Math.max(1, Math.ceil(reference.length / 300));
  const targetStep = Math.max(1, Math.ceil(target.length / 300));
  let score = 0;
  let samples = 0;
  for (let index = 0; index < reference.length; index += referenceStep) {
    const targetTime = (reference[index].startTime - offset) / scale;
    const distance = Math.abs(nearestCueStart(target, targetTime) - targetTime);
    score += Math.exp(-(distance * distance) / 1.44);
    samples += 1;
  }
  for (let index = 0; index < target.length; index += targetStep) {
    const referenceTime = target[index].startTime * scale + offset;
    const distance = Math.abs(nearestCueStart(reference, referenceTime) - referenceTime);
    score += Math.exp(-(distance * distance) / 1.44);
    samples += 1;
  }
  return score / Math.max(1, samples);
}

export function alignSubtitleTimelines(target: SubtitleCue[], reference: SubtitleCue[]) {
  if (target.length < 80 || reference.length < 80) return null;
  const targetSpan = target.at(-1)!.startTime - target[0].startTime;
  const referenceSpan = reference.at(-1)!.startTime - reference[0].startTime;
  const measuredScale = referenceSpan / Math.max(1, targetSpan);
  const scales = [...new Set([
    ...VAD_TIME_SCALES,
    measuredScale >= 0.94 && measuredScale <= 1.07
      ? Number(measuredScale.toFixed(6))
      : 1,
  ])];
  let best = { offset: 0, scale: 1, score: subtitlePairScore(target, reference, 0, 1) };

  for (const scale of scales) {
    const quantileOffsets = [0.15, 0.3, 0.5, 0.7, 0.85].map((quantile) => {
      const targetCue = target[Math.floor((target.length - 1) * quantile)];
      const referenceCue = reference[Math.floor((reference.length - 1) * quantile)];
      return referenceCue.startTime - targetCue.startTime * scale;
    });
    const center = median(quantileOffsets);
    for (let delta = -60; delta <= 60; delta += 0.5) {
      const offset = center + delta;
      const score = subtitlePairScore(target, reference, offset, scale);
      if (score > best.score) best = { offset, scale, score };
    }
  }

  const coarse = best;
  for (let delta = -0.5; delta <= 0.5; delta += 0.05) {
    const offset = coarse.offset + delta;
    const score = subtitlePairScore(target, reference, offset, coarse.scale);
    if (score > best.score) best = { offset, scale: coarse.scale, score };
  }
  return best.score >= 0.3 ? best : null;
}

export function subtitleTimeAt(videoTime: number, offset: number, timeScale: number) {
  return (videoTime - offset) / timeScale;
}

export function subtitleTimeScale(subtitleFps: number, videoFps: number) {
  const scale = subtitleFps / videoFps;
  return scale >= 0.94 && scale <= 1.07 ? scale : 1;
}

function vadAlignmentScore(
  cues: SubtitleCue[],
  frames: VadFrame[],
  offset: number,
  timeScale: number,
) {
  let speechTotal = 0;
  let captionTotal = 0;
  let overlap = 0;
  let boundaryScore = 0;
  let boundaries = 0;
  let previouslySpeaking = false;

  for (const frame of frames) {
    const speech = Math.max(0, Math.min(1, (frame.speech - 0.28) / 0.42));
    const cueTime = subtitleTimeAt(frame.time, offset, timeScale);
    const caption = cueActiveAt(cues, cueTime) ? 1 : 0;
    speechTotal += speech;
    captionTotal += caption;
    overlap += speech * caption;

    const speaking = frame.speech >= 0.56;
    if (speaking && !previouslySpeaking) {
      const distance = nearestCueStartDistance(cues, cueTime);
      boundaryScore += Math.exp(-(distance * distance) / 0.32);
      boundaries += 1;
    }
    if (previouslySpeaking) previouslySpeaking = frame.speech > 0.32;
    else previouslySpeaking = speaking;
  }

  const activityScore = 2 * overlap / Math.max(1, speechTotal + captionTotal);
  const onsetScore = boundaries ? boundaryScore / boundaries : activityScore;
  return activityScore * 0.72 + onsetScore * 0.28;
}

function estimateVadAlignment(
  cues: SubtitleCue[],
  frames: VadFrame[],
  currentOffset: number,
  currentScale: number,
  searchTimeScale: boolean,
) {
  const duration = frames.at(-1)!.time - frames[0].time;
  if (frames.length < 180 || duration < 12) return null;
  const baseline = vadAlignmentScore(cues, frames, currentOffset, currentScale);
  const searchRadius = duration < 25 ? 5 : 1.5;
  const anchorVideoTime = frames.at(-1)!.time;
  const anchorSubtitleTime = subtitleTimeAt(anchorVideoTime, currentOffset, currentScale);
  const scales = duration >= 240 && searchTimeScale
    ? [...new Set([currentScale, ...VAD_TIME_SCALES])]
    : [currentScale];
  let best = { offset: currentOffset, scale: currentScale, score: baseline };

  for (const scale of scales) {
    const anchoredOffset = anchorVideoTime - anchorSubtitleTime * scale;
    for (let delta = -searchRadius; delta <= searchRadius; delta += 0.05) {
      const offset = anchoredOffset + delta;
      const score = vadAlignmentScore(cues, frames, offset, scale);
      if (score > best.score) best = { offset, scale, score };
    }
  }
  const scaleChanged = Math.abs(best.scale - currentScale) > 0.0005;
  const minimumGain = scaleChanged ? 0.05 : 0.018;
  if (best.score < (scaleChanged ? 0.46 : 0.4) || best.score - baseline < minimumGain) {
    return null;
  }
  return best;
}

export function useSubtitleTrack({
  videoRef,
  subtitles,
  preferredId,
  selectionKey,
  mediaKey,
}: SubtitleTrackOptions) {
  const cuesRef = useRef<SubtitleCue[]>([]);
  const displayedTextRef = useRef("");
  const lastSubtitleIdRef = useRef<string | null>(null);
  const activeSelectionKeyRef = useRef<string | null>(null);
  const choiceMadeRef = useRef(false);
  const syncOffsetRef = useRef(0);
  const timeScaleRef = useRef(1);
  const referenceAlignedRef = useRef(false);
  const videoFpsSamplesRef = useRef<number[]>([]);
  const vadFramesRef = useRef<VadFrame[]>([]);
  const failedSubtitleIdsRef = useRef(new Set<string>());
  const [selectedId, setSelectedId] = useState("off");
  const [text, setText] = useState("");
  const [appearance, setAppearance] = useState<CaptionAppearance>({
    size: "medium",
    background: "soft",
    color: "white",
  });

  const clearTrack = useCallback(() => {
    cuesRef.current = [];
    displayedTextRef.current = "";
    vadFramesRef.current = [];
    videoFpsSamplesRef.current = [];
    syncOffsetRef.current = 0;
    timeScaleRef.current = 1;
    referenceAlignedRef.current = false;
    setText("");
  }, []);

  const select = useCallback((id: string) => {
    choiceMadeRef.current = true;
    if (id !== "off") lastSubtitleIdRef.current = id;
    clearTrack();
    setSelectedId(id);
  }, [clearTrack]);

  const toggle = useCallback(() => {
    if (selectedId !== "off") {
      select("off");
      return;
    }
    const next = subtitles.find((option) =>
      option.id === lastSubtitleIdRef.current &&
      !failedSubtitleIdsRef.current.has(option.id)
    )
      ?? subtitles.find((option) => !failedSubtitleIdsRef.current.has(option.id));
    if (next) select(next.id);
  }, [select, selectedId, subtitles]);

  useEffect(() => {
    if (!selectionKey) return;
    const contentChanged = activeSelectionKeyRef.current !== selectionKey;
    if (contentChanged) {
      activeSelectionKeyRef.current = selectionKey;
      choiceMadeRef.current = false;
      failedSubtitleIdsRef.current.clear();
      clearTrack();
    }
    if (!subtitles.length) {
      if (contentChanged) setSelectedId("off");
      return;
    }
    if (choiceMadeRef.current && subtitles.some((option) => option.id === selectedId)) return;
    const preferred = subtitles.find((option) =>
      option.id === preferredId && !failedSubtitleIdsRef.current.has(option.id)
    ) ?? subtitles.find((option) => !failedSubtitleIdsRef.current.has(option.id));
    if (!preferred) {
      setSelectedId("off");
      return;
    }
    setSelectedId(preferred.id);
    lastSubtitleIdRef.current = preferred.id;
  }, [clearTrack, preferredId, selectedId, selectionKey, subtitles]);

  useEffect(() => {
    const selected = subtitles.find((option) => option.id === selectedId);
    const englishOptions = selected?.language === "tur"
      ? subtitles.filter((option) => option.language === "eng")
      : [];
    const referenceOptions = englishOptions
      .filter((option, index, options) =>
        index < 4 || options.findIndex((candidate) => candidate.provider === option.provider) === index
      )
      .slice(0, MAX_TIMING_REFERENCES);
    const controller = new AbortController();
    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return { cues: [], referenceCueSets: [] };
        clearTrack();
        if (!selected) return { cues: [], referenceCueSets: [] };
        return Promise.all([
          loadSubtitleCues(selected, controller.signal),
          Promise.allSettled(referenceOptions.map((reference) =>
            loadSubtitleCues(reference, controller.signal)
          )),
        ]).then(([cues, referenceResults]) => ({
          cues,
          referenceCueSets: referenceResults.flatMap((result) =>
            result.status === "fulfilled" && result.value.length ? [result.value] : []
          ),
        }));
      })
      .then(({ cues, referenceCueSets }) => {
        if (controller.signal.aborted) return;
        cuesRef.current = cues;
        const alignment = referenceCueSets
          .map((referenceCues) => alignSubtitleTimelines(cues, referenceCues))
          .filter((candidate) => candidate !== null)
          .sort((left, right) => right.score - left.score)[0];
        if (alignment) {
          syncOffsetRef.current = Number(alignment.offset.toFixed(3));
          timeScaleRef.current = alignment.scale;
          referenceAlignedRef.current = true;
        }
      })
      .catch(() => {
        if (controller.signal.aborted || !selected) return;
        failedSubtitleIdsRef.current.add(selected.id);
        clearTrack();
        const next = subtitles.find((option) =>
          option.language === selected.language &&
          !failedSubtitleIdsRef.current.has(option.id)
        ) ?? subtitles.find((option) => !failedSubtitleIdsRef.current.has(option.id));
        setSelectedId(next?.id ?? "off");
      });
    return () => controller.abort();
  }, [clearTrack, selectedId, subtitles]);

  useEffect(() => {
    if (selectedId === "off") return;
    let animationFrame = 0;
    const update = () => {
      const videoTime = videoRef.current?.currentTime ?? -1;
      const sourceTime = subtitleTimeAt(
        videoTime,
        syncOffsetRef.current,
        timeScaleRef.current,
      );
      const nextText = textAt(cuesRef.current, sourceTime);
      if (nextText !== displayedTextRef.current) {
        displayedTextRef.current = nextText;
        setText(nextText);
      }
      animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [selectedId, videoRef]);

  useEffect(() => {
    if (selectedId === "off") return;
    const video = videoRef.current;
    const selected = subtitles.find((option) => option.id === selectedId);
    if (!video || !selected?.fps || referenceAlignedRef.current || !video.getVideoPlaybackQuality) return;

    let previousTime = video.currentTime;
    let previousFrames = video.getVideoPlaybackQuality().totalVideoFrames;
    const measure = () => {
      if (video.paused || video.seeking) return;
      const quality = video.getVideoPlaybackQuality();
      const elapsed = video.currentTime - previousTime;
      const decodedFrames = quality.totalVideoFrames - previousFrames;
      if (elapsed <= 0 || elapsed > 20 || decodedFrames < 0) {
        previousTime = video.currentTime;
        previousFrames = quality.totalVideoFrames;
        videoFpsSamplesRef.current = [];
        return;
      }
      if (elapsed < 6 || decodedFrames <= 0) return;
      previousTime = video.currentTime;
      previousFrames = quality.totalVideoFrames;
      const measuredFps = decodedFrames / elapsed;
      const nearestFps = STANDARD_FRAME_RATES.reduce((nearest, candidate) =>
        Math.abs(candidate - measuredFps) < Math.abs(nearest - measuredFps)
          ? candidate
          : nearest
      );
      if (Math.abs(nearestFps - measuredFps) > 0.8) return;
      const samples = [...videoFpsSamplesRef.current.slice(-2), nearestFps];
      videoFpsSamplesRef.current = samples;
      if (samples.length < 2) return;
      const videoFps = median(samples);
      const nextScale = subtitleTimeScale(selected.fps!, videoFps);
      const currentScale = timeScaleRef.current;
      if (Math.abs(nextScale - currentScale) < 0.0005) return;
      const currentSubtitleTime = subtitleTimeAt(
        video.currentTime,
        syncOffsetRef.current,
        currentScale,
      );
      timeScaleRef.current = nextScale;
      syncOffsetRef.current = video.currentTime - currentSubtitleTime * nextScale;
    };
    const timer = window.setInterval(measure, 3_000);
    return () => window.clearInterval(timer);
  }, [selectedId, subtitles, videoRef]);

  useEffect(() => {
    if (selectedId === "off") return;
    const video = videoRef.current as CapturableVideo | null;
    const capture = video?.captureStream?.bind(video) ?? video?.mozCaptureStream?.bind(video);
    if (!video || !capture) return;

    let disposed = false;
    let vad: { destroy: () => Promise<void> } | null = null;
    let lastFrameTime = -1;
    let lastAlignmentAt = -1;
    let lastScaleSearchAt = -1;
    const onFrameProcessed = (probabilities: { isSpeech: number }) => {
      if (video.paused || !cuesRef.current.length) return;
      const time = video.currentTime;
      if (lastFrameTime >= 0 && (time < lastFrameTime || time - lastFrameTime > 1)) {
        vadFramesRef.current = [];
      }
      if (time - lastFrameTime < 0.08) return;
      lastFrameTime = time;
      const frames = vadFramesRef.current;
      frames.push({ time, speech: probabilities.isSpeech });
      const firstVisible = frames.findIndex((frame) => frame.time >= time - 360);
      if (firstVisible > 0) frames.splice(0, firstVisible);
      vadFramesRef.current = frames;
      if (time - lastAlignmentAt < 6) return;
      lastAlignmentAt = time;

      const currentOffset = syncOffsetRef.current;
      const currentScale = timeScaleRef.current;
      const searchTimeScale = time - lastScaleSearchAt >= 30;
      if (searchTimeScale) lastScaleSearchAt = time;
      const estimated = estimateVadAlignment(
        cuesRef.current,
        frames,
        currentOffset,
        currentScale,
        searchTimeScale,
      );
      if (!estimated) return;
      if (Math.abs(estimated.scale - currentScale) > 0.0005) {
        timeScaleRef.current = estimated.scale;
        syncOffsetRef.current = Number(estimated.offset.toFixed(3));
        return;
      }
      const correction = Math.max(-0.35, Math.min(0.35, estimated.offset - currentOffset));
      syncOffsetRef.current = Number((currentOffset + correction).toFixed(3));
    };

    let startPending = false;
    let capturedStream: MediaStream | null = null;
    let retryTimer = 0;
    let retryCount = 0;
    const start = async () => {
      if (disposed || vad || startPending || video.paused) return;
      startPending = true;
      try {
        const stream = capture();
        const audioTrack = stream.getAudioTracks().find((track) => track.readyState === "live");
        if (!audioTrack || disposed) {
          stream.getTracks().forEach((track) => track.stop());
          if (!disposed && retryCount < 5) {
            retryCount += 1;
            retryTimer = window.setTimeout(() => void start(), 1_000);
          }
          return;
        }
        capturedStream = stream;
        const { MicVAD } = await import("@ricky0123/vad-web");
        if (disposed) return;
        vad = await MicVAD.new({
          model: "v5",
          baseAssetPath: VAD_ASSET_PATH,
          onnxWASMBasePath: ONNX_ASSET_PATH,
          getStream: async () => stream,
          pauseStream: async () => undefined,
          resumeStream: async () => stream,
          positiveSpeechThreshold: 0.56,
          negativeSpeechThreshold: 0.32,
          redemptionMs: 350,
          minSpeechMs: 180,
          startOnLoad: true,
          onFrameProcessed,
        });
        retryCount = 0;
        if (disposed) await vad.destroy();
      } catch {
        if (!disposed && retryCount < 3) {
          retryCount += 1;
          retryTimer = window.setTimeout(() => void start(), 2_000);
        }
      } finally {
        startPending = false;
      }
    };

    const tryStart = () => void start();
    video.addEventListener("playing", tryStart);
    video.addEventListener("canplay", tryStart);
    tryStart();
    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      video.removeEventListener("playing", tryStart);
      video.removeEventListener("canplay", tryStart);
      if (vad) void vad.destroy().finally(() => {
        capturedStream?.getTracks().forEach((track) => track.stop());
      });
      else capturedStream?.getTracks().forEach((track) => track.stop());
    };
  }, [mediaKey, selectedId, selectionKey, videoRef]);

  return {
    selectedId,
    select,
    toggle,
    appearance,
    setAppearance,
    text,
  };
}

export type SubtitleTrackController = ReturnType<typeof useSubtitleTrack>;
