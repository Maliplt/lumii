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

export type ServiceErrorContext =
  | "page"
  | "section"
  | "action"
  | "enhancement";

type ServiceErrorSurface = "screen" | "toast" | "silent";

const SERVICE_ERROR_POLICY: Record<ServiceErrorContext, ServiceErrorSurface> = {
  page: "screen",
  section: "screen",
  action: "toast",
  enhancement: "silent",
};

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

interface ServiceErrorPresentation {
  title: string;
  message: string;
  retryable: boolean;
}

const ERROR_PRESENTATIONS: Record<ServiceErrorCode, ServiceErrorPresentation> = {
  configuration: {
    title: "İçerikler şu anda kullanılamıyor",
    message: "İçerik kataloğuna şu anda erişemiyoruz. Lütfen daha sonra yeniden deneyin.",
    retryable: false,
  },
  unauthorized: {
    title: "İçerik servisine erişilemiyor",
    message: "İçeriklere erişim geçici olarak sağlanamıyor. Lütfen daha sonra yeniden deneyin.",
    retryable: true,
  },
  "not-found": {
    title: "Aradığınız içeriğe şu anda ulaşamıyoruz",
    message: "İçerik kaldırılmış, taşınmış veya artık yayında olmayabilir.",
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

function serviceErrorSurface(
  context: ServiceErrorContext,
): ServiceErrorSurface {
  return SERVICE_ERROR_POLICY[context];
}

const ERROR_STATUS: Record<ServiceErrorCode, number> = {
  configuration: 503,
  unauthorized: 401,
  "not-found": 404,
  request: 400,
  "rate-limit": 429,
  network: 503,
  server: 500,
  playback: 502,
  unknown: 500,
};

export function serviceErrorStatus(error: ServiceError): number {
  return error.status ?? ERROR_STATUS[error.code];
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

  if (error instanceof Error) {
    const value = error as Error & { status?: number; statusCode?: number };
    const status = value.status ?? value.statusCode;
    if (status === 404) {
      return new ServiceError("not-found", serviceErrorMessage("not-found"), {
        status,
        cause: error,
      });
    }
    if (status === 401 || status === 403) {
      return new ServiceError("unauthorized", serviceErrorMessage("unauthorized"), {
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
    if (status != null && status >= 500) {
      return new ServiceError("server", serviceErrorMessage("server"), {
        status,
        cause: error,
      });
    }
    if (status != null && status >= 400) {
      return new ServiceError("request", serviceErrorMessage("request"), {
        status,
        cause: error,
      });
    }
  }

  return new ServiceError("unknown", serviceErrorMessage("unknown"), { cause: error });
}

export function resolveServiceError(
  error: unknown,
  context: ServiceErrorContext,
) {
  return {
    error: normalizeServiceError(error),
    surface: serviceErrorSurface(context),
  };
}

export async function optionalServiceRequest<T>(
  request: Promise<T>,
): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    const failure = resolveServiceError(error, "enhancement");
    if (failure.surface !== "silent") throw failure.error;
    return null;
  }
}

export function playbackError(cause?: unknown): ServiceError {
  return new ServiceError("playback", serviceErrorMessage("playback"), { cause });
}
