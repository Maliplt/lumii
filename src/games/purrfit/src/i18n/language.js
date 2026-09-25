"use strict";
(function (V) {
  V.LANGUAGES = ["tr", "en", "de", "fr", "it", "es", "ar"];
  const RTL = ["ar"];

  const lookup = (table, key) => key.split(".").reduce((node, part) => (node == null ? undefined : node[part]), table);
  const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
  const listeners = new Set();

  V.i18n = {
    lang: "en",

    detect() {
      for (const tag of navigator.languages || [navigator.language || "en"]) {
        const code = String(tag).toLowerCase().split("-")[0];
        if (V.LANGUAGES.includes(code)) return code;
      }
      return "en";
    },

    set(code) {
      this.lang = V.LANGUAGES.includes(code) ? code : "en";
      document.documentElement.lang = this.lang;
      document.documentElement.dir = RTL.includes(this.lang) ? "rtl" : "ltr";
      document.title = this.t("title");
      listeners.forEach((listener) => listener(this.lang));
    },

    t(key, vars = {}) {
      const value = lookup(V.LOCALES[this.lang], key) ?? lookup(V.LOCALES.en, key);
      return typeof value === "string" ? fill(value, vars) : key;
    },

    onChange(listener) {
      listeners.add(listener);
    },
  };

  V.t = (key, vars) => V.i18n.t(key, vars);
})(window.Purrfit);
