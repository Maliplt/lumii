import type { SubtitleCue } from "../../services/subtitles";

const COMMON_TIME_SCALES = [1, 25 / 23.976, 23.976 / 25, 25 / 24, 24 / 25];

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
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

function timelineScore(
  target: SubtitleCue[],
  reference: SubtitleCue[],
  offset: number,
  scale: number,
) {
  const referenceStep = Math.max(1, Math.ceil(reference.length / 260));
  const targetStep = Math.max(1, Math.ceil(target.length / 260));
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
    ...COMMON_TIME_SCALES,
    measuredScale >= 0.94 && measuredScale <= 1.07
      ? Number(measuredScale.toFixed(6))
      : 1,
  ])];
  let best = { offset: 0, scale: 1, score: timelineScore(target, reference, 0, 1) };

  for (const scale of scales) {
    const anchors = [0.15, 0.3, 0.5, 0.7, 0.85].map((quantile) => {
      const targetCue = target[Math.floor((target.length - 1) * quantile)];
      const referenceCue = reference[Math.floor((reference.length - 1) * quantile)];
      return referenceCue.startTime - targetCue.startTime * scale;
    });
    const center = median(anchors);
    for (let delta = -60; delta <= 60; delta += 0.5) {
      const offset = center + delta;
      const score = timelineScore(target, reference, offset, scale);
      if (score > best.score) best = { offset, scale, score };
    }
  }
  const coarse = best;
  for (let delta = -0.5; delta <= 0.5; delta += 0.05) {
    const offset = coarse.offset + delta;
    const score = timelineScore(target, reference, offset, coarse.scale);
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
