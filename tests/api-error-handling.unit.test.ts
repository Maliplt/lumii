import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, test } from "vitest";
import {
  optionalServiceRequest,
  resolveServiceError,
  ServiceError,
} from "../src/services/serviceError";

function apiResponseError(status: number): AxiosError {
  return new AxiosError(
    `HTTP ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    undefined,
    undefined,
    { status } as AxiosResponse,
  );
}

describe("API ve bağlantı hataları", () => {
  test("API cevapları doğru karşılanmalı", () => {
    const cases = [
      [400, "request", "İstek geçersiz", true],
      [401, "unauthorized", "Erişim doğrulanamadı", true],
      [403, "unauthorized", "Bu işlem için yetkiniz yok", false],
      [404, "not-found", "İçerik bulunamadı", false],
      [408, "timeout", "İstek zaman aşımına uğradı", true],
      [429, "rate-limit", "Çok fazla istek gönderildi", true],
      [500, "server", "Sunucuda bir hata oluştu", true],
      [502, "server", "İçerik sağlayıcısına ulaşılamıyor", true],
      [503, "server", "Servis şu anda yanıt veremiyor", true],
      [504, "timeout", "Bağlı servis zamanında yanıt vermedi", true],
    ] as const;

    for (const [status, code, title, retryable] of cases) {
      const result = resolveServiceError(apiResponseError(status), "page");

      expect(result.status, `HTTP ${status}`).toBe(status);
      expect(result.error.code, `HTTP ${status}`).toBe(code);
      expect(result.presentation.title, `HTTP ${status}`).toBe(title);
      expect(result.presentation.retryable, `HTTP ${status}`).toBe(retryable);
    }
  });

  test("Response içindeki 503 kodu da yakalanmalı", () => {
    const result = resolveServiceError(
      { response: { data: { statusCode: "503" } } },
      "section",
    );

    expect(result).toMatchObject({ status: 503, surface: "screen" });
    expect(result.presentation.title).toBe("Servis şu anda yanıt veremiyor");
  });

  test("Bağlantı kesilince doğru mesaj gösterilmeli", () => {
    const result = resolveServiceError(new TypeError("Failed to fetch"), "action");

    expect(result.error.code).toBe("network");
    expect(result.surface).toBe("toast");
    expect(result.presentation.message).toContain("İnternet bağlantınızı");
  });

  test("Zaman aşımı sunucu hatası sayılmamalı", () => {
    const timeout = new AxiosError("timeout", AxiosError.ECONNABORTED);
    const result = resolveServiceError(timeout, "action");

    expect(result.error.code).toBe("timeout");
    expect(result.presentation.retryable).toBe(true);
  });

  test("Hata doğru yerde gösterilmeli", () => {
    expect(resolveServiceError({ status: 500 }, "page").surface).toBe("screen");
    expect(resolveServiceError({ status: 500 }, "section").surface).toBe("screen");
    expect(resolveServiceError({ status: 500 }, "action").surface).toBe("toast");
    expect(resolveServiceError({ status: 500 }, "enhancement").surface).toBe("silent");
  });

  test("Fragman hatası sayfanın geri kalanını bozmamalı", async () => {
    const result = await optionalServiceRequest(
      Promise.reject(new Error("preview service unavailable")),
    );

    expect(result).toBeNull();
  });

  test("Bilinmeyen hatada güvenli bir mesaj gösterilmeli", () => {
    const result = resolveServiceError({ beklenmeyen: true }, "action");

    expect(result.error).toBeInstanceOf(ServiceError);
    expect(result.error.code).toBe("unknown");
    expect(result.presentation.title).toBe("İşlem tamamlanamadı");
  });

  test("Cevap alınamayan istek bağlantı hatası sayılmalı", () => {
    const error = new AxiosError("Network Error", AxiosError.ERR_NETWORK);
    const result = resolveServiceError(error, "action");

    expect(result.error.code).toBe("network");
    expect(result.presentation.title).toBe("Bağlantı kurulamadı");
    expect(result.surface).toBe("toast");
  });
});
