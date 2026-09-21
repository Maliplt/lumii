"use strict";
/** Compact paged level picker and short in-game rule note. */
function createJourneyView({ data, settings, t, onPlay, onClose }) {
  const $ = (id) => document.getElementById(id),
    local = (tr, en) => (settings.language === "tr" ? tr : en),
    totalLevels = TenJourney.TOTAL_LEVELS,
    pageSize = 20;
  let page = 0,
    activePointer = null,
    dragStart = 0,
    dragDistance = 0,
    suppressClick = false;

  function worldInfo(state, practice) {
    const notes = [];
    if (!practice && state.rules.min > 2)
      notes.push(
        local(
          `En az ${state.rules.min} taş`,
          `At least ${state.rules.min} tiles`,
        ),
      );
    if (!practice && state.rules.gravity === "up")
      notes.push(local("Taşlar yukarı düşer", "Tiles fall upward"));
    if (!practice && state.rules.gold)
      notes.push(local("İşaretli taş +50", "Marked tile +50"));
    $("rule-note").textContent = notes.join(" · ");
    $("rule-note").hidden = !notes.length;
  }

  function journeyMap() {
    page = Math.min(
      Math.floor((Math.max(1, data.level) - 1) / pageSize),
      Math.ceil(totalLevels / pageSize) - 1,
    );
    $("modal-title").textContent = local("Bölümler", "Levels");
    const picker = document.createElement("div"),
      toolbar = document.createElement("div"),
      previous = document.createElement("button"),
      range = document.createElement("strong"),
      next = document.createElement("button"),
      grid = document.createElement("div");
    picker.className = "level-picker";
    toolbar.className = "level-toolbar";
    grid.className = "level-grid";
    previous.className = next.className = "level-page-button";
    previous.textContent = "‹";
    next.textContent = "›";
    previous.setAttribute("aria-label", local("Önceki sayfa", "Previous page"));
    next.setAttribute("aria-label", local("Sonraki sayfa", "Next page"));

    function renderPage(direction = 0) {
      const first = page * pageSize + 1,
        last = Math.min(totalLevels, first + pageSize - 1);
      range.textContent = `${first}–${last}`;
      previous.disabled = page === 0;
      next.disabled = last >= totalLevels;
      grid.replaceChildren();
      for (let level = first; level <= last; level++) {
        const button = document.createElement("button"),
          stars = document.createElement("small"),
          earned = data.stars[level] || 0;
        button.className =
          "level-node" + (level === data.level ? " current" : "");
        button.disabled = level > data.level;
        button.textContent = level;
        button.setAttribute(
          "aria-label",
          `${t("level")} ${level}, ${earned}/3 ★`,
        );
        if (earned) {
          stars.textContent = "★".repeat(earned);
          button.append(stars);
        }
        button.onclick = () => {
          if (!suppressClick) onPlay(level);
        };
        grid.append(button);
      }
      grid.style.transform = "";
      grid.style.opacity = "";
      if (direction)
        grid.animate?.(
          [
            { opacity: 0.25, transform: `translateX(${direction * 34}px)` },
            { opacity: 1, transform: "translateX(0)" },
          ],
          { duration: 190, easing: "cubic-bezier(.2,.8,.3,1)" },
        );
    }
    function changePage(direction) {
      const target = Math.max(
        0,
        Math.min(Math.ceil(totalLevels / pageSize) - 1, page + direction),
      );
      if (target === page) return false;
      page = target;
      renderPage(direction);
      return true;
    }
    previous.onclick = () => changePage(-1);
    next.onclick = () => changePage(1);
    picker.onpointerdown = (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      activePointer = event.pointerId;
      dragStart = event.clientX;
      dragDistance = 0;
    };
    picker.onpointermove = (event) => {
      if (event.pointerId !== activePointer) return;
      dragDistance = event.clientX - dragStart;
      if (Math.abs(dragDistance) < 4) return;
      event.preventDefault();
      picker.classList.add("dragging");
      if (!picker.hasPointerCapture(event.pointerId))
        picker.setPointerCapture(event.pointerId);
      const offset = Math.max(-72, Math.min(72, dragDistance * 0.55));
      grid.style.transform = `translateX(${offset}px)`;
      grid.style.opacity = String(1 - Math.min(0.28, Math.abs(offset) / 260));
    };
    function finishDrag(event, cancelled = false) {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      picker.classList.remove("dragging");
      const moved = Math.abs(dragDistance) >= 4,
        swiped = !cancelled && Math.abs(dragDistance) >= 44;
      if (moved) {
        suppressClick = true;
        setTimeout(() => (suppressClick = false), 0);
      }
      if (swiped) {
        if (!changePage(dragDistance < 0 ? 1 : -1)) {
          grid.style.transform = "";
          grid.style.opacity = "";
        }
      } else {
        grid.style.transform = "";
        grid.style.opacity = "";
      }
      dragDistance = 0;
    }
    picker.onpointerup = (event) => finishDrag(event);
    picker.onpointercancel = (event) => finishDrag(event, true);
    toolbar.append(previous, range, next);
    picker.append(toolbar, grid);
    $("modal-copy").append(picker);
    const close = document.createElement("button");
    close.className = "secondary";
    close.textContent = t("close");
    close.onclick = onClose;
    $("modal-actions").append(close);
    renderPage();
  }
  return { worldInfo, journeyMap };
}
