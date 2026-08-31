import { normalizeServiceError } from "./serviceError";

const SUBTITLE_BASE_URL = "https://opensubtitles-v3.strem.io";
const SUBDL_BASE_URL = "https://api.subdl.com/api/v1";
const SUBDL_DOWNLOAD_URL = "https://dl.subdl.com";
const SUBDL_API_KEY = import.meta.env.VITE_SUBDL_API_KEY?.trim() ?? "";
const MAX_GLOBAL_SUBTITLES_PER_LANGUAGE = 12;
const MAX_CACHED_SUBTITLE_FILES = 24;
const subtitleTextCache = new Map<string, string>();

interface SubtitleResponseItem {
  id?: string;
  lang?: string;
  url?: string;
  subtitleFileName?: string;
  movieReleaseName?: string;
  m?: string;
  fpsMilli?: number;
}

interface SubtitleResponse {
  subtitles?: SubtitleResponseItem[];
}

export type SubtitleLanguage = "tur" | "eng";
export type SubtitleProvider = "OpenSubtitles" | "SubDL";

export interface SubtitleOption {
  id: string;
  language: SubtitleLanguage;
  label: string;
  provider: SubtitleProvider;
  url: string;
  fileName: string;
  releaseName: string;
  fps: number | null;
  matchedVideoHashes: string[];
  matchedByHash?: boolean;
  sourceOrder: number;
}

export interface SubtitleCue {
  startTime: number;
  endTime: number;
  text: string;
}

interface SubtitleRequest {
  type: "movie" | "tv";
  imdbId: string;
  season?: number;
  episode?: number;
  filename?: string;
  videoHash?: string;
  videoSize?: number | null;
  signal?: AbortSignal;
  onPartial?: (options: SubtitleOption[]) => void;
}

interface SubDLFile {
  file_n_id?: string;
  name?: string;
  release_name?: string;
  language?: string;
  format?: string;
  url?: string;
  season?: number;
  episode?: number;
}

interface SubDLItem {
  release_name?: string;
  language?: string;
  fps?: string | number;
  unpack_files?: SubDLFile[];
  season?: number;
  episode?: number;
}

const LANGUAGE_LABELS: Record<string, string> = {
  tur: "Türkçe",
  eng: "İngilizce",
};

function languageCode(value?: string): SubtitleLanguage | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "tr" || normalized === "tur" || normalized === "turkish") return "tur";
  if (normalized === "en" || normalized === "eng" || normalized === "english") return "eng";
  return null;
}

function buildSubtitleUrl({
  type,
  imdbId,
  season = 1,
  episode = 1,
  filename,
  videoHash,
  videoSize,
}: Omit<SubtitleRequest, "signal" | "onPartial">): string {
  const resourceType = type === "tv" ? "series" : "movie";
  const resourceId = type === "tv"
    ? `${imdbId}:${Math.max(1, season)}:${Math.max(1, episode)}`
    : imdbId;
  const extra = new URLSearchParams();
  if (videoHash) extra.set("videoHash", videoHash);
  if (videoSize && videoSize > 0) extra.set("videoSize", String(Math.round(videoSize)));
  if (filename) extra.set("filename", filename);
  const extraPath = extra.size ? `/${extra.toString()}` : "";
  return `${SUBTITLE_BASE_URL}/subtitles/${resourceType}/${resourceId}${extraPath}.json`;
}

function parseSubtitleOptions(payload: unknown): SubtitleOption[] {
  const response = payload as SubtitleResponse;
  if (!response || !Array.isArray(response.subtitles)) return [];

  const seen = new Set<string>();
  return response.subtitles
    .flatMap((subtitle, index): SubtitleOption[] => {
      const language = languageCode(subtitle.lang);
      const url = subtitle.url?.trim() ?? "";
      if (!language || !/^https:\/\//i.test(url)) return [];
      if (seen.has(url)) return [];
      seen.add(url);
      const fileName = subtitle.subtitleFileName?.trim() ?? "";
      const releaseName = subtitle.movieReleaseName?.trim() ?? "";
      const sourceName = fileName.replace(/\.(?:srt|vtt|sub|txt)$/i, "") || releaseName;
      return [{
        id: `opensubtitles:${subtitle.id || index}:${language}`,
        language,
        label: sourceName
          ? `${LANGUAGE_LABELS[language]} · OpenSubtitles · ${sourceName}`
          : `${LANGUAGE_LABELS[language]} · OpenSubtitles`,
        provider: "OpenSubtitles",
        url,
        fileName,
        releaseName,
        fps: typeof subtitle.fpsMilli === "number" && subtitle.fpsMilli > 0
          ? subtitle.fpsMilli / 1000
          : null,
        matchedVideoHashes: [],
        matchedByHash: subtitle.m === "h",
        sourceOrder: index,
      }];
    })
    .sort((left, right) => {
      const priority = (language: string) => language === "tur" ? 0 : 1;
      return priority(left.language) - priority(right.language);
    });
}

function parseSubDLOptions(payload: unknown, request: SubtitleRequest): SubtitleOption[] {
  const items = (payload as { subtitles?: SubDLItem[] })?.subtitles;
  if (!Array.isArray(items)) return [];
  let sourceOrder = 0;
  return items.flatMap((item): SubtitleOption[] => {
    const itemLanguage = languageCode(item.language);
    const itemFps = Number(item.fps);
    return (item.unpack_files ?? []).flatMap((file): SubtitleOption[] => {
      const language = languageCode(file.language) ?? itemLanguage;
      const format = file.format?.toLowerCase() ?? "";
      const path = file.url?.trim() ?? "";
      if (!language || !path || !["srt", "vtt"].includes(format)) return [];
      if (request.type === "tv") {
        const expectedSeason = Math.max(1, request.season ?? 1);
        const expectedEpisode = Math.max(1, request.episode ?? 1);
        if ((file.season ?? item.season) != null && (file.season ?? item.season) !== expectedSeason) return [];
        if ((file.episode ?? item.episode) != null && (file.episode ?? item.episode) !== expectedEpisode) return [];
      }
      const fileName = file.name?.trim() ?? "";
      const releaseName = file.release_name?.trim() || item.release_name?.trim() || fileName;
      const index = sourceOrder++;
      return [{
        id: `subdl:${file.file_n_id || index}:${language}`,
        language,
        label: `${LANGUAGE_LABELS[language]} · SubDL${releaseName ? ` · ${releaseName}` : ""}`,
        provider: "SubDL",
        url: new URL(path, SUBDL_DOWNLOAD_URL).toString(),
        fileName,
        releaseName,
        fps: Number.isFinite(itemFps) && itemFps > 0 ? itemFps : null,
        matchedVideoHashes: [],
        sourceOrder: index,
      }];
    });
  });
}

function normalizedRelease(value: string) {
  return value
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.(?:srt|vtt|sub|txt|mkv|mp4)$/i, "")
    .replace(/\b(?:turkce|turkish|english|shifted|fixed|subtitle|sub)\b/gi, " ");
}

function releaseTokens(value: string): Set<string> {
  return new Set(
    normalizedRelease(value)
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 1),
  );
}

function releaseTitleTokens(value: string) {
  const normalized = normalizedRelease(value);
  const marker = normalized.search(
    /\b(?:19|20)\d{2}\b|\bs\d{1,2}[ ._-]?e\d{1,3}\b|\b\d{1,2}x\d{1,3}\b|\b(?:2160p?|1080[pi]?|720[pi]?|480[pi]?|remux|blu[ ._-]?ray|bdrip|brrip|web[ ._-]?dl|webrip|hdtv|dvdrip|telesync|camrip)\b/i,
  );
  return releaseTokens(marker >= 0 ? normalized.slice(0, marker) : normalized);
}

function sourceFamily(value: string) {
  if (/\b(?:cam|camrip|hdcam|telesync|telecine|hdts|hdtc|ts)\b/i.test(value)) return "cam";
  if (/\b(?:remux|blu[ ._-]?ray|bdrip|brrip|uhd)\b/i.test(value)) return "bluray";
  if (/\b(?:web[ ._-]?dl|webrip)\b/i.test(value)) return "web";
  if (/\bhdtv\b/i.test(value)) return "hdtv";
  if (/\b(?:dvd|dvdrip)\b/i.test(value)) return "dvd";
  return null;
}

function episodeMarker(value: string) {
  const match = value.match(/\bs(\d{1,2})[ ._-]?e(\d{1,3})\b/i)
    ?? value.match(/\b(\d{1,2})x(\d{1,3})\b/i);
  return match ? `${Number(match[1])}:${Number(match[2])}` : null;
}

export function subtitleMatchScore(
  option: SubtitleOption,
  release: string,
  videoHash = "",
): number {
  const target = releaseTokens(release);
  const candidate = releaseTokens(`${option.fileName} ${option.releaseName}`);
  let score = videoHash && option.matchedVideoHashes.includes(videoHash) ? 100_000 : 0;
  let matches = 0;
  for (const token of candidate) {
    if (target.has(token)) {
      matches += 1;
      score += token.length >= 5 ? 18 : 7;
    }
  }

  const subtitleText = normalizedRelease(`${option.fileName} ${option.releaseName}`);
  const streamText = normalizedRelease(release);
  const subtitleTitle = releaseTitleTokens(subtitleText);
  const streamTitle = releaseTitleTokens(streamText);
  if (subtitleTitle.size && streamTitle.size) {
    const shared = [...subtitleTitle].filter((token) => streamTitle.has(token)).length;
    score += shared / Math.max(subtitleTitle.size, streamTitle.size) >= 0.6
      ? 6_000
      : -80_000;
  }

  const subtitleEpisode = episodeMarker(subtitleText);
  const streamEpisode = episodeMarker(streamText);
  if (subtitleEpisode || streamEpisode) {
    score += subtitleEpisode === streamEpisode ? 20_000 : -60_000;
  }

  const subtitleSource = sourceFamily(subtitleText);
  const streamSource = sourceFamily(streamText);
  if (subtitleSource && streamSource) {
    score += subtitleSource === streamSource
      ? 3_500
      : subtitleSource === "cam" || streamSource === "cam"
        ? -60_000
        : -12_000;
  }
  const subtitleVariant = subtitleText.match(/\b(?:proper|repack|rerip)\b/i)?.[0];
  const streamVariant = streamText.match(/\b(?:proper|repack|rerip)\b/i)?.[0];
  if (subtitleVariant || streamVariant) {
    score += subtitleVariant === streamVariant ? 5_000 : -15_000;
  }
  score += matches / Math.max(1, Math.min(target.size, candidate.size)) * 1_500;
  return score - option.sourceOrder / 100;
}

function subtitleIdentity(option: SubtitleOption): string {
  return `${option.language}|${option.url}`;
}

export function mergeSubtitleOptions(
  ...groups: SubtitleOption[][]
): SubtitleOption[] {
  const merged = new Map<string, SubtitleOption>();
  groups.flat().forEach((subtitle) => {
    const key = subtitleIdentity(subtitle);
    const previous = merged.get(key);
    merged.set(key, previous
      ? {
        ...previous,
        ...subtitle,
        matchedVideoHashes: [...new Set([
          ...previous.matchedVideoHashes,
          ...subtitle.matchedVideoHashes,
        ])],
        sourceOrder: Math.min(previous.sourceOrder, subtitle.sourceOrder),
      }
      : subtitle);
  });
  return [...merged.values()];
}

async function fetchWithTimeout(url: string, signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = globalThis.setTimeout(abort, 12_000);
  signal?.addEventListener("abort", abort, { once: true });
  try {
    return await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

async function fetchOpenSubtitles(request: SubtitleRequest) {
  const response = await fetchWithTimeout(buildSubtitleUrl(request), request.signal);
  if (!response.ok) return [];
  return parseSubtitleOptions(await response.json()).map((option) => ({
    ...option,
    matchedVideoHashes: request.videoHash && option.matchedByHash
      ? [request.videoHash]
      : option.matchedVideoHashes,
  }));
}

async function fetchSubDL(request: SubtitleRequest) {
  if (!SUBDL_API_KEY) return [];
  const query = new URLSearchParams({
    api_key: SUBDL_API_KEY,
    imdb_id: request.imdbId,
    languages: "TR,EN",
    subs_per_page: "30",
    releases: "1",
    unpack: "1",
    type: request.type,
  });
  if (request.filename) query.set("file_name", request.filename);
  if (request.type === "tv") {
    query.set("season_number", String(Math.max(1, request.season ?? 1)));
    query.set("episode_number", String(Math.max(1, request.episode ?? 1)));
  }
  const response = await fetchWithTimeout(`${SUBDL_BASE_URL}/subtitles?${query}`, request.signal);
  return response.ok ? parseSubDLOptions(await response.json(), request) : [];
}

export async function getSubtitleOptions(request: SubtitleRequest): Promise<SubtitleOption[]> {
  try {
    const globalRequest = {
      ...request,
      filename: undefined,
      videoHash: undefined,
      videoSize: undefined,
      onPartial: undefined,
    };
    const loaders = [
      fetchOpenSubtitles(request),
      fetchSubDL(request),
    ];
    if (request.filename || request.videoHash) {
      loaders.push(fetchOpenSubtitles(globalRequest), fetchSubDL(globalRequest));
    }
    const results = await Promise.allSettled(loaders.map(async (loader) => {
      const options = await loader;
      if (options.length && !request.signal?.aborted) request.onPartial?.(options);
      return options;
    }));
    if (request.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return mergeSubtitleOptions(...results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []
    ));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return [];
  }
}

export function rankSubtitleOptions(
  options: SubtitleOption[],
  streamReleases: string[],
  videoHash = "",
) {
  return (["tur", "eng"] as const).flatMap((language) => options
    .filter((option) => option.language === language)
    .map((option) => ({
      option,
      score: Math.max(...streamReleases.map((release) =>
        subtitleMatchScore(option, release, videoHash)
      )),
    }))
    .filter(({ score }) => score > -30_000)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_GLOBAL_SUBTITLES_PER_LANGUAGE)
    .map(({ option }) => option));
}

interface SubtitleStreamCandidate {
  id: string;
  filename: string;
  releaseName: string;
  videoHash: string;
}

export function findBestSubtitlePair(
  options: SubtitleOption[],
  streams: SubtitleStreamCandidate[],
) {
  const language = options.some((option) => option.language === "tur") ? "tur" : "eng";
  let best: { streamId: string; subtitleId: string; score: number } | null = null;
  for (const stream of streams) {
    const release = `${stream.filename} ${stream.releaseName}`;
    for (const option of options) {
      if (option.language !== language) continue;
      const score = subtitleMatchScore(option, release, stream.videoHash);
      if (!best || score > best.score) {
        best = { streamId: stream.id, subtitleId: option.id, score };
      }
    }
  }
  return best;
}

function srtToVtt(source: string): string {
  const normalized = source
    .replace(/^\uFEFF/, "")
    .replace(/\r+/g, "")
    .replace(
      /(^|\n)(\d+)(?=\n\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->)/g,
      "$1",
    )
    .replace(
      /(\d{2}:\d{2}:\d{2}),(\d{3})(?=\s+-->)|(?<=-->\s+\d{2}:\d{2}:\d{2}),(\d{3})/g,
      (match) => match.replace(",", "."),
    );
  return `WEBVTT\n\n${normalized.trim()}\n`;
}

function cueTime(value: string): number {
  const [hours, minutes, rest] = value.split(":");
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(rest);
}

export function parseSubtitleCues(vtt: string): SubtitleCue[] {
  const cuePattern = /(?:^|\n)(\d{2}:\d{2}:\d{2}[.]\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}[.]\d{3})[^\n]*\n([\s\S]*?)(?=\n{2,}|$)/g;
  return [...vtt.matchAll(cuePattern)].flatMap((match) => {
    const startTime = cueTime(match[1]);
    const endTime = cueTime(match[2]);
    const text = match[3].replace(/<[^>]+>/g, "").trim();
    return text && endTime > startTime ? [{ startTime, endTime, text }] : [];
  });
}

export async function loadSubtitleVtt(
  subtitle: SubtitleOption,
  signal?: AbortSignal,
): Promise<string> {
  const cached = subtitleTextCache.get(subtitle.url);
  if (cached) return cached;
  try {
    const response = await fetch(subtitle.url, { signal });
    if (!response.ok) throw { status: response.status };
    const buffer = await response.arrayBuffer();
    let source: string;
    try {
      source = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      source = new TextDecoder("windows-1254").decode(buffer);
    }
    const vtt = srtToVtt(source);
    if (subtitleTextCache.size >= MAX_CACHED_SUBTITLE_FILES) {
      subtitleTextCache.delete(subtitleTextCache.keys().next().value!);
    }
    subtitleTextCache.set(subtitle.url, vtt);
    return vtt;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw normalizeServiceError(error);
  }
}

export async function loadSubtitleCues(
  subtitle: SubtitleOption,
  signal?: AbortSignal,
) {
  return parseSubtitleCues(await loadSubtitleVtt(subtitle, signal));
}
