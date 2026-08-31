import type Hls from "hls.js";

export const LIVE_AUTO_SYNC_GAP = 18;
export const LIVE_BEHIND_GAP = 45;

export function getLiveEdge(video: HTMLVideoElement, hls: Hls | null): number {
  const syncPosition = hls?.liveSyncPosition;
  if (syncPosition != null && Number.isFinite(syncPosition)) return syncPosition;
  if (video.seekable.length) {
    const edge = video.seekable.end(video.seekable.length - 1);
    if (Number.isFinite(edge)) return edge;
  }
  return video.currentTime;
}
