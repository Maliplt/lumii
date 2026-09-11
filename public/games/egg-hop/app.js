// Menüler ve yerel kayıt
const $ = (selector) => document.querySelector(selector);
const skins = ["cream", "mint", "rose", "sky", "lavender", "gold"];
const prices = [0, 30, 60, 90, 120, 200];
let save = {
  language: "tr",
  coins: 0,
  best: 0,
  owned: ["cream"],
  skin: "cream",
};

try {
  const stored = JSON.parse(GameSave.storage.getItem("egg-hop-v1"));
  if (stored) {
    save.language = translations[stored.language] ? stored.language : "tr";
    save.coins = Number.isFinite(stored.coins)
      ? Math.max(0, Math.floor(stored.coins))
      : 0;
    save.best = Number.isFinite(stored.best)
      ? Math.max(0, Math.floor(stored.best))
      : 0;
    save.owned = [
      "cream",
      ...skins.filter((x) => x !== "cream" && stored.owned?.includes(x)),
    ];
    save.skin = save.owned.includes(stored.skin) ? stored.skin : "cream";
  }
} catch {
  // Kayıt kapalıysa oyun bellekte devam eder
}

let dialogType = "",
  tutorialStep = 0,
  earned = 0;

const t = (key) => translations[save.language][key];

function persist() {
  try {
    GameSave.storage.setItem("egg-hop-v1", JSON.stringify(save));
  } catch {}
  refreshNumbers();
}

function refreshNumbers() {
  document
    .querySelectorAll(".best")
    .forEach((x) => (x.textContent = save.best));
}

function translate() {
  document.documentElement.lang = save.language;
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = t(el.dataset.i18n)));
  languageButtons($("#menu-languages"));
  $("#pause").ariaLabel = t("pause");
  $("#game").ariaLabel = t("ready");
  if (dialogType) showDialog(dialogType);
  if (!$("#hint").hidden) $("#hint").textContent = t("ready");
  refreshNumbers();
}

function languageButtons(container) {
  container.replaceChildren();
  const labels = {
    tr: "Türkçe",
    en: "English",
    de: "Deutsch",
    es: "Español",
    fr: "Français",
    ar: "العربية",
  };
  for (const code of Object.keys(translations)) {
    const button = action("", () => {
      save.language = code;
      persist();
      translate();
    });
    button.setAttribute("aria-label", labels[code]);
    button.setAttribute("aria-pressed", String(save.language === code));
    const image = document.createElement("img");
    image.src = `assets/lang-${code}.png`;
    image.alt = code.toUpperCase();
    button.append(image);
    container.append(button);
  }
}

function closeDialog() {
  $("#dialog").hidden = true;
  dialogType = "";
}

function home() {
  closeDialog();
  Game.menu();
  $("#menu").hidden = false;
  $("#hud").hidden = true;
  $("#hint").hidden = true;
}

function play(practice = false) {
  closeDialog();
  $("#menu").hidden = true;
  $("#hud").hidden = false;
  $("#hint").hidden = false;
  $("#hint").textContent = t("ready");
  earned = 0;
  Game.start({ practice });
  $("#game").focus();
}

function action(text, callback, primary = false) {
  const button = document.createElement("button");
  button.textContent = text;
  if (primary) button.className = "primary";
  button.onclick = callback;
  return button;
}

function showDialog(type) {
  dialogType = type;
  $("#menu").hidden = true;
  const box = $("#dialog");
  box.hidden = false;
  box.replaceChildren();
  const heading = document.createElement("h3");
  const actions = document.createElement("div");
  actions.className = "dialog-actions";
  if (type === "shop") {
    heading.textContent = t("shop");
    box.append(heading);
    const balance = document.createElement("p");
    balance.className = "balance";
    const coin = document.createElement("img");
    coin.src = "assets/coin.png";
    coin.alt = t("coins");
    const amount = document.createElement("b");
    amount.textContent = save.coins;
    balance.append(coin, amount);
    box.append(balance);
    const grid = document.createElement("div");
    grid.className = "shop-grid";
    skins.forEach((skin, i) => {
      const card = document.createElement("div");
      card.className = "shop-card" + (save.skin === skin ? " selected" : "");
      const image = document.createElement("img");
      image.src = `assets/egg-${skin}.png`;
      image.alt = t("names")[i];
      const name = document.createElement("span");
      name.textContent = t("names")[i];
      const owned = save.owned.includes(skin);
      const button = action(
        save.skin === skin
          ? t("selected")
          : owned
            ? t("select")
            : `${prices[i]} · ${t("buy")}`,
        () => {
          if (!owned) {
            if (save.coins < prices[i]) return;
            save.coins -= prices[i];
            save.owned.push(skin);
          }
          save.skin = skin;
          Game.setSkin(skin);
          $(".hero-egg .egg").src = `assets/egg-${skin}.png`;
          persist();
          showDialog("shop");
        },
      );
      button.disabled =
        save.skin === skin || (!owned && save.coins < prices[i]);
      if (!owned && save.coins < prices[i]) button.title = t("needCoins");
      card.append(image, name, button);
      grid.append(card);
    });
    box.append(grid);
    actions.append(action(t("back"), home));
  } else if (type === "tutorial") {
    const step = document.createElement("span");
    step.className = "step";
    step.textContent = `0${tutorialStep + 1} / 03`;
    const image = document.createElement("img");
    image.src = `assets/${tutorialStep === 1 ? "basket-front" : tutorialStep === 2 ? "coin" : "egg-" + save.skin}.png`;
    image.alt = "";
    image.className = "dialog-icon";
    heading.textContent = t("tutorial");
    const copy = document.createElement("p");
    copy.textContent = t("lesson" + (tutorialStep + 1));
    box.append(step, heading, image, copy);
    actions.append(
      action(t("back"), () => {
        if (tutorialStep > 0) {
          tutorialStep--;
          showDialog("tutorial");
        } else home();
      }),
      action(
        tutorialStep === 2 ? t("practice") : t("next"),
        () => {
          if (tutorialStep < 2) {
            tutorialStep++;
            showDialog("tutorial");
          } else play(true);
        },
        true,
      ),
    );
  } else {
    heading.textContent = t(
      type === "pause" ? "pause" : type === "success" ? "caught" : "over",
    );
    box.append(heading);
    if (type === "over") {
      const copy = document.createElement("p");
      copy.textContent = `${t("score")}: ${$("#score").textContent} · ${t("earned")}: ${earned}`;
      box.append(copy);
    }
    actions.append(
      action(
        t(type === "pause" ? "resume" : type === "success" ? "play" : "again"),
        () => {
          if (type === "pause") {
            closeDialog();
            Game.resume();
            $("#game").focus();
          } else play();
        },
        true,
      ),
      action(t("home"), home),
    );
  }
  box.append(actions);
  if (type === "pause") {
    const languages = document.createElement("div");
    languages.className = "languages";
    languages.setAttribute("aria-label", "Language");
    languageButtons(languages);
    box.append(languages);
  }
  box.querySelector("button:not(:disabled)")?.focus();
}
$("#play").onclick = () => play();
$("#shop").onclick = () => showDialog("shop");
$("#tutorial").onclick = () => {
  tutorialStep = 0;
  showDialog("tutorial");
};

function pause() {
  if (Game.getMode() === "play") {
    Game.pause();
    showDialog("pause");
  }
}
$("#pause").onclick = pause;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
document.addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    if (Game.getMode() === "play") pause();
    else if (dialogType === "pause") {
      closeDialog();
      Game.resume();
      $("#game").focus();
    } else if (dialogType) home();
  }
});

Game.setCallbacks(
  (score, practice) => {
    $("#hint").hidden = true;
    if (practice) {
      Game.pause();
      showDialog("success");
      return;
    }
    earned += 10;
    save.coins += 10;
    save.best = Math.max(save.best, score);
    persist();
  },
  () => showDialog("over"),
);

Game.setSkin(save.skin);
$(".hero-egg .egg").src = `assets/egg-${save.skin}.png`;

translate();
