"use strict";
(function (YB) {
  YB.LANGUAGES = ["tr", "en", "de", "fr", "it", "es"];

  const lookup = (table, key) => key.split(".").reduce((node, part) => (node == null ? undefined : node[part]), table);
  const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
  const listeners = new Set();

  YB.i18n = {
    lang: "tr",

    detect() {
      for (const tag of navigator.languages || [navigator.language || "tr"]) {
        const code = String(tag).toLowerCase().split("-")[0];
        if (YB.LANGUAGES.includes(code)) return code;
      }
      return "tr";
    },

    set(code) {
      this.lang = YB.LANGUAGES.includes(code) ? code : "tr";
      document.documentElement.lang = this.lang;
      document.title = this.t("title");
      listeners.forEach((listener) => listener(this.lang));
    },

    t(key, vars = {}) {
      const value = lookup(YB.LOCALES[this.lang], key) ?? lookup(YB.LOCALES.en, key);
      return typeof value === "string" ? fill(value, vars) : key;
    },

    onChange(listener) {
      listeners.add(listener);
    },
  };

  YB.t = (key, vars) => YB.i18n.t(key, vars);
})(window.YirmibirHani);
