"use strict";
// message windows in the old desktop style
(function (M) {
  const { h } = M.dom;
  const stack = [];

  document.addEventListener("keydown", (event) => {
    const top = stack[stack.length - 1];
    if (!top) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      top.close("dismiss");
    }
  });

  // actions: [{ label, primary, onClick, keepOpen }]
  function open({ title, icon = null, body, actions = [], onClose, className = "" }) {
    const root = document.getElementById("dialogs");
    const returnFocus = document.activeElement;
    const panel = h("div", { class: `win dialog ${className}`, role: "dialog", "aria-modal": "true", "aria-label": title });
    const backdrop = h("div", { class: "dialog-backdrop" }, panel);
    const dialog = {
      panel,
      closed: false,
      close(reason = "action") {
        if (dialog.closed) return;
        dialog.closed = true;
        stack.splice(stack.indexOf(dialog), 1);
        backdrop.remove();
        if (returnFocus instanceof HTMLElement) returnFocus.focus({ preventScroll: true });
        onClose?.(reason);
      },
    };
    panel.append(
      h(
        "div",
        { class: "titlebar" },
        icon ? M.dom.pixelIcon(icon, 16) : null,
        h("span", { class: "titlebar__text" }, title),
        h("div", { class: "titlebar__buttons" }, h("button", { type: "button", class: "cap cap--close", label: "window.close", onclick: () => dialog.close("dismiss") }, h("span", { class: "cap__x" }))),
      ),
    );
    panel.append(h("div", { class: "dialog__body" }, body));
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
                class: `btn${action.primary ? " btn--default" : ""}`,
                onclick: () => {
                  if (action.onClick?.(dialog) === false) return;
                  if (!action.keepOpen) dialog.close("action");
                },
              },
              action.label,
            ),
          ),
        ),
      );
    }
    root.append(backdrop);
    stack.push(dialog);
    M.Audio.play("chime");
    requestAnimationFrame(() => (panel.querySelector("input") || panel.querySelector(".btn--default") || panel.querySelector("button"))?.focus({ preventScroll: true }));
    return dialog;
  }

  M.Dialogs = {
    open,
    get isOpen() {
      return stack.length > 0;
    },
    closeAll() {
      [...stack].forEach((dialog) => dialog.close("replaced"));
    },
  };
})(window.Mines98);
