"use strict";
const createDengeTutorial = ({
  $,
  t,
  storage,
  audio,
  animate,
  tapEffects,
  reduceMotion,
  addButton,
  openDialog,
  closeDialog,
  onFinish,
}) => {
  let step = 0;
  let selection = [false, false, false, false];
  let pending = null;
  let seen = storage.get("tutorial.v1") === "done";

  function begin(next = null) {
    step = 0;
    selection = [false, false, false, false];
    pending = next;
    openDialog("tutorial");
  }

  function cancelPending() {
    pending = null;
  }

  function render() {
    $("dialog-actions").replaceChildren();
    $("dialog-title").textContent = t("tutorialTitle");
    if (!$("dialog-body").querySelector(".tutorial-board"))
      $("dialog-body").innerHTML =
        '<p class="tutorial-instruction" role="status"></p><div class="tutorial-board"></div><p class="tutorial-progress"></p>';
    $("dialog-body").querySelector(".tutorial-instruction").textContent = t(
      `tutorial${step}`,
    );
    $("dialog-body").querySelector(".tutorial-progress").textContent = t(
      "tutorialProgress",
      { number: Math.min(step + 1, 4) },
    );
    const board = $("dialog-body").querySelector(".tutorial-board");
    const values = [2, 4, 3, 5];
    const goals = [2, 5, 2, 5];
    const sums = [
      (selection[0] ? 2 : 0) + (selection[1] ? 4 : 0),
      (selection[2] ? 3 : 0) + (selection[3] ? 5 : 0),
      (selection[0] ? 2 : 0) + (selection[2] ? 3 : 0),
      (selection[1] ? 4 : 0) + (selection[3] ? 5 : 0),
    ];
    const expected = [0, 1, 1, 3][step];
    const target = (index) => {
      const element = document.createElement("div");
      element.className = `target${sums[index] === goals[index] ? " done" : sums[index] > goals[index] ? " over" : ""}`;
      element.innerHTML = `<span>${goals[index]}</span><small>${sums[index]} / ${goals[index]} ${sums[index] === goals[index] ? "✓" : ""}</small>`;
      return element;
    };
    for (let index = 0; index < 4; index++) {
      const button =
        board.querySelector(`[data-tutorial-cell="${index}"]`) ||
        document.createElement("button");
      button.className = `cell${selection[index] ? " selected" : ""}${index === expected ? " tutorial-expected" : ""}`;
      button.textContent = values[index];
      button.dataset.tutorialCell = index;
      button.setAttribute("aria-pressed", selection[index]);
      button.disabled = step === 4;
      button.onclick = () => {
        if (index !== expected) {
          audio.play("error");
          animate(button, "error");
          return;
        }
        selection[index] = !selection[index];
        step++;
        audio.play(step === 2 ? "click" : step === 4 ? "win" : "good");
        render();
        animate(button, "pop");
        tapEffects(button, selection[index]);
        const next =
          $("dialog").querySelector(".tutorial-expected") ||
          $("dialog-actions").querySelector(".primary");
        next?.focus({ preventScroll: true });
      };
      if (!button.parentNode) {
        board.append(button);
        if (index % 2 === 1) board.append(target(Math.floor(index / 2)));
      }
    }
    if (!board.querySelector(".bottom")) {
      const bottomTargets = [target(2), target(3)];
      bottomTargets.forEach((element) => element.classList.add("bottom"));
      board.append(...bottomTargets);
    }
    board.classList.toggle("tutorial-victory", step === 4);
    board.querySelectorAll(".target").forEach((element, index) => {
      const gained =
        sums[index] === goals[index] && !element.classList.contains("done");
      element.classList.toggle("done", sums[index] === goals[index]);
      element.classList.toggle("over", sums[index] > goals[index]);
      element.querySelector("small").textContent =
        `${sums[index]} / ${goals[index]}`;
      if (gained && !reduceMotion()) {
        animate(element, "target-burst");
        const indexes = index < 2 ? [index * 2, index * 2 + 1] : [index - 2, index];
        const buttons = indexes.map((cell) =>
          board.querySelector(`[data-tutorial-cell="${cell}"]`),
        );
        buttons.forEach((cell) => animate(cell, "line-ripple"));
        const beam = document.createElement("i");
        beam.className = `line-beam ${index < 2 ? "horizontal" : "vertical"}`;
        Object.assign(beam.style, {
          left: `${buttons[0].offsetLeft}px`,
          top: `${buttons[0].offsetTop}px`,
          width: `${buttons[1].offsetLeft + buttons[1].offsetWidth - buttons[0].offsetLeft}px`,
          height: `${buttons[1].offsetTop + buttons[1].offsetHeight - buttons[0].offsetTop}px`,
        });
        board.append(beam);
        setTimeout(() => beam.remove(), 850);
      }
    });
    if (step === 4)
      addButton("tutorialFinish", () => {
        seen = true;
        storage.set("tutorial.v1", "done");
        const destination = pending;
        pending = null;
        closeDialog();
        onFinish(destination);
      });
    addButton(
      "tutorialClose",
      () => {
        pending = null;
        closeDialog();
      },
      true,
    );
  }

  return Object.freeze({ begin, cancelPending, hasSeen: () => seen, render });
};

if (typeof module !== "undefined" && module.exports)
  module.exports = createDengeTutorial;
