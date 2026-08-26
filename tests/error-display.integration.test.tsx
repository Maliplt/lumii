import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import ServiceErrorView from "../src/components/feedback/ServiceErrorView";
import { ServiceError, type ServiceErrorCode } from "../src/services/serviceError";

const ERROR_CODE_BY_STATUS: Record<number, ServiceErrorCode> = {
  404: "not-found",
  500: "server",
  503: "server",
};

function renderError(status: number) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <ServiceErrorView
        error={new ServiceError(ERROR_CODE_BY_STATUS[status] ?? "unknown", { status })}
      />
    </MemoryRouter>,
  );
}

describe("Hata ekranları", () => {
  test("404 sayfası doğru açıklamayı ve dönüş bağlantısını göstermeli", () => {
    const html = renderError(404);

    expect(html).toContain(">404<");
    expect(html).toContain("İçerik kaldırılmış, taşınmış veya artık yayında olmayabilir.");
    expect(html).toContain("Ana Sayfa");
  });

  test("503 hatası servis durumunu doğru anlatmalı", () => {
    const html = renderError(503);

    expect(html).toContain(">503<");
    expect(html).toContain("Servis şu anda yanıt veremiyor");
    expect(html).toContain(
      "Servis bakımda veya yoğun olabilir. Kısa bir süre sonra yeniden deneyin.",
    );
  });

  test("500 hatası sunucu sorununu doğru anlatmalı", () => {
    const html = renderError(500);

    expect(html).toContain(">500<");
    expect(html).toContain("Sunucuda bir hata oluştu");
    expect(html).toContain(
      "İstek sunucuda tamamlanamadı. Lütfen daha sonra yeniden deneyin.",
    );
  });
});
