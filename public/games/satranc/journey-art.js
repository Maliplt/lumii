"use strict";
const JourneyArt = (() => {
  const palettes = [
    ["#155b52", "#69dcad"],
    ["#12578a", "#68ccf0"],
    ["#a3412d", "#ffc36d"],
    ["#3e6a29", "#cfed68"],
    ["#765025", "#f5d78c"],
    ["#164c6b", "#66e0df"],
    ["#445b77", "#cfebff"],
    ["#a35b12", "#ffe17c"],
    ["#202f54", "#afc6ff"],
    ["#813647", "#ffb697"],
  ];
  let serial = 0;
  function landscape(chapter) {
    const [a, b] = palettes[chapter % 10],
      id = "landscape-" + serial++;
    const blocks = Array.from({ length: 5 }, (_, i) => {
      const x = 215 + i * 46,
        h = [54, 91, 72, 122, 65][(i + chapter) % 5];
      return `<g transform="translate(${x} ${178 - h})"><path d="M0 0 22-12 43 0v${h}l-22 12L0 ${h}Z" fill="${b}"/><path d="M22 12 43 0v${h}l-21 12Z" fill="${a}" opacity=".55"/><path d="M0 0 22-12 43 0 22 12Z" fill="#fff" opacity=".45"/><path d="M7 24v13m0 12v13m8-34v13" stroke="${a}" stroke-width="4" opacity=".6"/>${i === chapter % 5 ? '<path d="M22-12v-29l20 8-20 8" fill="#ffdf78" stroke="#ffdf78" stroke-width="2"/>' : ""}</g>`;
    }).join("");
    return `<svg viewBox="0 0 480 210" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="#102e40"/></linearGradient></defs><rect width="480" height="210" fill="url(#${id})"/><circle cx="388" cy="43" r="48" fill="${b}" opacity=".2"/><path d="m210 154 125-56 141 67-128 57Z" fill="${b}" opacity=".17"/><path d="m209 170 138 62 131-63m-245-23 139 63m-106-79 139 63m-105-79 139 63" fill="none" stroke="${b}" opacity=".2"/>${blocks}<path d="M0 199 111 135 201 182 280 210H0Z" fill="${b}" opacity=".13"/><path d="M34 51h33m-17-17v34M153 100h16m-8-8v16" stroke="${b}" opacity=".4"/></svg>`;
  }
  const emblems = [
    '<path d="m24 26 28 14h24l28-14-7 57-33 26-33-26Z"/><path d="m24 26 40 38 40-38-7 57-33 26-33-26Z" fill="#e99244"/><path d="M31 68 64 84 97 68 87 92 64 109 41 92Z" fill="#fff0cd"/><path d="m48 63 9 6m14 0 9-6" stroke="#172b39" stroke-width="5"/><path d="m57 83 7 7 7-7Z" fill="#172b39"/>',
    '<path d="m27 19 28 23h18l28-23-1 56-36 37-36-37Z"/><path d="m27 19 37 41 37-41-1 56-36 37-36-37Z" fill="#7facca"/><path d="m36 77 28-17 28 17-28 35Z" fill="#e0edf0"/><path d="m43 64 10 4m22 0 10-4" stroke="#172b39" stroke-width="5"/><path d="m56 87 8 7 8-7Z" fill="#172b39"/>',
    '<path d="m25 30 20 8 19-5 19 5 20-8-2 49-37 33-37-33Z" fill="#dcab59"/><path d="M31 57q17-19 33 1 17-20 33-1v15q-12 16-33 3-22 14-33-3Z" fill="#fff0ce"/><circle cx="46" cy="63" r="7" fill="#172b39"/><circle cx="82" cy="63" r="7" fill="#172b39"/><path d="m57 75 7 12 7-12Z" fill="#b36525"/><path d="m47 91 17 10 17-10" fill="none" stroke="#a56830" stroke-width="4"/>',
    '<path d="m64 13 17 12 20 5 6 23 9 20-15 18-12 19H39L27 92 12 73l9-20 7-23 20-5Z" fill="#bb6c2d"/><path d="M36 43q28-15 56 0l-4 45-24 20-24-20Z" fill="#ffcf78"/><path d="m43 60 11 3m20 0 11-3" stroke="#172b39" stroke-width="5"/><path d="M47 82q17-16 34 0l-7 14H54Z" fill="#fff0cf"/><path d="m57 78 7 8 7-8Z" fill="#172b39"/>',
    '<path d="m31 41 18-15 40 8 12 21-20 11-1 24-24 22-20-22Z" fill="#eff5eb"/><path d="m49 26 40 8 12 21-27-7-16 20-22 22-5-49Z" fill="#b5d3d2"/><path d="m73 52 29 8-22 16-2-12-12-3Z" fill="#f4b84c"/><path d="m58 45 12 4" stroke="#192f40" stroke-width="5"/><path d="m46 79 10 13 9-10" fill="none" stroke="#5c8697" stroke-width="4"/>',
    '<path d="M44 52 30 33V13m0 21L17 24m67 28 14-19V13m0 21 13-10" fill="none" stroke="#ffe2a0" stroke-width="7"/><path d="m29 43 22 7h26l22-7-16 22-6 33-13 14-13-14-6-33Z" fill="#c58e59"/><path d="m46 61 18 22 18-22-5 37-13 14-13-14Z" fill="#f8d9a8"/><path d="m48 62 8 6m16 0 8-6" stroke="#172b39" stroke-width="4"/><path d="m57 94 7 6 7-6Z" fill="#172b39"/>',
    '<path d="m27 22 24 21h26l24-21-3 61-34 27-34-27Z" fill="#c5cad9"/><path d="m27 22 24 21-16 10m66-31L77 43l16 10" fill="#f0acaa"/><path d="m39 64 17 3m16 0 17-3" stroke="#172b39" stroke-width="5"/><path d="m57 81 7 7 7-7Z" fill="#b76e75"/><path d="m43 82-21-4m21 13-21 4m63-13 21-4m-21 13 21 4" stroke="#eef0fa" stroke-width="3"/>',
    '<circle cx="31" cy="36" r="17" fill="#c48b54"/><circle cx="97" cy="36" r="17" fill="#c48b54"/><path d="M28 49q1-24 36-24t36 24l-6 42-30 21-30-21Z" fill="#9c693f"/><path d="M41 77q23-20 46 0l-4 18-19 12-19-12Z" fill="#eed0a4"/><path d="m42 59 11 2m22 0 11-2" stroke="#182d3a" stroke-width="5"/><path d="m55 80 9 9 9-9Z" fill="#182d3a"/>',
  ];
  function avatar(index = 0, color = 0) {
    const colors = [
        "#d96b42",
        "#207c67",
        "#2c72b3",
        "#bb8629",
        "#b04f65",
        "#435673",
      ],
      base = colors[color % 6],
      id = "portrait-" + serial++;
    return `<svg class="avatar-art" viewBox="0 0 128 128" aria-hidden="true"><defs><linearGradient id="${id}" x2=".8" y2="1"><stop stop-color="${base}"/><stop offset="1" stop-color="#172d3d"/></linearGradient></defs><rect width="128" height="128" rx="5" fill="url(#${id})"/><path d="M0 100 100 0h28v28L28 128H0Z" fill="#fff" opacity=".06"/><path d="M6 28V6h22m72 0h22v22m0 72v22h-22m-72 0H6v-22" stroke="#fff" fill="none" opacity=".25"/><g fill="#ffe4a5" stroke-linejoin="round" stroke-linecap="round">${emblems[index % 8]}</g></svg>`;
  }
  return { landscape, avatar, palettes };
})();
