/* workout.js — Day strip, workout page, and edit mode (reorder/remove). */
"use strict";

/* ================= Day strip ================= */
function dayShort(d) {
  if (d.rest) return "Rest";
  const f = (d.focus || "").split(/[\/·,]/)[0].trim();
  return f || d.name || "—";
}
function renderDays() {
  const t = DAYS[new Date().getDay()];
  $("#days").innerHTML = ORDER.map((dk) => {
    const d = program.days[dk];
    const cls = [d.rest ? "rest" : "", dk === t ? "today" : ""].join(" ").trim();
    return `<button type="button" data-day="${dk}" aria-pressed="${dk === state.day}"${cls ? ` class="${cls}"` : ""} aria-label="${DN[dk]} ${esc(`${d.name} ${d.focus}`)}${dk === t ? " (วันนี้)" : ""}"><b>${DN[dk]}</b><small>${esc(dayShort(d))}</small></button>`;
  }).join("");
}

/* ================= Workout view ================= */
function inputHTML(ex, i, f, val, ph, unit, mode) {
  const id = `f-${ex.id}-${i}-${f}`;
  const lab = (i >= 0 ? `Set ${i + 1} ` : "") + unit;
  return `<label class="inp"><input id="${id}" data-ex="${esc(ex.id)}" data-i="${i}" data-f="${f}" inputmode="${mode}" autocomplete="off" enterkeyhint="next" aria-label="${esc(`${ex.name} ${lab}`)}" placeholder="${esc(ph)}" value="${val == null ? "" : esc(fmt(val))}"><span>${esc(unit)}</span></label>`;
}
function lastVal(sets, i, f) {
  if (!sets || !sets.length) return null;
  if (sets[i] && num(sets[i][f]) != null) return num(sets[i][f]);
  for (let j = Math.min(i, sets.length - 1); j >= 0; j--) {
    if (sets[j] && num(sets[j][f]) != null) return num(sets[j][f]);
  }
  return null;
}
const pick = (arr, i) => (arr && arr.length ? arr[Math.min(i, arr.length - 1)] : null);
function rowHTML(ex, i, s, ls, ev) {
  const range = ex.lo === ex.hi ? String(ex.lo) : `${ex.lo}–${ex.hi}`;
  const up = ev && ev.st === "ready";
  let cells,
    one = false;
  if (ex.type === "hold") {
    const p = lastVal(ls, i, "sec");
    cells = inputHTML(ex, i, "sec", num(s.sec), p != null ? fmt(p) : range, "sec", "numeric");
    one = true;
  } else {
    const lr = lastVal(ls, i, "reps"),
      sr = pick(ex.startReps, i);
    // after a weight increase, show the target range instead of last time's reps
    const reps = inputHTML(
      ex,
      i,
      "reps",
      num(s.reps),
      up ? range : lr != null ? fmt(lr) : sr != null ? String(sr) : range,
      "reps",
      "numeric",
    );
    if (ex.type === "reps") {
      cells = reps;
      one = true;
    } else {
      const lk = lastVal(ls, i, "kg");
      let ph;
      if (ex.type === "bw") {
        const nk = up && !ex.ready ? pick(ev.next, i) : null;
        ph = nk ? fmt(nk) : lk ? fmt(lk) : "BW";
      } else if (up && pick(ev.next, i) != null) ph = fmt(pick(ev.next, i));
      else {
        const sk = pick(ex.startKg, i);
        ph = lk != null ? fmt(lk) : sk != null ? fmt(sk) : "–";
      }
      cells = `${inputHTML(ex, i, "kg", num(s.kg), ph, ex.type === "bw" ? "+kg" : "kg", "decimal")}<span class="x" aria-hidden="true">×</span>${reps}`;
    }
  }
  return `<div class="srow${one ? " one" : ""}${s.done ? " done" : ""}" data-row="${esc(ex.id)}-${i}"><span class="sn">${i + 1}</span>${cells}<button type="button" class="tick" data-tick="${esc(ex.id)}" data-i="${i}" aria-pressed="${!!s.done}" aria-label="Set ${i + 1} เสร็จ">${I.check}</button></div>`;
}
function setsHTML(ex) {
  const ent = entry(ex.id, false) || {};
  const last = priorEntries(ex.id, 1)[0];
  if (ex.type === "cardio") {
    return `<div class="cardio">${inputHTML(ex, -1, "min", num(ent.min), last && num(last.e.min) != null ? fmt(num(last.e.min)) : "20–30", "min", "numeric")}${inputHTML(ex, -1, "hr", num(ent.hr), last && num(last.e.hr) != null ? fmt(num(last.e.hr)) : "120–140", "avg HR", "numeric")}</div>`;
  }
  const sets = ent.sets || [];
  const n = Math.max((num(ex.sets) || 1) + (state.extra[ex.id] || 0), sets.length);
  const ev = last ? evalEntry(ex, last.e) : null;
  let h = "";
  for (let i = 0; i < n; i++) h += rowHTML(ex, i, sets[i] || {}, last && last.e.sets, ev);
  return h;
}
function cardHTML(x) {
  const ex = program.ex[x.ex];
  if (!ex) return "";
  const hist = priorEntries(ex.id, 6),
    last = hist[0];
  const ev = last ? evalEntry(ex, last.e) : null,
    stall = ev ? stalled(ex, hist) : false;
  const lastLine = last
    ? `ครั้งก่อน <b>${esc(summarize(ex, last.e))}</b> · ${esc(thDate(last.date))}`
    : startLine(ex);
  let h = `<article class="ex">${clipHTML(ex)}<div class="ex-top"><h3>${esc(ex.name)}</h3><div class="ex-side">${ytLink(ex)}<span class="rx">${esc(rxText(ex))}</span></div></div>`;
  const tags = [];
  if (x.tag) tags.push(`<span class="tag chg">${esc(x.tag)}</span>`);
  if (ev && ev.st === "ready") tags.push(`<span class="tag ready">${esc(readyTag(ex, ev))}</span>`);
  else if (stall)
    tags.push('<span class="tag warn">ค้างมา 3 ครั้ง · เช็กการกิน/การนอน หรือ deload</span>');
  else if (ev && ev.st === "heavy")
    tags.push(`<span class="tag warn">ครั้งก่อนต่ำกว่า ${ex.lo} reps</span>`);
  else if (ev && ev.st === "keep")
    tags.push(`<span class="tag target">เป้า ${ex.hi} reps ทุก set</span>`);
  if (isLogged(ex)) tags.push(`<span class="tag rest">พัก ${mmss(restFor(ex))}</span>`);
  if (tags.length) h += `<div class="tags">${tags.join("")}</div>`;
  if (ex.note) h += `<p class="note">${esc(ex.note)}</p>`;
  h += `<p class="last">${lastLine}</p>`;
  h += `<div class="sets" data-sets="${esc(ex.id)}">${setsHTML(ex)}</div>`;
  if (["load", "bw"].includes(ex.type)) {
    const a = adviceFor(ex, entry(ex.id, false));
    h += `<p class="advice" id="adv-${esc(ex.id)}" aria-live="polite" data-st="${a ? a.st : ""}"${a ? "" : " hidden"}>${a ? a.html : ""}</p>`;
  }
  const foot = [];
  if (ex.type !== "cardio")
    foot.push(
      `<button type="button" class="linkbtn" data-addset="${esc(ex.id)}">+ เพิ่ม set</button>`,
    );
  if (hist.length > 1)
    foot.push(
      `<details class="hist"><summary>ประวัติ ${hist.length} ครั้งล่าสุด</summary><ol>${hist.map((y) => `<li><span>${esc(thDate(y.date))}</span><b>${esc(summarize(ex, y.e))}</b></li>`).join("")}</ol></details>`,
    );
  if (foot.length) h += `<div class="ex-foot">${foot.join("")}</div>`;
  return `${h}</article>`;
}
function checkRow(x) {
  const ex = program.ex[x.ex];
  const e = entry(ex.id, false);
  return `<li><label><input type="checkbox" id="f-${esc(ex.id)}-done" data-ex="${esc(ex.id)}" data-f="done"${e && e.done ? " checked" : ""}><span class="cn">${esc(ex.name)}</span>${x.tag ? `<span class="tag chg">${esc(x.tag)}</span>` : ""}<span class="crx">${esc(ex.rx)}</span></label>${ytLink(ex)}</li>`;
}
function sectionHTML(items) {
  let h = "",
    group = [];
  const flush = () => {
    if (group.length) {
      h += `<ul class="checks">${group.map(checkRow).join("")}</ul>`;
      group = [];
    }
  };
  items.forEach((x) => {
    const ex = program.ex[x.ex];
    if (!ex) return;
    if (ex.type === "check") group.push(x);
    else {
      flush();
      h += cardHTML(x);
    }
  });
  flush();
  return h;
}
function heroHTML(d) {
  let h = `<div class="hero"><div class="hero-top"><div class="hero-id"><span class="dname">${DN[state.day]}</span><div class="dfocus"><b>${esc(d.rest ? "Rest" : d.name)}</b>${esc(d.focus)}</div></div>`;
  h += state.edit
    ? '<button type="button" class="pill primary" data-act="done-edit">เสร็จ</button>'
    : `<button type="button" class="pill" data-act="edit">${I.pencil}แก้ไข</button>`;
  h += "</div>";
  if (!d.rest && !state.edit)
    h += `<div class="hero-bar"><label class="datef">วันที่ <input type="date" id="session-date" value="${state.date}"></label></div>`;
  return `${h}</div>`;
}
function renderWorkout() {
  const d = program.days[state.day];
  let h = heroHTML(d);
  if (state.edit) h += editHTML(d);
  else if (d.rest)
    h += `<div class="restcard"><h2>วันพัก</h2>${d.restNotes.length ? `<ul>${d.restNotes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}</div>`;
  else {
    h += `<section class="mapcard" data-mapkind="day">${mapInner("day")}</section>`;
    let any = false;
    SECTIONS.forEach(([sk, label]) => {
      const items = d.sections[sk];
      if (!items.length) return;
      any = true;
      h += `<section class="block"><h2 class="blabel">${label}</h2>${sectionHTML(items)}</section>`;
    });
    if (!any) h += '<p class="empty">วันนี้ยังไม่มีท่า กด “แก้ไข” เพื่อเพิ่มท่า</p>';
  }
  $("#v-workout").innerHTML = h;
  observeClips();
}

/* ---------- edit mode ---------- */
function editHTML(d) {
  let h = `<div class="edit-head"><label class="fld">ชื่อวัน<input id="ed-name" autocomplete="off" value="${esc(d.name)}"></label><label class="fld">Focus<input id="ed-focus" autocomplete="off" value="${esc(d.focus)}"></label></div>`;
  h += `<label class="switch"><span>ตั้งเป็นวันพัก</span><input type="checkbox" id="ed-rest"${d.rest ? " checked" : ""}></label>`;
  if (d.rest) {
    h += `<label class="fld">สิ่งที่ทำในวันพัก (บรรทัดละ 1 อย่าง)<textarea id="ed-notes">${esc(d.restNotes.join("\n"))}</textarea></label>`;
    return h;
  }
  const last = SECTIONS.length - 1;
  SECTIONS.forEach(([sk, label], si) => {
    const arr = d.sections[sk];
    h += `<section class="block"><h2 class="blabel">${label}</h2>`;
    if (arr.length) {
      h += `<ul class="erows">${arr
        .map((x, i) => {
          const ex = program.ex[x.ex];
          const upOff = si === 0 && i === 0,
            downOff = si === last && i === arr.length - 1;
          return `<li><div class="en"><b>${esc(ex.name)}</b><small>${esc(typeLabel(ex))}${x.tag ? ` · ${esc(x.tag)}` : ""}</small></div><div class="eb"><button type="button" class="ib" data-mv="-1" data-sk="${sk}" data-i="${i}" aria-label="เลื่อน ${esc(ex.name)} ขึ้น"${upOff ? " disabled" : ""}>${I.up}</button><button type="button" class="ib" data-mv="1" data-sk="${sk}" data-i="${i}" aria-label="เลื่อน ${esc(ex.name)} ลง"${downOff ? " disabled" : ""}>${I.down}</button><button type="button" class="ib" data-editex="${esc(ex.id)}" data-sk="${sk}" data-i="${i}" aria-label="แก้ไข ${esc(ex.name)}">${I.pencil}</button><button type="button" class="ib danger" data-rm="${i}" data-sk="${sk}" aria-label="เอา ${esc(ex.name)} ออก">${I.x}</button></div></li>`;
        })
        .join("")}</ul>`;
    }
    h += `<button type="button" class="addrow" data-addto="${sk}">${I.plus}เพิ่มท่าใน ${label}</button></section>`;
  });
  h +=
    '<p class="hint">↑↓ สลับลำดับ และเลื่อนข้ามส่วนได้ · ✎ แก้ sets, reps, เวลาพัก, กล้ามเนื้อ และลิงก์ YouTube · ✕ เอาออกจากวันนี้ (บันทึกเก่ายังอยู่)</p>';
  return h;
}
function moveItem(sk, i, dir) {
  const d = program.days[state.day],
    keys = SECTIONS.map((s) => s[0]);
  const si = keys.indexOf(sk);
  const arr = d.sections[sk];
  const [x] = arr.splice(i, 1);
  let tsk = sk,
    ti;
  if (dir < 0) {
    if (i > 0) {
      ti = i - 1;
      arr.splice(ti, 0, x);
    } else if (si > 0) {
      tsk = keys[si - 1];
      d.sections[tsk].push(x);
      ti = d.sections[tsk].length - 1;
    } else {
      arr.unshift(x);
      ti = 0;
    }
  } else {
    if (i < arr.length) {
      ti = i + 1;
      arr.splice(ti, 0, x);
    } else if (si < keys.length - 1) {
      tsk = keys[si + 1];
      d.sections[tsk].unshift(x);
      ti = 0;
    } else {
      arr.push(x);
      ti = arr.length - 1;
    }
  }
  saveProgram();
  renderWorkout();
  const b = document.querySelector(`[data-mv="${dir}"][data-sk="${tsk}"][data-i="${ti}"]`);
  if (b && !b.disabled) b.focus();
  else {
    const o = document.querySelector(`[data-mv="${-dir}"][data-sk="${tsk}"][data-i="${ti}"]`);
    if (o) o.focus();
  }
}
function removeItem(sk, i) {
  const day = state.day,
    arr = program.days[day].sections[sk];
  const [x] = arr.splice(i, 1);
  if (!x) return;
  saveProgram();
  renderWorkout();
  const ex = program.ex[x.ex];
  toast(`เอา ${ex ? ex.name : "ท่า"} ออกแล้ว`, "เลิกทำ", () => {
    program.days[day].sections[sk].splice(Math.min(i, program.days[day].sections[sk].length), 0, x);
    saveProgram();
    if (state.day === day) renderWorkout();
  });
}
