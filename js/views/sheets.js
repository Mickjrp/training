/* sheets.js — Bottom sheets: exercise editor, add exercise, timer presets. */
"use strict";

/* ================= Sheets ================= */
let lastFocus = null;
function openSheet(title, html, mount) {
  lastFocus = document.activeElement;
  $("#sheet-title").textContent = title;
  $("#sheet-body").innerHTML = html;
  $("#sheet").hidden = false;
  document.body.classList.add("locked");
  if (mount) mount($("#sheet-body"));
  const f = $("#sheet-body").querySelector("input,select,button");
  if (f && !("ontouchstart" in window)) f.focus();
}
function closeSheet() {
  if ($("#sheet").hidden) return;
  $("#sheet").hidden = true;
  document.body.classList.remove("locked");
  $("#sheet-body").innerHTML = "";
  if (lastFocus && document.contains(lastFocus))
    try {
      lastFocus.focus();
    } catch (e) {}
}
let edCtx = null;
function openEditor(exId, ctx) {
  const isNew = !exId;
  const ex = isNew ? L("", "", {}) : clone(program.ex[exId]);
  const itm = ctx && ctx.i != null ? program.days[ctx.day].sections[ctx.sk][ctx.i] : null;
  edCtx = { exId, ctx, isNew, itm, mus: {} };
  ex.muscles.p.forEach((k) => (edCtx.mus[k] = "p"));
  ex.muscles.s.forEach((k) => {
    if (!edCtx.mus[k]) edCtx.mus[k] = "s";
  });
  const used = isNew ? [] : usedIn(exId);
  let h = `<div class="form"><label class="fld span3">ชื่อท่า<input id="e-name" autocomplete="off"></label><label class="fld span3">ประเภท<select id="e-type">${TYPES.map((t) => `<option value="${t[0]}">${esc(t[1])}</option>`).join("")}</select></label><label class="fld num" data-for="sets">Sets<input id="e-sets" inputmode="numeric"></label><label class="fld num" data-for="range"><span id="e-lo-l">Reps ต่ำสุด</span><input id="e-lo" inputmode="numeric"></label><label class="fld num" data-for="range"><span id="e-hi-l">Reps สูงสุด</span><input id="e-hi" inputmode="numeric"></label><label class="fld span3" data-for="rx">รายละเอียด (เช่น 2×10, 3–5 min)<input id="e-rx" autocomplete="off"></label><label class="fld span2x" data-for="cls">การเพิ่มน้ำหนัก<select id="e-cls"><option value="c">Compound · +2.5 kg</option><option value="i">Isolation · ขั้นต่ำ</option></select></label><label class="fld num" data-for="rest">พัก (วิ)<input id="e-rest" inputmode="numeric" placeholder="auto"></label><label class="fld num" data-for="step">เพิ่มทีละ kg<input id="e-step" inputmode="decimal" placeholder="auto"></label><label class="fld num span2x" data-for="start">น้ำหนักเริ่มต้น (kg)<input id="e-start" inputmode="decimal" placeholder="40 หรือ 10/15/15"></label><label class="fld span3">ลิงก์ YouTube ท่าที่ถูกต้อง<input id="e-yt" type="url" inputmode="url" autocomplete="off" placeholder="https://youtube.com/shorts/..."></label><label class="switch span3" data-for="clip"><span>แสดงคลิปบนการ์ด · เล่นเองแบบไม่มีเสียงเมื่อเลื่อนมาถึง</span><input type="checkbox" id="e-clip"></label><label class="fld span3">Note<textarea id="e-note"></textarea></label>${itm || isNew ? '<label class="fld span3">ป้ายกำกับในวันนี้ (ไม่ใส่ก็ได้)<input id="e-tag" autocomplete="off" placeholder="เช่น NEW, +1 set"></label>' : ""}</div><div class="fld"><span>กล้ามเนื้อ · แตะ 1 ครั้ง = หลัก · 2 ครั้ง = รอง · 3 ครั้ง = ไม่ใช้</span><div class="mchips" id="e-mus">${MUSCLES.map(([k, en, th]) => `<button type="button" data-mus="${k}" data-st="${edCtx.mus[k] || ""}" aria-label="${esc(en)}">${esc(en)} · ${esc(th)}</button>`).join("")}</div></div>${used.length ? `<p class="used">ท่านี้อยู่ใน ${used.join(", ")} · แก้แล้วเปลี่ยนทุกวันที่ใช้ท่านี้</p>` : ""}<p class="err" id="e-err" hidden></p><div class="btns"><button type="button" class="btn" data-act="e-save">บันทึก</button>${itm ? '<button type="button" class="btn danger" data-act="e-remove">เอาออกจากวันนี้</button>' : ""}</div>`;
  openSheet(isNew ? "สร้างท่าใหม่" : `แก้ไข ${ex.name}`, h, () => {
    $("#e-name").value = ex.name;
    $("#e-type").value = ex.type;
    $("#e-sets").value = ex.sets;
    $("#e-lo").value = ex.lo;
    $("#e-hi").value = ex.hi;
    $("#e-rx").value = ex.rx;
    $("#e-cls").value = ex.cls === "c" ? "c" : "i";
    $("#e-rest").value = num(ex.rest) > 0 ? ex.rest : "";
    $("#e-start").value = (ex.startKg || []).map(fmt).join(" / ");
    $("#e-yt").value = ex.yt || "";
    $("#e-note").value = ex.note || "";
    $("#e-step").value = num(ex.step) > 0 ? fmt(num(ex.step)) : "";
    $("#e-clip").checked = !!ex.clip;
    if ($("#e-tag")) $("#e-tag").value = itm ? itm.tag : "";
    syncEditor();
  });
}
function syncEditor() {
  const t = $("#e-type").value;
  const show = {
    sets: ["load", "bw", "reps", "hold"],
    range: ["load", "bw", "reps", "hold"],
    rx: ["check", "cardio"],
    cls: ["load", "bw"],
    rest: ["load", "bw", "reps", "hold"],
    step: ["load", "bw"],
    start: ["load"],
    clip: ["load", "bw", "reps", "hold", "cardio"],
  };
  document.querySelectorAll("#sheet-body [data-for]").forEach((el) => {
    el.hidden = !show[el.dataset.for].includes(t);
  });
  $("#e-lo-l").textContent = t === "hold" ? "วินาทีต่ำสุด" : "Reps ต่ำสุด";
  $("#e-hi-l").textContent = t === "hold" ? "วินาทีสูงสุด" : "Reps สูงสุด";
}
function edErr(msg) {
  const e = $("#e-err");
  e.textContent = msg;
  e.hidden = false;
  e.scrollIntoView({ block: "nearest" });
}
function intIn(sel, min, max) {
  const v = plainNum($(sel).value);
  return v != null && Number.isInteger(v) && v >= min && v <= max ? v : null;
}
function saveEditor() {
  const c = edCtx;
  if (!c) return;
  const name = $("#e-name").value.trim();
  if (!name) return edErr("ใส่ชื่อท่าก่อน");
  const type = $("#e-type").value;
  const o = { name, type };
  if (["load", "bw", "reps", "hold"].includes(type)) {
    const sets = intIn("#e-sets", 1, 12),
      lo = intIn("#e-lo", 1, 600),
      hi = intIn("#e-hi", 1, 600);
    if (sets == null) return edErr("Sets ต้องเป็นเลข 1–12");
    if (lo == null || hi == null)
      return edErr(`ใส่ช่วง ${type === "hold" ? "วินาที" : "reps"} เป็นตัวเลข`);
    if (lo > hi) return edErr("ค่าต่ำสุดต้องไม่มากกว่าค่าสูงสุด");
    Object.assign(o, { sets, lo, hi });
    const r = $("#e-rest").value.trim();
    const rv = plainNum(r);
    if (r && (rv == null || rv < 10 || rv > 900))
      return edErr("เวลาพักใส่เป็นวินาที 10–900 หรือเว้นว่างไว้");
    o.rest = rv || 0;
  } else o.rx = $("#e-rx").value.trim();
  if (["load", "bw"].includes(type)) {
    o.cls = $("#e-cls").value;
    const sr = $("#e-step").value.trim(),
      sv = num(sr);
    if (sr && (sv == null || sv < 0.25 || sv > 20))
      return edErr("เพิ่มทีละใส่เป็น kg 0.25–20 หรือเว้นว่างไว้");
    o.step = sv || 0;
  }
  if (type === "load") {
    const raw = $("#e-start").value.trim();
    const parts = raw ? raw.split(/[\/,\s]+/).filter(Boolean) : [];
    const ks = parts.map((p) => num(p));
    if (ks.some((k) => k == null || k < 0 || k > 500))
      return edErr("น้ำหนักเริ่มต้นใส่เป็นตัวเลข เช่น 40 หรือ 10/15/15");
    o.startKg = ks;
  }
  const yt = $("#e-yt").value.trim();
  if (yt && !safeUrl(yt)) return edErr("ลิงก์ต้องขึ้นต้นด้วย https://");
  o.yt = yt;
  o.note = $("#e-note").value.trim();
  o.clip = type !== "check" && $("#e-clip").checked;
  if (o.clip && !ytId(yt)) return edErr("ใส่ลิงก์ YouTube ก่อนเปิดแสดงคลิปบนการ์ด");
  o.muscles = {
    p: MUSCLES.map((m) => m[0]).filter((k) => c.mus[k] === "p"),
    s: MUSCLES.map((m) => m[0]).filter((k) => c.mus[k] === "s"),
  };
  const tag = $("#e-tag") ? $("#e-tag").value.trim() : "";
  if (c.isNew) {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 24) || "ex";
    let id = `${base}-${Date.now().toString(36).slice(-4)}`;
    while (program.ex[id]) id += "x";
    program.ex[id] = Object.assign(L(id, name), o);
    program.days[c.ctx.day].sections[c.ctx.sk].push(it(id, tag));
  } else {
    Object.assign(program.ex[c.exId], o);
    if (c.itm) c.itm.tag = tag;
  }
  saveProgramNow();
  closeSheet();
  renderWorkout();
  toast(c.isNew ? `เพิ่ม ${name} แล้ว` : `บันทึก ${name} แล้ว`);
}
function openAdd(sk) {
  const d = program.days[state.day];
  const inSec = new Set(d.sections[sk].map((x) => x.ex));
  const list = Object.values(program.ex)
    .filter((e) => !inSec.has(e.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const h = `<button type="button" class="btn" data-act="add-new" data-sk="${sk}">+ สร้างท่าใหม่</button><label class="fld">หรือเลือกจากท่าที่มีอยู่<input id="add-q" type="search" autocomplete="off" placeholder="ค้นหา เช่น curl"></label>${list.length ? `<ul class="picklist" id="add-list">${list.map((e) => `<li data-name="${esc(e.name.toLowerCase())}"><button type="button" data-pick="${esc(e.id)}" data-sk="${sk}"><span>${esc(e.name)}</span><small>${esc(typeLabel(e))}</small></button></li>`).join("")}</ul>` : '<p class="empty">ยังไม่มีท่าอื่นให้เลือก</p>'}`;
  openSheet(`เพิ่มท่าใน ${SECLABEL[sk]} · ${DN[state.day]}`, h);
}
function openTimerSheet() {
  const pre = [60, 90, 120, 150, 180, 240];
  const h = `<div class="presets">${pre.map((s) => `<button type="button" data-preset="${s}">${mmss(s)}</button>`).join("")}</div><p class="hint">กด ✓ ที่แต่ละ set ระบบจะเริ่มจับเวลาพักตามท่านั้นให้เอง ตั้งค่าเวลาพักเริ่มต้นได้ที่ Settings</p>${timer ? '<button type="button" class="btn ghost" data-t="stop">หยุดจับเวลา</button>' : ""}`;
  openSheet("จับเวลาพัก", h);
}
