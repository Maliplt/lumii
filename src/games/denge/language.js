"use strict";
function createLanguagePicker(onSelect) {
  const toggle = document.getElementById("language"),
    panel = document.getElementById("language-panel");
  document.body.append(panel);
  function position() {
    if (panel.hidden) return;
    const rect = toggle.getBoundingClientRect(),
      width = panel.offsetWidth;
    panel.style.left =
      Math.max(12, Math.min(innerWidth - width - 12, rect.right - width)) +
      "px";
    panel.style.top =
      Math.max(
        8,
        Math.min(innerHeight - panel.offsetHeight - 12, rect.bottom + 12),
      ) + "px";
  }
  window.addEventListener("resize", position);
  const flags = {
    tr: '<path fill="#e43840" d="M0 0h30v20H0z"/><circle cx="12" cy="10" r="6" fill="white"/><circle cx="14" cy="9" r="4.8" fill="#e43840"/><path fill="white" d="m21 6 1 3 3 .2-2.4 1.8.8 3-2.4-1.8-2.5 1.8 1-3-2.5-1.8 3-.2Z"/>',
    en: '<path fill="#243a75" d="M0 0h30v20H0z"/><path stroke="white" stroke-width="5" d="m0 0 30 20M30 0 0 20"/><path stroke="#d63844" stroke-width="2" d="m0 0 30 20M30 0 0 20"/><path stroke="white" stroke-width="7" d="M15 0v20M0 10h30"/><path stroke="#d63844" stroke-width="4" d="M15 0v20M0 10h30"/>',
    es: '<path fill="#bc2934" d="M0 0h30v20H0z"/><path fill="#f3c846" d="M0 5h30v10H0z"/><path fill="#b94942" d="M8 8h4v5H8z"/><path fill="#d6a535" d="M7 7h6v2H7z"/>',
    fr: '<path fill="#fff" d="M0 0h30v20H0z"/><path fill="#28539a" d="M0 0h10v20H0z"/><path fill="#e3484e" d="M20 0h10v20H20z"/>',
    ar: '<path fill="#fff" d="M0 0h30v20H0z"/><path fill="#c83c3e" d="M0 0h30v6.7H0z"/><path fill="#252626" d="M0 13.3h30V20H0z"/><path fill="#b39a50" d="m15 7 3 1-1 4h-4l-1-4Z"/>',
    de: '<path fill="#262627" d="M0 0h30v20H0z"/><path fill="#d84045" d="M0 6.7h30v6.7H0z"/><path fill="#f1c641" d="M0 13.3h30V20H0z"/>',
  };
  const names = {
    tr: "Türkçe",
    en: "English",
    es: "Español",
    fr: "Français",
    ar: "العربية",
    de: "Deutsch",
  };
  const buttons = Object.entries(names).map(([language, name]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.language = language;
    button.lang = language;
    button.innerHTML = `<svg class="flag" viewBox="0 0 30 20" aria-hidden="true">${flags[language]}</svg><span>${name}</span>`;
    button.onclick = () => {
      onSelect(language);
    };
    panel.append(button);
    return button;
  });
  function close(focus = false) {
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    if (focus) toggle.focus();
  }
  toggle.onclick = () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    position();
    if (open)
      (
        buttons.find((b) => b.getAttribute("aria-pressed") === "true") ||
        buttons[0]
      ).focus();
  };
  document.addEventListener("pointerdown", (event) => {
    if (
      !panel.hidden &&
      !panel.contains(event.target) &&
      !toggle.contains(event.target)
    )
      close();
  });
  document.addEventListener(
    "keydown",
    (event) => {
      if (panel.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close(true);
      }
      if (
        ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const index = buttons.indexOf(document.activeElement),
          delta =
            event.key === "ArrowRight"
              ? 1
              : event.key === "ArrowLeft"
                ? -1
                : event.key === "ArrowDown"
                  ? 2
                  : -2;
        buttons[(index + delta + buttons.length) % buttons.length].focus();
      }
    },
    true,
  );
  return {
    update(language) {
      position();
      toggle.textContent = language.toUpperCase();
      toggle.setAttribute("aria-label", names[language] + " · Language");
      buttons.forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.language === language),
        ),
      );
    },
  };
}
