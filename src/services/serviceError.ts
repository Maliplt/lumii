import axios from "axios";

export type ServiceErrorCode =
  | "configuration"
  | "unauthorized"
  | "not-found"
  | "request"
  | "rate-limit"
  | "timeout"
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

export interface ServiceErrorOptions {
  readonly status?: number;
  readonly cause?: unknown;
}

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly status?: number;

  constructor(code: ServiceErrorCode, { status, cause }: ServiceErrorOptions = {}) {
    super(serviceErrorMessage(code), { cause });
    this.name = "ServiceError";
    this.code = code;
    this.status = status;
  }
}

export interface ServiceErrorPresentation {
  readonly title: string;
  readonly message: string;
  readonly retryable: boolean;
}

const ERROR_PRESENTATIONS: Record<ServiceErrorCode, ServiceErrorPresentation> = {
  configuration: {
    title: "Hizmet şu anda kullanılamıyor",
    message: "Bu özellik geçici olarak kullanılamıyor. Lütfen daha sonra yeniden deneyin.",
    retryable: false,
  },
  unauthorized: {
    title: "Servise erişilemiyor",
    message: "İşlem için gerekli servis erişimi sağlanamıyor. Lütfen daha sonra yeniden deneyin.",
    retryable: true,
  },
  "not-found": {
    title: "Aradığınız içeriğe şu anda ulaşamıyoruz",
    message: "İçerik kaldırılmış, taşınmış veya artık yayında olmayabilir.",
    retryable: false,
  },
  request: {
    title: "İstek tamamlanamadı",
    message: "Gönderilen istek işlenemedi. Bilgileri kontrol edip yeniden deneyin.",
    retryable: true,
  },
  "rate-limit": {
    title: "Servis şu anda yoğun",
    message: "Kısa bir süre bekleyip yeniden deneyin.",
    retryable: true,
  },
  timeout: {
    title: "İstek zaman aşımına uğradı",
    message: "Bağlantı beklenenden uzun sürdü. Lütfen yeniden deneyin.",
    retryable: true,
  },
  network: {
    title: "Bağlantı kurulamadı",
    message: "İnternet bağlantınızı kontrol edip yeniden deneyin.",
    retryable: true,
  },
  server: {
    title: "Servis geçici olarak kullanılamıyor",
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

const HTTP_ERROR_PRESENTATIONS: Partial<
  Record<number, ServiceErrorPresentation>
> = {
  400: {
    title: "İstek geçersiz",
    message: "Gönderilen bilgiler işlenemedi. Bilgileri kontrol edip yeniden deneyin.",
    retryable: true,
  },
  401: {
    title: "Erişim doğrulanamadı",
    message: "İşlem için gerekli erişim doğrulanamadı. Lütfen yeniden deneyin.",
    retryable: true,
  },
  403: {
    title: "Bu işlem için yetkiniz yok",
    message: "Bu içeriğe veya işleme erişim izniniz bulunmuyor.",
    retryable: false,
  },
  404: {
    title: "İçerik bulunamadı",
    message: "İçerik kaldırılmış, taşınmış veya artık yayında olmayabilir.",
    retryable: false,
  },
  408: {
    title: "İstek zaman aşımına uğradı",
    message: "Sunucudan zamanında yanıt alınamadı. Lütfen yeniden deneyin.",
    retryable: true,
  },
  429: {
    title: "Çok fazla istek gönderildi",
    message: "Kısa bir süre bekleyip yeniden deneyin.",
    retryable: true,
  },
  500: {
    title: "Sunucuda bir hata oluştu",
    message: "İstek sunucuda tamamlanamadı. Lütfen daha sonra yeniden deneyin.",
    retryable: true,
  },
  502: {
    title: "İçerik sağlayıcısına ulaşılamıyor",
    message: "Bağlı servis geçerli bir yanıt vermedi. Lütfen yeniden deneyin.",
    retryable: true,
  },
  503: {
    title: "Servis şu anda yanıt veremiyor",
    message: "Servis bakımda veya yoğun olabilir. Kısa bir süre sonra yeniden deneyin.",
    retryable: true,
  },
  504: {
    title: "Bağlı servis zamanında yanıt vermedi",
    message: "İstek beklenenden uzun sürdü. Lütfen yeniden deneyin.",
    retryable: true,
  },
};

export function serviceErrorPresentation(
  code: ServiceErrorCode,
  status?: number,
): ServiceErrorPresentation {
  const isHttpResponseError =
    code === "unauthorized" ||
    code === "not-found" ||
    code === "request" ||
    code === "rate-limit" ||
    code === "timeout" ||
    code === "server";
  return isHttpResponseError && status != null
    ? (HTTP_ERROR_PRESENTATIONS[status] ?? ERROR_PRESENTATIONS[code])
    : ERROR_PRESENTATIONS[code];
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
  timeout: 408,
  network: 503,
  server: 500,
  playback: 502,
  unknown: 500,
};

export function serviceErrorStatus(error: ServiceError): number {
  return error.status ?? ERROR_STATUS[error.code];
}

function codeFromStatus(status: number | undefined): ServiceErrorCode | null {
  if (status == null) return null;
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 404) return "not-found";
  if (status === 408 || status === 504) return "timeout";
  if (status === 429) return "rate-limit";
  if (status >= 400 && status < 500) return "request";
  if (status >= 500) return "server";
  return null;
}

function errorFromStatus(status: number, cause: unknown): ServiceError {
  return new ServiceError(codeFromStatus(status) ?? "unknown", {
    status,
    cause,
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function parseHttpStatus(value: unknown): number | undefined {
  const status =
    typeof value === "string" && /^\d{3}$/.test(value.trim())
      ? Number(value)
      : value;
  return typeof status === "number" &&
    Number.isInteger(status) &&
    status >= 400 &&
    status <= 599
    ? status
    : undefined;
}

function statusFromUnknown(error: unknown): number | undefined {
  const root = asRecord(error);
  if (!root) return undefined;

  const response = asRecord(root.response);
  const responseData = asRecord(response?.data);
  const data = asRecord(root.data);
  const candidates = [
    root.status,
    root.statusCode,
    root.status_code,
    response?.status,
    response?.statusCode,
    response?.status_code,
    responseData?.status,
    responseData?.statusCode,
    responseData?.status_code,
    data?.status,
    data?.statusCode,
    data?.status_code,
  ];

  for (const candidate of candidates) {
    const status = parseHttpStatus(candidate);
    if (status != null) return status;
  }
  return undefined;
}

export function normalizeServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      status === 408 ||
      status === 504
    ) {
      return new ServiceError("timeout", { status, cause: error });
    }
    if (!error.response) {
      return new ServiceError("network", { cause: error });
    }
    if (status != null) return errorFromStatus(status, error);
  }

  const status = statusFromUnknown(error);
  if (status != null) return errorFromStatus(status, error);

  if (error instanceof Error) {
    if (
      error.name === "TimeoutError" ||
      /\b(timeout|timed out)\b/i.test(error.message)
    ) {
      return new ServiceError("timeout", { cause: error });
    }
    if (
      error instanceof TypeError &&
      /\b(fetch|network|load failed|failed to fetch)\b/i.test(error.message)
    ) {
      return new ServiceError("network", { cause: error });
    }
  }

  return new ServiceError("unknown", { cause: error });
}

export function resolveServiceError(
  error: unknown,
  context: ServiceErrorContext,
) {
  const normalized = normalizeServiceError(error);
  const status = serviceErrorStatus(normalized);
  return {
    error: normalized,
    presentation: serviceErrorPresentation(normalized.code, status),
    status,
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
  return new ServiceError("playback", { cause });
}
