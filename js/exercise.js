/* exercise.js — Exercise helpers, weight-progression advice, embedded YouTube clips. */
"use strict";

/* ================= Exercise helpers ================= */
const isLogged = (ex) => ["load", "bw", "reps", "hold"].includes(ex.type);
function rxText(ex) {
  if (ex.type === "cardio" || ex.type === "check") return ex.rx || "";
  const r = ex.lo === ex.hi ? String(ex.lo) : `${ex.lo}–${ex.hi}`;
  return `${ex.sets} × ${r}${ex.type === "hold" ? "s" : ""}`;
}
function restFor(ex) {
  return num(ex.rest) > 0
    ? num(ex.rest)
    : ex.cls === "c"
      ? num(settings.restC) || 150
      : num(settings.restI) || 90;
}
/* ---------- Progression (double progression, per the program's overload rules) ---------- */
const r2 = (v) => Math.round(v * 100) / 100;
function stepFor(ex) {
  return num(ex.step) > 0
    ? num(ex.step)
    : ex.cls === "c"
      ? num(settings.stepC) || 2.5
      : num(settings.stepI) || 1;
}
// Judge one logged session of an exercise. null until every prescribed set has reps.
function evalEntry(ex, e) {
  if (!e || !["load", "bw"].includes(ex.type)) return null;
  const n = num(ex.sets) || 1,
    sets = (e.sets || []).slice(0, n);
  if (sets.length < n || sets.some((s) => !s || num(s.reps) == null)) return null;
  const reps = sets.map((s) => num(s.reps)),
    kgs = sets.map((s) => num(s.kg)),
    step = stepFor(ex);
  if (reps.every((r) => r >= ex.hi)) {
    const next = kgs.map((k) =>
      ex.type === "load" ? (k == null ? null : r2(k + step)) : r2((k || 0) + step),
    );
    return { st: "ready", reps, kgs, next };
  }
  const loaded = ex.type === "load" || kgs.some((k) => k > 0);
  if (loaded && reps.some((r) => r < ex.lo))
    return {
      st: "heavy",
      reps,
      kgs,
      next: kgs,
      down: kgs.map((k) => (k == null ? null : Math.max(0, r2(k - step)))),
    };
  return { st: "keep", reps, kgs, next: kgs };
}
function kgText(arr) {
  const v = (arr || []).filter((k) => k != null);
  if (!v.length) return "";
  const u = [...new Set(v.map(fmt))];
  return `${u.length === 1 ? u[0] : v.map(fmt).join(" / ")} kg`;
}
function loadText(ex, arr) {
  if (ex.type === "bw") {
    const v = (arr || []).map((k) => k || 0);
    return v.some((k) => k > 0) ? `+${kgText(v)}` : "BW";
  }
  return kgText(arr);
}
function readyTag(ex, ev) {
  if (ex.ready) return ex.ready;
  if (ex.type === "bw") return `วันนี้ถ่วง ${loadText(ex, ev.next)}`;
  const t = kgText(ev.next);
  return t ? `วันนี้เพิ่มเป็น ${t}` : "วันนี้เพิ่มน้ำหนัก";
}
// Same weight for the last 3 complete sessions and total reps not going up.
function stalled(ex, hist) {
  const ev = hist
    .map((h) => evalEntry(ex, h.e))
    .filter(Boolean)
    .slice(0, 3);
  if (ev.length < 3 || ev[0].st === "ready") return false;
  const k = (x) => JSON.stringify(x.kgs),
    tot = (x) => x.reps.reduce((a, b) => a + b, 0);
  return k(ev[0]) === k(ev[1]) && k(ev[1]) === k(ev[2]) && tot(ev[0]) <= tot(ev[2]);
}
// Live advice for the session being logged now.
function adviceFor(ex, e) {
  const ev = evalEntry(ex, e);
  if (!ev) return null;
  const now = ev.reps.map(fmt).join(" · ");
  if (ev.st === "ready") {
    let tail;
    if (ex.ready) tail = `ครั้งหน้า: <b>${esc(ex.ready.replace(/^.*→\s*/, ""))}</b>`;
    else if (ex.type === "bw") tail = `ครั้งหน้าถ่วง <b>${esc(loadText(ex, ev.next))}</b>`;
    else {
      const t = kgText(ev.next);
      tail = t ? `ครั้งหน้าใช้ <b>${esc(t)}</b>` : "ครั้งหน้าเพิ่มน้ำหนัก";
    }
    return { st: "ready", html: `<b>ครบ ${ex.hi} reps ทุก set</b> → ${tail} (ถ้าฟอร์มยังดี)` };
  }
  const cur = loadText(ex, ev.kgs) || "น้ำหนักเดิม";
  if (ev.st === "heavy")
    return {
      st: "heavy",
      html: `มี set ต่ำกว่า ${ex.lo} reps → ครั้งหน้าใช้ <b>${esc(cur)}</b> เท่าเดิม ถ้ายังไม่ถึงอีกครั้งค่อยลดเป็น <b>${esc(loadText(ex, ev.down))}</b>`,
    };
  return {
    st: "keep",
    html: `ครั้งหน้าใช้ <b>${esc(cur)}</b> ต่อ · เป้า ${ex.hi} reps ทุก set (ตอนนี้ ${now})`,
  };
}
const advT = {};
function updateAdvice(exId, announce) {
  const ex = program.ex[exId],
    el = document.getElementById(`adv-${exId}`);
  if (!ex || !el) return;
  const a = adviceFor(ex, entry(exId, false));
  el.hidden = !a;
  el.dataset.st = a ? a.st : "";
  el.innerHTML = a ? a.html : "";
  const k = `${curKey()}|${exId}`;
  if (a && a.st === "ready") {
    if (announce && !state.toasted[k]) {
      state.toasted[k] = true;
      toast(`${ex.name} พร้อมเพิ่มน้ำหนักครั้งหน้า`);
    }
  } else delete state.toasted[k];
}
function scheduleAdvice(exId) {
  clearTimeout(advT[exId]);
  advT[exId] = setTimeout(() => updateAdvice(exId, false), 400);
}
function readyList() {
  const sorted = sortedSessions(),
    out = [];
  Object.keys(program.ex).forEach((id) => {
    const ex = program.ex[id];
    if (!["load", "bw"].includes(ex.type)) return;
    const days = usedIn(id);
    if (!days.length) return;
    // latest COMPLETE session decides; a half-logged session today doesn't hide the suggestion
    for (const s of sorted) {
      const e = s.v.entries && s.v.entries[id];
      const ev = hasData(e) ? evalEntry(ex, e) : null;
      if (ev) {
        if (ev.st === "ready") out.push({ ex, ev, days, date: s.v.date });
        break;
      }
    }
  });
  return out;
}
function startLine(ex) {
  if (ex.type === "load" && ex.startKg.length)
    return `เริ่มที่ <b>${esc(ex.startKg.map(fmt).join(" / "))} kg</b>`;
  if (ex.type === "bw" && ex.startReps.length)
    return `ในโน้ตเดิม <b>${esc(ex.startReps.join(" · "))} reps</b>`;
  return "ยังไม่มีบันทึก";
}
function usedIn(exId) {
  return ORDER.filter((dk) =>
    SECTIONS.some(([sk]) => program.days[dk].sections[sk].some((x) => x.ex === exId)),
  ).map((dk) => DN[dk]);
}
function typeLabel(e) {
  if (e.type === "check") return `เช็กลิสต์ · ${e.rx || ""}`;
  if (e.type === "cardio") return `Cardio · ${e.rx || ""}`;
  return (
    rxText(e) +
    (e.type === "bw" ? " · BW" : e.type === "hold" ? "" : e.type === "reps" ? " · reps" : " · kg")
  );
}
function plannedSets(ex) {
  if (ex.type === "cardio") return 0;
  if (ex.type === "check") return parseSets(ex.rx);
  return num(ex.sets) || 0;
}
function doneSets(ex, e) {
  if (!e || ex.type === "cardio") return 0;
  if (ex.type === "check") return e.done ? parseSets(ex.rx) : 0;
  return (e.sets || []).filter((s) => s && (s.done || num(s.reps) != null || num(s.sec) != null))
    .length;
}
function ytLink(ex) {
  const u = safeUrl(ex.yt);
  if (!u) return "";
  return `<a class="yt" href="${esc(u)}" target="_blank" rel="noopener" aria-label="ดูท่า ${esc(ex.name)} บน YouTube">${I.play}</a>`;
}

/* ---------- Embedded clip: plays muted when scrolled into view ---------- */
function ytId(u) {
  const m = String(u || "").match(/(?:youtu\.be\/|\/shorts\/|\/embed\/|[?&]v=)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : "";
}
function clipHTML(ex) {
  const id = ex.clip ? ytId(ex.yt) : "";
  if (!id || IN_PREVIEW) return "";
  return `<div class="clip${/\/shorts\//.test(ex.yt) ? " tall" : ""}" data-clip="${id}"></div>`;
}
let clipObs = null;
function clipCmd(box, func) {
  const f = box.querySelector("iframe");
  if (f && f.contentWindow)
    f.contentWindow.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
}
function observeClips() {
  if (!("IntersectionObserver" in window)) return;
  if (!clipObs)
    clipObs = new IntersectionObserver(
      (list) =>
        list.forEach((en) => {
          const box = en.target;
          if (en.isIntersecting) {
            if (!box.querySelector("iframe")) {
              const id = box.dataset.clip,
                f = document.createElement("iframe");
              f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${id}&rel=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
              f.title = "วิดีโอสาธิตท่า";
              f.allow = "autoplay; encrypted-media; picture-in-picture";
              f.referrerPolicy = "strict-origin-when-cross-origin";
              box.appendChild(f);
            } else clipCmd(box, "playVideo");
          } else clipCmd(box, "pauseVideo");
        }),
      { threshold: 0.5 },
    );
  clipObs.disconnect();
  document.querySelectorAll("#v-workout .clip").forEach((el) => clipObs.observe(el));
}
