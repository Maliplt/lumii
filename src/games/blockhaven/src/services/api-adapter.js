"use strict";
(function (root) {
  function createGameApiAdapter(options, request = root.fetch.bind(root)) {
    const base = options.baseUrl.replace(/\/$/, "");
    if (!/^https?:\/\//.test(base) && !base.startsWith("/"))
      throw Error("Geçersiz API adresi");
    const route = options.path || "/profiles/{profileId}/games/{gameId}/save";
    if (!route.includes("{profileId}") || !route.includes("{gameId}"))
      throw Error("API yolu profil ve oyun kimliği içermeli");
    async function send(identity, method, body) {
      const url =
        base +
        route.replace(/\{(userId|profileId|gameId)\}/g, (_, field) =>
          encodeURIComponent(identity[field]),
        );
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        options.timeoutMs || 10000,
      );
      try {
        const extra =
          typeof options.getHeaders === "function"
            ? await options.getHeaders()
            : {};
        const response = await request(url, {
          method,
          credentials: options.credentials || "include",
          cache: "no-store",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            ...(body ? { "Content-Type": "application/json" } : {}),
            ...extra,
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        if (method === "GET" && response.status === 404) return null;
        if (!response.ok) {
          const error = Error(
            response.status === 409
              ? "Kayıt başka bir cihazda değişti"
              : "API isteği başarısız: " + response.status,
          );
          error.status = response.status;
          throw error;
        }
        const result = await response.json();
        if (!result || !["string", "number"].includes(typeof result.revision))
          throw Error("API yanıtında revision gerekli");
        if (method === "GET" && !result.record)
          throw Error("API yanıtında record gerekli");
        return result;
      } finally {
        clearTimeout(timer);
      }
    }
    return Object.freeze({
      load: (identity) => send(identity, "GET"),
      save: (identity, record, { expectedRevision }) =>
        send(identity, "PUT", { record, expectedRevision }),
    });
  }
  root.createGameApiAdapter = createGameApiAdapter;
  const config = root.GameSuiteConfig;
  if (config?.api?.enabled && !config.adapter)
    config.adapter = createGameApiAdapter(config.api);
  if (typeof module !== "undefined") module.exports = { createGameApiAdapter };
})(typeof window !== "undefined" ? window : globalThis);
