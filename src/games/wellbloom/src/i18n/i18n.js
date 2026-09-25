import { RTL_LANGUAGES, SUPPORTED_LANGUAGES } from '../config.js';
import { Emitter } from '../core/emitter.js';
import ar from './locales/ar.js';
import de from './locales/de.js';
import en from './locales/en.js';
import es from './locales/es.js';
import fr from './locales/fr.js';
import it from './locales/it.js';
import tr from './locales/tr.js';

const LOCALES = { en, tr, de, fr, it, es, ar };

function lookup(table, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), table);
}

function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

// translations
class I18n extends Emitter {
  constructor() {
    super();
    this.language = 'en';
  }

  get languages() {
    return SUPPORTED_LANGUAGES.map((code) => ({ code, name: LOCALES[code].meta.name }));
  }

  detect() {
    const preferred = navigator.languages ?? [navigator.language ?? 'en'];
    for (const tag of preferred) {
      const code = tag.toLowerCase().split('-')[0];
      if (SUPPORTED_LANGUAGES.includes(code)) return code;
    }
    return 'en';
  }

  setLanguage(code) {
    this.language = SUPPORTED_LANGUAGES.includes(code) ? code : 'en';
    this.plurals = new Intl.PluralRules(this.language);
    const root = document.documentElement;
    root.lang = this.language;
    root.dir = RTL_LANGUAGES.includes(this.language) ? 'rtl' : 'ltr';
    this.apply(document);
    this.emit('change', this.language);
  }

  t(key, vars = {}) {
    const value = lookup(LOCALES[this.language], key) ?? lookup(LOCALES.en, key);
    if (typeof value !== 'string') return key;
    return fill(value, vars);
  }

  // plural-aware lookup: the entry is an object keyed by Intl plural category
  tp(key, count, vars = {}) {
    const forms = lookup(LOCALES[this.language], key) ?? lookup(LOCALES.en, key);
    if (typeof forms === 'string') return fill(forms, { n: count, ...vars });
    const text = forms?.[this.plurals.select(count)] ?? forms?.other ?? key;
    return fill(text, { n: count, ...vars });
  }

  // picks one entry from a list, e.g. a random celebration line
  pick(key) {
    const list = lookup(LOCALES[this.language], key) ?? lookup(LOCALES.en, key) ?? [key];
    return list[Math.floor(Math.random() * list.length)];
  }

  apply(root) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = this.t(el.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-label]').forEach((el) => {
      const label = this.t(el.dataset.i18nLabel);
      el.setAttribute('aria-label', label);
      el.title = label;
    });
  }
}

export const i18n = new I18n();
export const t = (key, vars) => i18n.t(key, vars);
