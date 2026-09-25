"use strict";
(function (V) {
  const { h, icon } = V.dom;
  const stack = [];

  document.addEventListener("keydown", (event) => {
    const top = stack[stack.length - 1];
    if (event.key === "Escape" && top?.dismissible) {
      event.stopPropagation();
      top.close("dismiss");
    }
  });

  // actions: [{ label, kind: 'primary' | 'ghost', icon, onClick, keepOpen }]
  function open({ title, body, actions = [], dismissible = true, onClose, className = "" }) {
    const root = document.getElementById("dialogs");
    const returnFocus = document.activeElement;
    const panel = h("div", { class: `dialog ${className}`, role: "dialog", "aria-modal": "true" });
    const backdrop = h("div", { class: "dialog-backdrop" }, panel);
    const dialog = {
      panel,
      dismissible,
      closed: false,
      close(reason = "action") {
        if (dialog.closed) return;
        dialog.closed = true;
        stack.splice(stack.indexOf(dialog), 1);
        backdrop.classList.add("is-closing");
        setTimeout(() => backdrop.remove(), 220);
        if (returnFocus instanceof HTMLElement) returnFocus.focus({ preventScroll: true });
        onClose?.(reason);
      },
    };
    if (title) panel.append(h("h2", { class: "dialog__title" }, title));
    if (body) panel.append(h("div", { class: "dialog__body" }, body));
    if (actions.length) {
      panel.append(
        h(
          "div",
          { class: "dialog__actions" },
          actions.map((action) =>
            h(
              "button",
              {
                type: "button",
                class: `chunky chunky--dialog chunky--${{ primary: "green", ghost: "white" }[action.kind] || action.kind || "white"}`,
                onclick: () => {
                  action.onClick?.(dialog);
                  if (!action.keepOpen) dialog.close("action");
                },
              },
              action.icon ? icon(action.icon, { size: 20 }) : null,
              h("span", {}, action.label),
            ),
          ),
        ),
      );
    }
    if (dismissible) {
      panel.append(h("button", { type: "button", class: "round round--white round--tiny dialog__close", label: "common.close", onclick: () => dialog.close("dismiss") }, icon("close", { size: 20 })));
      backdrop.addEventListener("pointerdown", (event) => event.target === backdrop && dialog.close("dismiss"));
    }
    root.append(backdrop);
    stack.push(dialog);
    requestAnimationFrame(() => (panel.querySelector(".chunky--green") || panel.querySelector("button"))?.focus({ preventScroll: true, focusVisible: false }));
    return dialog;
  }

  function confirm({ title, text }) {
    return new Promise((resolve) => {
      open({
        title,
        body: h("p", {}, text),
        actions: [
          { label: V.t("common.no"), kind: "ghost", onClick: () => resolve(false) },
          { label: V.t("common.yes"), kind: "primary", onClick: () => resolve(true) },
        ],
        onClose: (reason) => reason === "dismiss" && resolve(false),
      });
    });
  }

  function toast(text) {
    const box = document.getElementById("toasts");
    const el = h("div", { class: "toast" }, text);
    box.replaceChildren(el);
    setTimeout(() => el.classList.add("is-leaving"), 2800);
    setTimeout(() => el.remove(), 3200);
  }

  V.Dialogs = {
    open,
    confirm,
    toast,
    get isOpen() {
      return stack.length > 0;
    },
    closeAll() {
      [...stack].forEach((dialog) => dialog.close("replaced"));
    },
  };
})(window.Purrfit);
