/* muscle-map.js — Body figure SVG and muscle set counting (day + week). */
"use strict";

/* ================= Muscle map ================= */
const BASE =
  '<g class="bd"><circle cx="100" cy="32" r="19"/><rect x="90" y="46" width="20" height="20" rx="5"/><path d="M60,72 C76,62 124,62 140,72 C146,96 140,120 136,140 C132,165 130,185 132,208 L134,226 L66,226 L68,208 C70,185 68,165 64,140 C60,120 54,96 60,72 Z"/><circle cx="30" cy="226" r="8"/><circle cx="170" cy="226" r="8"/><ellipse cx="85" cy="404" rx="12" ry="6"/><ellipse cx="115" cy="404" rx="12" ry="6"/></g>' +
  '<g class="bdl"><path d="M54,84 L42,148" stroke-width="22"/><path d="M42,150 L33,212" stroke-width="17"/><path d="M146,84 L158,148" stroke-width="22"/><path d="M158,150 L167,212" stroke-width="17"/><path d="M84,232 L82,318" stroke-width="32"/><path d="M82,322 L84,396" stroke-width="22"/><path d="M116,232 L118,318" stroke-width="32"/><path d="M118,322 L116,396" stroke-width="22"/></g>';
const SHAPES = {
  front: [
    [
      "chest",
      '<path d="M99,80 C88,76 74,78 67,89 C65,101 69,112 80,116 C90,119 97,115 99,108 Z"/>',
    ],
    [
      "abs",
      '<rect x="87.5" y="122" width="11" height="20" rx="4"/><rect x="87.5" y="145" width="11" height="20" rx="4"/><rect x="87.5" y="168" width="11" height="22" rx="4"/>',
    ],
    ["obliques", '<path d="M71,124 C68,146 70,170 75,196 L84,196 C83,172 84,148 85,124 Z"/>'],
    ["traps", '<path d="M91,62 C84,68 75,71 67,73 L71,78 C80,77 88,74 93,69 Z"/>'],
    ["side-delts", '<ellipse cx="49" cy="90" rx="7" ry="11"/>'],
    ["front-delts", '<ellipse cx="61" cy="86" rx="10" ry="12"/>'],
    ["biceps", '<ellipse cx="48" cy="118" rx="7.5" ry="19" transform="rotate(10.6 48 118)"/>'],
    ["forearms", '<ellipse cx="37.5" cy="181" rx="7" ry="22" transform="rotate(8.3 37.5 181)"/>'],
    [
      "quads",
      '<ellipse cx="78.5" cy="268" rx="8" ry="34"/><ellipse cx="90" cy="282" rx="7" ry="27"/>',
    ],
    ["calves", '<ellipse cx="77" cy="346" rx="5.5" ry="20"/>'],
  ],
  back: [
    ["traps", '<path d="M100,52 C92,62 82,68 66,75 L84,96 L91,121 L100,138 Z"/>'],
    ["mid-back", '<path d="M84,99 L90,123 L82,138 L71,116 C73,107 78,101 84,99 Z"/>'],
    ["lats", '<path d="M70,120 C66,142 70,166 82,190 L93,186 C91,166 89,150 83,141 Z"/>'],
    ["lower-back", '<path d="M91,168 L99,166 L99,212 L88,214 C87,198 88,182 91,168 Z"/>'],
    ["glutes", '<ellipse cx="85.5" cy="238" rx="14" ry="16"/>'],
    ["hamstrings", '<ellipse cx="84" cy="288" rx="12" ry="28"/>'],
    ["calves", '<ellipse cx="82" cy="346" rx="10" ry="22"/>'],
    ["rear-delts", '<ellipse cx="61" cy="87" rx="10" ry="11"/>'],
    ["side-delts", '<ellipse cx="49" cy="90" rx="7" ry="11"/>'],
    ["triceps", '<ellipse cx="48" cy="118" rx="7.5" ry="19" transform="rotate(10.6 48 118)"/>'],
    ["forearms", '<ellipse cx="37.5" cy="181" rx="7" ry="22" transform="rotate(8.3 37.5 181)"/>'],
  ],
};
function bodySVG(view, lv, sel) {
  const half = SHAPES[view]
    .map(
      ([k, sh]) => `<g class="m ${lv[k] || ""}${sel === k ? " sel" : ""}" data-m="${k}">${sh}</g>`,
    )
    .join("");
  return `<svg viewBox="0 0 200 420" role="img" aria-label="${view === "front" ? "ด้านหน้า" : "ด้านหลัง"}">${BASE}${half}<g transform="translate(200 0) scale(-1 1)">${half}</g></svg>`;
}
function addScore(sc, ex, n) {
  if (!n) return;
  ex.muscles.p.forEach((k) => {
    (sc[k] = sc[k] || { p: 0, s: 0 }).p += n;
  });
  ex.muscles.s.forEach((k) => {
    (sc[k] = sc[k] || { p: 0, s: 0 }).s += n;
  });
}
function scoresDay(mode) {
  const sc = {},
    d = program.days[state.day];
  if (d.rest) return sc;
  SECTIONS.forEach(([sk]) =>
    d.sections[sk].forEach((x) => {
      const ex = program.ex[x.ex];
      if (ex)
        addScore(sc, ex, mode === "plan" ? plannedSets(ex) : doneSets(ex, entry(ex.id, false)));
    }),
  );
  return sc;
}
function scoresWeek(mode) {
  const sc = {};
  if (mode === "plan") {
    ORDER.forEach((dk) => {
      const d = program.days[dk];
      if (d.rest) return;
      SECTIONS.forEach(([sk]) =>
        d.sections[sk].forEach((x) => {
          const ex = program.ex[x.ex];
          if (ex) addScore(sc, ex, plannedSets(ex));
        }),
      );
    });
  } else {
    const ws = weekStart(todayISO());
    Object.values(sessions).forEach((s) => {
      if (!s || !s.date || weekStart(s.date) !== ws) return;
      Object.keys(s.entries || {}).forEach((id) => {
        const ex = program.ex[id];
        if (ex) addScore(sc, ex, doneSets(ex, s.entries[id]));
      });
    });
  }
  return sc;
}
const eff = (v) => (v ? v.p + v.s * 0.5 : 0);
function mapInner(kind) {
  const week = kind === "week";
  const mode = week ? state.weekMode : state.mapMode;
  const sc = week ? scoresWeek(mode) : scoresDay(mode);
  const th = week ? [5, 10] : [2, 5];
  const lv = {};
  Object.keys(sc).forEach((k) => {
    const v = eff(sc[k]);
    lv[k] = v <= 0 ? "" : v <= th[0] ? "l1" : v <= th[1] ? "l2" : "l3";
  });
  const sel = week ? state.weekSel : state.sel;
  const attr = week ? "data-weekmode" : "data-mapmode";
  let h = `<div class="maphead"><h2>${week ? "กล้ามเนื้อทั้งสัปดาห์" : "กล้ามเนื้อวันนี้"}</h2><div class="seg" role="group" aria-label="โหมด"><button type="button" ${attr}="plan" aria-pressed="${mode === "plan"}">ตามแผน</button><button type="button" ${attr}="done" aria-pressed="${mode === "done"}">${week ? "ทำแล้วสัปดาห์นี้" : "ทำแล้ว"}</button></div></div>`;
  h += `<div class="figs"><div class="fig">${bodySVG("front", lv, sel)}<small>FRONT</small></div><div class="fig">${bodySVG("back", lv, sel)}<small>BACK</small></div></div>`;
  h +=
    '<div class="legend"><span><i style="background:var(--m0)"></i>ไม่ได้ใช้</span><span><i style="background:var(--h1)"></i>น้อย</span><span><i style="background:var(--h2)"></i>กลาง</span><span><i style="background:var(--h3)"></i>มาก</span></div>';
  let info;
  if (sel && MUS[sel]) {
    const v = sc[sel] || { p: 0, s: 0 };
    info = `<b>${esc(MUS[sel][1])} · ${esc(MUS[sel][2])}</b> — ${fmtS(eff(v))} sets (หลัก ${fmtS(v.p)} · รอง ${fmtS(v.s)})`;
  } else if (!Object.keys(sc).length)
    info =
      mode === "done"
        ? "ยังไม่มี set ที่ทำ กด ✓ ที่ set เพื่อให้กล้ามเนื้อขึ้นสี"
        : "ยังไม่ได้ใส่กล้ามเนื้อให้ท่าในวันนี้";
  else info = "แตะกล้ามเนื้อเพื่อดูจำนวน set · หลักนับเต็ม รองนับครึ่ง";
  h += `<p class="mapinfo">${info}</p>`;
  const top = Object.keys(sc)
    .map((k) => [k, eff(sc[k])])
    .filter((x) => x[1] > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  if (top.length)
    h += `<ul class="toplist">${top.map(([k, v]) => `<li>${esc(MUS[k][1])} <b>${fmtS(v)}</b></li>`).join("")}</ul>`;
  return h;
}
function refreshMap(kind) {
  const el = document.querySelector(`.mapcard[data-mapkind="${kind}"]`);
  if (el) el.innerHTML = mapInner(kind);
}
let mapT = null;
function refreshDayMapSoon() {
  if (state.mapMode !== "done") return;
  clearTimeout(mapT);
  mapT = setTimeout(() => refreshMap("day"), 300);
}
