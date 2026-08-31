import { normalizeServiceError, playbackError, ServiceError } from "./serviceError";

const TORRENTIO_BASE_URL = "https://torrentio.strem.fun";
const COMET_BASE_URL = "https://comet.elfhosted.com";
const MEDIAFUSION_BASE_URL = "https://mediafusion.elfhosted.com";
export const DEFAULT_STREAM_API_KEY =
  import.meta.env.VITE_TORBOX_API_KEY?.trim() ?? "";
export const MAX_VISIBLE_STREAMS = 25;
const MAX_STREAMS_PER_QUALITY = 5;

export type TorboxResolution = "4K" | "1080p" | "720p" | "480p" | "SD";
export const STREAM_QUALITY_ORDER: readonly TorboxResolution[] = [
  "4K",
  "1080p",
  "720p",
  "480p",
  "SD",
];
export type TorboxCodec = "H.264" | "HEVC" | "Bilinmiyor";
export type TorboxFormat = "MP4" | "MKV" | "Bilinmiyor";
export type StreamReleaseQuality =
  | "REMUX"
  | "BluRay"
  | "WEB-DL"
  | "WEBRip"
  | "HDTV"
  | "HQ"
  | "Telesync"
  | "CAM"
  | "Diğer";
export type StreamLanguage =
  | "Türkçe"
  | "Türkçe + İngilizce"
  | "İngilizce";

interface TorrentioStream {
  name?: string;
  title?: string;
  description?: string;
  url?: string;
  behaviorHints?: {
    filename?: string;
    notWebReady?: boolean;
    videoHash?: string;
    videoSize?: number;
  };
}

interface TorrentioResponse {
  streams?: TorrentioStream[];
}

export interface TorboxStream {
  id: string;
  url: string;
  releaseName: string;
  filename: string;
  provider: string;
  catalog: "Torrentio" | "Comet" | "MediaFusion";
  language: StreamLanguage;
  resolution: TorboxResolution;
  codec: TorboxCodec;
  format: TorboxFormat;
  audioCodec: string;
  audioCompatible: boolean;
  releaseQuality: StreamReleaseQuality;
  sizeBytes: number | null;
  sizeLabel: string;
  seeders: number;
  cached: boolean;
  browserCompatible: boolean;
  videoHash: string;
}

export interface TorboxStreamRequest {
  apiKey?: string;
  type: "movie" | "tv";
  imdbId: string;
  season?: number;
  episode?: number;
  title?: string;
  year?: number;
  originalLanguage?: string;
  signal?: AbortSignal;
  onPartial?: (streams: TorboxStream[]) => void;
}

function parseResolution(text: string): TorboxResolution {
  if (/\b(?:4320p?|2160p?|4k)\b/i.test(text)) return "4K";
  if (/\b1080[pi]?\b/i.test(text)) return "1080p";
  if (/\b720[pi]?\b/i.test(text)) return "720p";
  if (/\b480[pi]?\b/i.test(text)) return "480p";
  if (/\buhd\b/i.test(text)) return "4K";
  return "SD";
}

function parseReleaseQuality(text: string): StreamReleaseQuality {
  if (/\b(?:remux|bdremux)\b/i.test(text)) return "REMUX";
  if (/\b(?:blu[ ._-]?ray|bdrip|brrip)\b/i.test(text)) return "BluRay";
  if (/\bweb[ ._-]?dl\b/i.test(text)) return "WEB-DL";
  if (/\bweb[ ._-]?rip\b/i.test(text)) return "WEBRip";
  if (/\bhdtv\b/i.test(text)) return "HDTV";
  if (/\b(?:hdts|telesync|telecine|hdtc|\bts\b)\b/i.test(text)) return "Telesync";
  if (/\b(?:cam|camrip|hdcam)\b/i.test(text)) return "CAM";
  if (/\b(?:hq|untouched|pre)\b/i.test(text)) return "HQ";
  return "Diğer";
}

function parseCodec(text: string): TorboxCodec {
  if (/\b(?:hevc|h\.?265|x265)\b/i.test(text)) return "HEVC";
  if (/\b(?:avc|h\.?264|x264)\b/i.test(text)) return "H.264";
  return "Bilinmiyor";
}

function parseFormat(text: string): TorboxFormat {
  if (/\.mp4(?:\b|$|\?)/i.test(text) || /\bmp4\b/i.test(text)) return "MP4";
  if (/\.mkv(?:\b|$|\?)/i.test(text) || /\bmkv\b/i.test(text)) return "MKV";
  return "Bilinmiyor";
}

function parseAudioCodec(text: string): string {
  const aac = /(?:^|[^a-z0-9])(?:aac|mp4a)(?=$|[^a-z0-9]|\d)/i.test(text);
  const eac3 = /(?:^|[^a-z0-9])(?:e-?ac-?3|ddp(?:lus)?|dd\+)(?=$|[^a-z0-9]|\d)/i.test(text);
  const ac3 = /(?:^|[^a-z0-9])(?:ac-?3|dd[ ._-]?(?:2|5|7)(?:[ ._-]?\d)?)(?=$|[^a-z0-9])/i.test(text);
  const dts = /(?:^|[^a-z0-9])dts(?:-?hd)?(?=$|[^a-z0-9]|\d)/i.test(text);
  const lossless = /(?:^|[^a-z0-9])(?:truehd|mlp|pcm)(?=$|[^a-z0-9]|\d)/i.test(text);
  if (aac && (eac3 || ac3 || dts || lossless)) return "Çoklu";
  if (aac) return "AAC";
  if (/\bopus\b/i.test(text)) return "Opus";
  if (/\bmp3\b/i.test(text)) return "MP3";
  if (eac3) return "E-AC-3";
  if (ac3) return "AC-3";
  if (lossless) return "TrueHD/PCM";
  if (dts) return "DTS";
  return "Bilinmiyor";
}

function isLikelyBrowserAudioCompatible(audioCodec: string): boolean {
  return audioCodec === "AAC" || audioCodec === "MP3" || audioCodec === "Opus";
}

function parseSize(text: string): { bytes: number | null; label: string } {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(GiB|GB|MiB|MB)\b/i);
  if (!match) return { bytes: null, label: "Boyut bilinmiyor" };

  const value = Number(match[1].replace(",", "."));
  const unit = match[2].toUpperCase();
  const multiplier = unit.startsWith("GI")
    ? 1024 ** 3
    : unit.startsWith("G")
      ? 1000 ** 3
      : unit.startsWith("MI")
        ? 1024 ** 2
        : 1000 ** 2;
  const bytes = value * multiplier;
  const gigabytes = bytes / 1000 ** 3;
  return {
    bytes,
    label: gigabytes >= 0.1
      ? `${gigabytes.toFixed(gigabytes >= 10 ? 1 : 2)} GB`
      : `${Math.round(bytes / 1000 ** 2)} MB`,
  };
}

function sizeFromHint(value: unknown): { bytes: number | null; label: string } | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const gigabytes = value / 1000 ** 3;
  return {
    bytes: value,
    label: gigabytes >= 0.1
      ? `${gigabytes.toFixed(gigabytes >= 10 ? 1 : 2)} GB`
      : `${Math.round(value / 1000 ** 2)} MB`,
  };
}

function parseProvider(title: string, catalog: TorboxStream["catalog"]): string {
  const provider = title.match(/⚙️\s*([^|\r\n]+)/u)?.[1]?.trim()
    || title.match(/🔎\s*([^|\r\n]+)/u)?.[1]?.trim()
    || title.match(/🔗\s*([^|\r\n]+)/u)?.[1]?.trim()
    || title.match(/(?:Source|Indexer|Provider)\s*[:：]\s*([^|\r\n]+)/i)?.[1]?.trim()
    || catalog;
  const sanitized = provider
    .replace(/\btorbox\b/gi, "")
    .replace(/^tb\s*/i, "")
    .replace(/^[\s|·-]+|[\s|·-]+$/g, "");
  return sanitized || catalog;
}

function parseReleaseName(title: string, filename: string): string {
  const release = title.split(/(?:\r?\n|👤)/u)[0]?.trim();
  return filename || release || "İsimsiz sürüm";
}

const OTHER_LANGUAGE_PATTERN = /(?:🇯🇵|🇷🇺|🇮🇹|🇵🇹|🇪🇸|🇲🇽|🇰🇷|🇨🇳|🇹🇼|🇫🇷|🇩🇪|🇳🇱|🇮🇳|🇵🇱|🇱🇹|🇱🇻|🇪🇪|🇨🇿|🇸🇰|🇸🇮|🇭🇺|🇷🇴|🇧🇬|🇷🇸|🇭🇷|🇺🇦|🇬🇷|🇩🇰|🇫🇮|🇸🇪|🇳🇴|🇸🇦|🇮🇷|🇮🇱|🇻🇳|🇮🇩|🇲🇾|🇹🇭|\b(?:japanese|russian|italian|portuguese|spanish|castellano|latino|korean|chinese|taiwanese|french|german|dutch|hindi|bengali|punjabi|marathi|gujarati|telugu|tamil|kannada|malayalam|polish|lithuanian|latvian|estonian|czech|slovakian|slovenian|hungarian|romanian|bulgarian|serbian|croatian|ukrainian|greek|danish|finnish|swedish|norwegian|arabic|persian|hebrew|vietnam|vietnamese|viet|indonesian|malay|thai|vostfr|vff|vfi|jpn|jap|rus|ita|por|spa|esp|lat|kor|chi|chs|cht|zho|fra|fre|ger|deu|hin|tam|tel|vie|ukr|pol|ara|pldub|mdhun)\b)/iu;

function parseLanguage(text: string, fallback: StreamLanguage | null): StreamLanguage | null {
  if (OTHER_LANGUAGE_PATTERN.test(text)) return null;
  const turkish = /(?:🇹🇷|\bturkish\b|\btürkçe\b|\bturkce\b|\btur\b|\btr[ ._-]?(?:dub|dublaj|audio)\b)/iu.test(text);
  const english = /(?:🇬🇧|🇺🇸|\benglish\b|\bingles\b|\boriginal[ ._-]?eng\b|\beng\b|\ben[ ._-]?(?:audio|dub)\b)/iu.test(text);
  if (turkish && english) return "Türkçe + İngilizce";
  if (turkish) return "Türkçe";
  if (english) return "İngilizce";
  if (/\b(?:multi|dual)(?:[ ._-]?(?:audio|dub))?\b|\bdubbed\b/i.test(text)) return null;
  return fallback;
}

function languageScore(language: StreamLanguage): number {
  if (language === "Türkçe" || language === "Türkçe + İngilizce") return 1_200;
  return language === "İngilizce" ? 700 : 0;
}

function qualityScore(resolution: TorboxResolution): number {
  if (resolution === "4K") return 50_000;
  if (resolution === "1080p") return 40_000;
  if (resolution === "720p") return 30_000;
  if (resolution === "480p") return 20_000;
  return 10_000;
}

function releaseQualityScore(quality: StreamReleaseQuality): number {
  if (quality === "REMUX") return 20_000;
  if (quality === "BluRay") return 18_000;
  if (quality === "WEB-DL") return 17_000;
  if (quality === "WEBRip") return 16_000;
  if (quality === "HDTV") return 14_000;
  if (quality === "HQ") return 12_000;
  if (quality === "Diğer") return 9_000;
  if (quality === "Telesync") return 6_000;
  return 2_000;
}

function isRiskyArchive(
  text: string,
  filename: string,
  format: TorboxFormat,
  sizeBytes: number | null,
  resolution: TorboxResolution,
  webReady: boolean,
): boolean {
  if (/\.(?:rar|zip|7z|iso)(?:$|[?#])/i.test(filename)) return true;
  if (/(?:debrid failed|failed to split|only rar is available|no playable files?)/i.test(text)) {
    return true;
  }
  if (format === "Bilinmiyor" && !webReady) return true;
  if (sizeBytes != null) {
    const gigabytes = sizeBytes / 1000 ** 3;
    if (gigabytes < 0.15) return true;
    if (resolution === "4K" && gigabytes > 160) return true;
    if (resolution === "1080p" && gigabytes > 80) return true;
    if (resolution === "720p" && gigabytes > 40) return true;
    if (resolution === "480p" && gigabytes > 20) return true;
    if (resolution === "SD" && gigabytes > 12) return true;
    if (gigabytes > 160) return true;
  }
  return false;
}

function compatibilityScore(stream: TorboxStream): number {
  let score = qualityScore(stream.resolution) + releaseQualityScore(stream.releaseQuality);
  if (stream.browserCompatible) score += 30_000;
  score += languageScore(stream.language);
  if (stream.cached) score += 900;
  if (stream.format === "MP4") score += 8_000;
  if (stream.codec === "H.264") score += 6_000;
  else if (stream.codec === "HEVC") score -= 4_000;
  if (stream.audioCodec === "AAC") {
    score += stream.format === "MP4" ? 20_000 : -5_000;
  }
  else if (["MP3", "Opus"].includes(stream.audioCodec)) score += 8_000;
  else if (stream.audioCodec === "Çoklu") score -= 8_000;
  else if (["AC-3", "E-AC-3", "DTS", "TrueHD/PCM"].includes(stream.audioCodec)) {
    score -= 30_000;
  }
  else if (stream.audioCodec === "Bilinmiyor") score -= 12_000;
  score += Math.min(stream.seeders, 100) * 2;
  if (stream.sizeBytes != null) {
    score += Math.min(stream.sizeBytes / 1000 ** 3, 50) * 300;
  }
  if (/\.(?:mkv|mp4)\.(?:mkv|mp4)$/i.test(stream.filename)) score -= 2_000;
  return score;
}

function contentTokens(value: string): string[] {
  const ignored = new Set(["the", "a", "an", "and", "of", "ve", "bir", "ile"]);
  return value
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !ignored.has(token) && !/^\d+$/.test(token));
}

function matchesRequestedContent(
  stream: TorboxStream,
  expectedTitle?: string,
  expectedYear?: number,
): boolean {
  const release = `${stream.filename} ${stream.releaseName}`;
  if (expectedYear) {
    const years = [...release.matchAll(/\b(?:19|20)\d{2}\b/g)].map((match) => Number(match[0]));
    if (years.length > 0 && !years.includes(expectedYear)) return false;
  }
  const expectedTokens = contentTokens(expectedTitle ?? "");
  if (expectedTokens.length < 3) return true;
  const releaseTokenSet = new Set(contentTokens(release));
  const matches = expectedTokens.filter((token) => releaseTokenSet.has(token)).length;
  return matches >= Math.max(2, Math.ceil(expectedTokens.length * 0.6));
}

export function filterStreamsForContent(
  streams: TorboxStream[],
  expectedTitle?: string,
  expectedYear?: number,
): TorboxStream[] {
  return streams.filter((stream) =>
    matchesRequestedContent(stream, expectedTitle, expectedYear)
  );
}

export function parseTorboxStreams(
  payload: unknown,
  catalog: TorboxStream["catalog"] = "Torrentio",
  fallbackLanguage: StreamLanguage | null = "İngilizce",
): TorboxStream[] {
  const response = payload as TorrentioResponse;
  if (!response || !Array.isArray(response.streams)) return [];

  const seenUrls = new Set<string>();
  const seenReleases = new Set<string>();
  const streams = response.streams.flatMap((stream, index): TorboxStream[] => {
    if (
      !stream ||
      typeof stream.url !== "string" ||
      !/^https?:\/\//i.test(stream.url) ||
      stream.behaviorHints?.notWebReady
    ) {
      return [];
    }
    if (seenUrls.has(stream.url)) return [];

    const filename = stream.behaviorHints?.filename?.trim() ?? "";
    const title = [stream.title, stream.description].filter(Boolean).join("\n").trim();
    const name = stream.name?.trim() || `Kaynak ${index + 1}`;
    const searchable = [name, title, filename].filter(Boolean).join(" ");
    const resolution = parseResolution(searchable);
    const codec = parseCodec(searchable);
    const format = parseFormat(searchable);
    const audioCodec = parseAudioCodec(searchable);
    const audioCompatible = isLikelyBrowserAudioCompatible(audioCodec);
    const size = sizeFromHint(stream.behaviorHints?.videoSize) ?? parseSize(searchable);
    if (isRiskyArchive(
      searchable,
      filename,
      format,
      size.bytes,
      resolution,
      stream.behaviorHints?.notWebReady === false,
    )) return [];

    const releaseKey = `${filename.toLocaleLowerCase("en-US")}|${Math.round(size.bytes ?? 0)}`;
    if (filename && seenReleases.has(releaseKey)) return [];
    seenUrls.add(stream.url);
    if (filename) seenReleases.add(releaseKey);

    const language = parseLanguage(searchable, fallbackLanguage);
    if (!language) return [];
    const cached = /\[[a-z]{2}\+\]|(?:⚡|✅|\bcached\b|\binstant\b)/iu.test(searchable);

    return [{
      id: `${catalog}:${index}:${stream.url}`,
      url: stream.url,
      releaseName: parseReleaseName(title, filename),
      filename,
      provider: parseProvider(title, catalog),
      catalog,
      language,
      resolution,
      codec,
      format,
      audioCodec,
      audioCompatible,
      releaseQuality: parseReleaseQuality(searchable),
      sizeBytes: size.bytes,
      sizeLabel: size.label,
      seeders: Number(title.match(/👤\s*(\d+)/u)?.[1] ?? 0),
      cached,
      browserCompatible:
        format === "MP4" && codec === "H.264" && audioCodec === "AAC",
      videoHash: stream.behaviorHints?.videoHash?.trim() ?? "",
    }];
  });

  return streams.sort((left, right) => {
    const scoreDifference = compatibilityScore(right) - compatibilityScore(left);
    if (scoreDifference !== 0) return scoreDifference;
    return (left.sizeBytes ?? Number.MAX_SAFE_INTEGER) -
      (right.sizeBytes ?? Number.MAX_SAFE_INTEGER);
  });
}

export function selectPreferredStreams(
  streams: TorboxStream[],
  limit = MAX_VISIBLE_STREAMS,
): TorboxStream[] {
  const selected = STREAM_QUALITY_ORDER.flatMap((quality) => {
    const candidates = streams.filter((stream) => stream.resolution === quality);
    const picks: TorboxStream[] = [];
    const add = (stream?: TorboxStream) => {
      if (
        stream &&
        picks.length < MAX_STREAMS_PER_QUALITY &&
        !picks.some((item) => item.id === stream.id)
      ) {
        picks.push(stream);
      }
    };
    add(candidates.find((stream) =>
      stream.audioCompatible && stream.language.includes("Türkçe")
    ));
    add(candidates.find((stream) =>
      stream.audioCompatible && stream.language === "İngilizce"
    ));
    add(candidates.find((stream) =>
      stream.releaseQuality === "WEB-DL" || stream.releaseQuality === "WEBRip"
    ));
    (["Torrentio", "Comet", "MediaFusion"] as const).forEach((catalog) => {
      add(candidates.find((stream) => stream.catalog === catalog));
    });
    candidates.forEach(add);
    return picks.sort(
      (left, right) => candidates.indexOf(left) - candidates.indexOf(right),
    );
  });
  return selected.slice(0, Math.max(1, limit));
}

export function buildTorrentioUrl({
  apiKey = DEFAULT_STREAM_API_KEY,
  type,
  imdbId,
  season = 1,
  episode = 1,
}: Omit<TorboxStreamRequest, "signal">): string {
  const normalizedKey = apiKey.trim();
  const normalizedImdbId = imdbId.trim();
  if (!normalizedKey) throw new ServiceError("configuration");
  if (!/^tt\d+$/i.test(normalizedImdbId)) throw playbackError();

  const streamType = type === "tv" ? "series" : "movie";
  const streamId = type === "tv"
    ? `${normalizedImdbId}:${Math.max(1, season)}:${Math.max(1, episode)}`
    : normalizedImdbId;
  const configuration = [
    `torbox=${encodeURIComponent(normalizedKey)}`,
    "debridoptions=nodownloadlinks,nocatalog",
  ].join("|");
  return `${TORRENTIO_BASE_URL}/${configuration}/stream/${streamType}/${streamId}.json`;
}

function stremioContentPath(request: TorboxStreamRequest) {
  const streamType = request.type === "tv" ? "series" : "movie";
  const streamId = request.type === "tv"
    ? `${request.imdbId}:${Math.max(1, request.season ?? 1)}:${Math.max(1, request.episode ?? 1)}`
    : request.imdbId;
  return `${streamType}/${streamId}`;
}

function encodeBase64(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function buildCometUrl(request: TorboxStreamRequest) {
  const apiKey = (request.apiKey ?? DEFAULT_STREAM_API_KEY).trim();
  const otherLanguages = [
    "ja", "zh", "ru", "ar", "pt", "es", "fr", "de", "it", "ko", "hi",
    "bn", "pa", "mr", "gu", "ta", "te", "kn", "ml", "th", "vi", "id",
    "he", "fa", "uk", "el", "lt", "lv", "et", "pl", "cs", "sk", "hu",
    "ro", "bg", "sr", "hr", "sl", "nl", "da", "fi", "sv", "no", "ms", "la",
  ];
  const config = {
    cachedOnly: true,
    removeTrash: true,
    maxResultsPerResolution: 5,
    debridServices: [{ service: "torbox", apiKey }],
    enableTorrent: false,
    deduplicateStreams: true,
    resultFormat: ["all"],
    languages: { preferred: ["tr", "en"], exclude: otherLanguages },
    options: {
      allow_english_in_languages: true,
      remove_unknown_languages: false,
    },
  };
  return `${COMET_BASE_URL}/${encodeURIComponent(encodeBase64(config))}/stream/${stremioContentPath(request)}.json`;
}

let mediaFusionConfig: { apiKey: string; promise: Promise<string> } | null = null;

async function mediaFusionSecret(request: TorboxStreamRequest) {
  const apiKey = (request.apiKey ?? DEFAULT_STREAM_API_KEY).trim();
  const cachedConfig = mediaFusionConfig;
  if (cachedConfig && cachedConfig.apiKey === apiKey) return cachedConfig.promise;
  const promise = fetchJson(`${MEDIAFUSION_BASE_URL}/encrypt-user-data`, request.signal, 30_000, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      streaming_providers: [{
        name: "default",
        service: "torbox",
        token: apiKey,
        only_show_cached_streams: true,
        use_mediaflow: false,
        enabled: true,
      }],
      selected_resolutions: ["2160p", "1080p", "720p", "480p", null],
      language_sorting: ["Turkish", "English"],
      max_streams_per_resolution: 5,
      max_streams: 25,
      enable_catalogs: false,
      live_search_streams: true,
    }),
  }).then((payload) => {
    const secret = (payload as { encrypted_str?: string }).encrypted_str;
    if (!secret) throw playbackError();
    return secret;
  });
  mediaFusionConfig = { apiKey, promise };
  promise.catch(() => {
    if (mediaFusionConfig?.promise === promise) mediaFusionConfig = null;
  });
  return promise;
}

async function fetchJson(
  url: string,
  signal?: AbortSignal,
  timeout = 15_000,
  init: RequestInit = {},
) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = globalThis.setTimeout(abort, timeout);
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...init.headers },
      signal: controller.signal,
    });
    if (!response.ok) throw { status: response.status };
    return await response.json() as unknown;
  } finally {
    globalThis.clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

async function fetchProviderStreams(
  request: TorboxStreamRequest,
  catalog: TorboxStream["catalog"],
) {
  let payload: unknown;
  if (catalog === "Torrentio") {
    payload = await fetchJson(buildTorrentioUrl(request), request.signal, 15_000);
  } else if (catalog === "Comet") {
    payload = await fetchJson(buildCometUrl(request), request.signal, 18_000);
  } else {
    const secret = await mediaFusionSecret(request);
    payload = await fetchJson(
      `${MEDIAFUSION_BASE_URL}/${secret}/stream/${stremioContentPath(request)}.json`,
      request.signal,
      45_000,
    );
  }
  const fallbackLanguage = request.originalLanguage === "tr"
    ? "Türkçe"
    : request.originalLanguage === "en"
      ? "İngilizce"
      : null;
  return filterStreamsForContent(
    parseTorboxStreams(payload, catalog, fallbackLanguage),
    request.title,
    request.year,
  );
}

function mergeStreams(groups: TorboxStream[][]) {
  const unique = new Map<string, TorboxStream>();
  for (const stream of groups.flat()) {
    const key = stream.url.toLocaleLowerCase("en-US");
    if (!unique.has(key)) unique.set(key, stream);
  }
  const compatibleStreams = [...unique.values()]
    .filter((stream) => stream.audioCompatible)
    .sort((left, right) => compatibilityScore(right) - compatibilityScore(left));
  return selectPreferredStreams(compatibleStreams);
}

export async function getTorboxStreams(
  request: TorboxStreamRequest,
): Promise<TorboxStream[]> {
  try {
    const groups: TorboxStream[][] = [];
    const tasks = (["Torrentio", "Comet", "MediaFusion"] as const).map(async (catalog) => {
      const streams = await fetchProviderStreams(request, catalog);
      if (streams.length) {
        groups.push(streams);
        request.onPartial?.(mergeStreams(groups));
      }
      return streams;
    });
    const results = await Promise.allSettled(tasks);
    if (request.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const streams = mergeStreams(results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []
    ));
    if (!streams.length) {
      const rejected = results.find((result) => result.status === "rejected");
      if (rejected?.status === "rejected") throw rejected.reason;
      throw playbackError();
    }
    return streams;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw normalizeServiceError(error);
  }
}

export function findBestStreamForQuality(
  streams: TorboxStream[],
  quality: TorboxResolution,
): number {
  const requestedIndex = STREAM_QUALITY_ORDER.indexOf(quality);
  const fallbackOrder = [
    ...STREAM_QUALITY_ORDER.slice(requestedIndex),
    ...STREAM_QUALITY_ORDER.slice(0, requestedIndex).reverse(),
  ];
  for (const candidate of fallbackOrder) {
    const index = streams.findIndex((stream) => stream.resolution === candidate);
    if (index >= 0) return index;
  }
  return streams.length ? 0 : -1;
}

export function findNextTorboxStreamIndex(
  streams: TorboxStream[],
  currentIndex: number,
  failedSourceIds: ReadonlySet<string>,
): number {
  const currentQuality = streams[currentIndex]?.resolution;
  for (let step = 1; step <= streams.length; step += 1) {
    const index = (currentIndex + step) % streams.length;
    if (
      streams[index].resolution === currentQuality &&
      !failedSourceIds.has(streams[index].id)
    ) return index;
  }
  for (let step = 1; step <= streams.length; step += 1) {
    const index = (currentIndex + step) % streams.length;
    if (!failedSourceIds.has(streams[index].id)) return index;
  }
  return -1;
}
