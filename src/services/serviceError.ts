import axios from "axios";

export type ServiceErrorCode =
  | "configuration"
  | "unauthorized"
  | "not-found"
  | "request"
  | "rate-limit"
  | "network"
  | "server"
  | "playback"
  | "unknown";

interface ServiceErrorOptions {
  status?: number;
  cause?: unknown;
}

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly status?: number;

  constructor(
    code: ServiceErrorCode,
    message: string,
    { status, cause }: ServiceErrorOptions = {},
  ) {
    super(message, { cause });
    this.name = "ServiceError";
    this.code = code;
    this.status = status;
  }
}

export interface ServiceErrorPresentation {
  title: string;
  message: string;
  retryable: boolean;
}

const ERROR_PRESENTATIONS: Record<ServiceErrorCode, ServiceErrorPresentation> = {
  configuration: {
    title: "İçerikler şu anda kullanılamıyor",
    message: "İçerik kataloğuna şu anda erişemiyoruz. Lütfen daha sonra yeniden deneyin.",
    retryable: true,
  },
  unauthorized: {
    title: "İçerik servisine erişilemiyor",
    message: "İçeriklere erişim geçici olarak sağlanamıyor. Lütfen daha sonra yeniden deneyin.",
    retryable: true,
  },
  "not-found": {
    title: "Bu içerik bulunamadı",
    message: "İçerik kaldırılmış, taşınmış veya artık erişime açık olmayabilir.",
    retryable: false,
  },
  request: {
    title: "İstek tamamlanamadı",
    message: "İçerik isteği işlenemedi. Sayfayı yenileyip yeniden deneyin.",
    retryable: true,
  },
  "rate-limit": {
    title: "İçerik servisi şu anda yoğun",
    message: "Kısa bir süre bekleyip yeniden deneyin.",
    retryable: true,
  },
  network: {
    title: "Bağlantı kurulamadı",
    message: "İnternet bağlantınızı kontrol edip yeniden deneyin.",
    retryable: true,
  },
  server: {
    title: "İçerik servisi geçici olarak kullanılamıyor",
    message: "Sorunu gidermek için çalışıyoruz. Lütfen daha sonra yeniden deneyin.",
    retryable: true,
  },
  playback: {
    title: "Yayın başlatılamadı",
    message: "Bağlantınızı kontrol edip yeniden deneyin.",
    retryable: true,
  },
  unknown: {
    title: "İşlem tamamlanamadı",
    message: "Beklenmeyen bir sorun oluştu. Lütfen yeniden deneyin.",
    retryable: true,
  },
};

export function serviceErrorPresentation(
  code: ServiceErrorCode,
): ServiceErrorPresentation {
  return ERROR_PRESENTATIONS[code];
}

export function serviceErrorMessage(code: ServiceErrorCode): string {
  return ERROR_PRESENTATIONS[code].message;
}

export function normalizeServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (!error.response) {
      return new ServiceError("network", serviceErrorMessage("network"), { cause: error });
    }
    if (status === 401 || status === 403) {
      return new ServiceError("unauthorized", serviceErrorMessage("unauthorized"), {
        status,
        cause: error,
      });
    }
    if (status === 404) {
      return new ServiceError("not-found", serviceErrorMessage("not-found"), {
        status,
        cause: error,
      });
    }
    if (status === 429) {
      return new ServiceError("rate-limit", serviceErrorMessage("rate-limit"), {
        status,
        cause: error,
      });
    }
    if (status != null && status >= 400 && status < 500) {
      return new ServiceError("request", serviceErrorMessage("request"), {
        status,
        cause: error,
      });
    }
    if (status != null && status >= 500) {
      return new ServiceError("server", serviceErrorMessage("server"), {
        status,
        cause: error,
      });
    }
  }

  return new ServiceError("unknown", serviceErrorMessage("unknown"), { cause: error });
}

export function playbackError(cause?: unknown): ServiceError {
  return new ServiceError("playback", serviceErrorMessage("playback"), { cause });
}
