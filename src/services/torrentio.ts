import axios from "axios";
import type { StreamSource, TorrentioResponse, TorrentioStream } from "../types/types";

const TORRENTIO_BASE_URL = "https://torrentio.strem.fun";

export interface TorrentioStreamRequest {
  type: "movie" | "tv" | "series";
  imdbId: string;
  season?: number;
  episode?: number;
  realDebridApiKey?: string;
  providers?: string[];
  sort?: "qualitysize" | "seeders" | "size";
}

/**
 * Torrentio manifest/stream yapılandırma URL parçasını oluşturur.
 */
export function buildTorrentioConfigString(options: {
  realDebridApiKey?: string;
  providers?: string[];
  sort?: string;
}): string {
  const parts: string[] = [];

  if (options.providers && options.providers.length > 0) {
    parts.push(`providers=${options.providers.join(",")}`);
  }

  if (options.sort) {
    parts.push(`sort=${options.sort}`);
  }

  if (options.realDebridApiKey?.trim()) {
    parts.push(`realdebrid=${options.realDebridApiKey.trim()}`);
  }

  return parts.length > 0 ? parts.join("|") : "";
}

/**
 * Torrentio stream endpoint URL'sini döndürür.
 */
export function buildTorrentioStreamPath({
  type,
  imdbId,
  season = 1,
  episode = 1,
  realDebridApiKey,
  providers,
  sort,
}: TorrentioStreamRequest): string {
  const cleanImdb = imdbId.trim();
  const config = buildTorrentioConfigString({ realDebridApiKey, providers, sort });
  const prefix = config ? `${config}/` : "";

  if (type === "movie") {
    return `${TORRENTIO_BASE_URL}/${prefix}stream/movie/${cleanImdb}.json`;
  }

  const s = Math.max(1, Number(season) || 1);
  const e = Math.max(1, Number(episode) || 1);
  return `${TORRENTIO_BASE_URL}/${prefix}stream/series/${cleanImdb}:${s}:${e}.json`;
}

/**
 * Ham Torrentio akış başlığını ve açıklamasını ayrıştırarak kullanıcı dostu StreamSource nesnesi üretir.
 */
export function parseTorrentioStream(
  stream: TorrentioStream,
  index: number,
): StreamSource | null {
  if (!stream.url && !stream.infoHash) {
    return null;
  }

  const nameText = stream.name || "";
  const titleText = stream.title || "";
  const fullText = `${nameText} ${titleText}`;

  const isRealDebrid =
    nameText.includes("[RD+]") ||
    nameText.includes("[RD") ||
    nameText.includes("RD+") ||
    titleText.includes("RealDebrid");

  // Çözünürlük tespiti
  let quality: StreamSource["quality"] = "Bilinmeyen";
  if (/4k|2160p|uhd/i.test(fullText)) {
    quality = "4K";
  } else if (/1080p|fhd/i.test(fullText)) {
    quality = "1080p";
  } else if (/720p|hd/i.test(fullText)) {
    quality = "720p";
  } else if (/480p/i.test(fullText)) {
    quality = "480p";
  } else if (/cam|ts|telesync|dvdrip|scr/i.test(fullText)) {
    quality = "SD";
  }

  // Dosya boyutu tespiti (💾 12.4 GB veya 2.3 GB)
  const sizeMatch =
    titleText.match(/💾\s*([\d.]+\s*(?:GB|MB|TB|GiB|MiB))/i) ||
    titleText.match(/([\d.]+\s*(?:GB|MB|TB|GiB|MiB))/i);
  const size = sizeMatch ? sizeMatch[1].trim() : undefined;

  // Tracker / Kaynak tespiti (⚙️ RARBG / TorrentGalaxy)
  const trackerMatch = titleText.match(/⚙️\s*([^\n\r|]+)/i);
  const tracker = trackerMatch ? trackerMatch[1].trim() : undefined;

  // Ses formatı tespiti (🔊 Atmos 5.1 / DTS-HD)
  const audioMatch = titleText.match(/🔊\s*([^\n\r]+)/i);
  const audio = audioMatch ? audioMatch[1].trim() : undefined;

  // Video kodek tespiti
  const codecMatch = fullText.match(
    /\b(x264|x265|HEVC|H\.?264|H\.?265|AV1|AVC|HDR10\+?|HDR|DV|Dolby Vision|Remux)\b/i,
  );
  const codec = codecMatch ? codecMatch[0].trim() : undefined;

  // Format tespiti
  const lowerUrl = (stream.url || "").toLowerCase();
  const lowerFull = fullText.toLowerCase();
  
  let format: StreamSource["format"] = "other";
  if (lowerUrl.endsWith(".mp4") || lowerFull.includes(".mp4") || lowerFull.includes(" mp4")) {
    format = "mp4";
  } else if (lowerUrl.endsWith(".mkv") || lowerFull.includes(".mkv") || lowerFull.includes(" mkv")) {
    format = "mkv";
  } else if (lowerUrl.endsWith(".webm") || lowerFull.includes(".webm")) {
    format = "webm";
  }

  // Tarayıcı uyumluluğu tespiti
  const isH264 = lowerFull.includes("x264") || lowerFull.includes("h.264") || lowerFull.includes("h264") || lowerFull.includes("avc");
  const isHevcOrAv1 = lowerFull.includes("hevc") || lowerFull.includes("x265") || lowerFull.includes("h.265") || lowerFull.includes("h265") || lowerFull.includes("av1");
  const isLosslessAudio = lowerFull.includes("truehd") || lowerFull.includes("dts-hd") || lowerFull.includes("flac");

  const isBrowserFriendly =
    format === "mp4" ||
    (isH264 && !isHevcOrAv1 && !isLosslessAudio) ||
    lowerFull.includes("yify") ||
    lowerFull.includes("yts") ||
    lowerFull.includes("web-dl") ||
    lowerFull.includes("webrip");

  // Başlık satırı
  const lines = titleText.split(/[\n\r]+/);
  const cleanTitle = lines[0]?.trim() || nameText || `Kaynak ${index + 1}`;

  return {
    id: `torrentio-${index}-${stream.infoHash || index}`,
    title: cleanTitle,
    quality,
    size,
    codec,
    audio,
    tracker,
    format,
    isBrowserFriendly,
    isRealDebrid,
    url: stream.url || "",
    originalName: nameText,
    originalTitle: titleText,
  };
}

/**
 * Torrentio üzerinden kullanılabilir video akışlarını çeker.
 */
export async function fetchTorrentioStreams(
  request: TorrentioStreamRequest,
  signal?: AbortSignal,
): Promise<StreamSource[]> {
  if (!request.imdbId?.trim()) {
    return [];
  }

  const url = buildTorrentioStreamPath(request);

  try {
    const response = await axios.get<TorrentioResponse>(url, {
      signal,
      timeout: 12_000,
    });

    const rawStreams = response.data?.streams || [];
    const parsed = rawStreams
      .map((s, idx) => parseTorrentioStream(s, idx))
      .filter((s): s is StreamSource => s !== null && !!s.url);

    // Sıralama:
    // 1. Real-Debrid önbellekli akışlar (RD+)
    // 2. Tarayıcı uyumlu formatlar (MP4 / x264 / AAC - çökme ve 500 hatalarını engeller)
    // 3. Kalite (1080p > 4K > 720p)
    const qualityWeight: Record<StreamSource["quality"], number> = {
      "1080p": 4,
      "4K": 3,
      "720p": 2,
      "480p": 1,
      "SD": 0,
      "Bilinmeyen": 0,
    };

    return parsed.sort((a, b) => {
      // 1. RD önbellek
      if (a.isRealDebrid !== b.isRealDebrid) {
        return a.isRealDebrid ? -1 : 1;
      }
      // 2. Tarayıcı dostu format
      if (a.isBrowserFriendly !== b.isBrowserFriendly) {
        return a.isBrowserFriendly ? -1 : 1;
      }
      // 3. Çözünürlük
      const qDiff = qualityWeight[b.quality] - qualityWeight[a.quality];
      if (qDiff !== 0) return qDiff;

      return 0;
    });
  } catch {
    return [];
  }
}
