/* main.js — Navigation, all tap/typing event handlers, and app start-up. */
"use strict";

/* ================= Navigation ================= */
function showView(v) {
  if (v === state.view) return;
  persistSessions();
  state.view = v;
  document
    .querySelectorAll("#tabs [data-tab]")
    .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tab === v)));
  $("#days").hidden = v !== "workout";
  ["workout", "body", "week", "settings"].forEach((x) => {
    $(`#v-${x}`).hidden = x !== v;
  });
  if (v === "workout") renderWorkout();
  if (v === "body") renderBody();
  if (v === "week") renderWeek();
  if (v === "settings") renderSettings();
  window.scrollTo(0, 0);
  syncWake();
}

/* ================= Logging events ================= */
function onField(t) {
  const exId = t.dataset.ex,
    f = t.dataset.f,
    i = +t.dataset.i,
    ex = program.ex[exId];
  if (!ex) return;
  const ent = entry(exId, true);
  if (f === "done") {
    ent.done = t.checked;
  } else if (f === "min" || f === "hr") {
    ent[f] = num(t.value);
  } else {
    ent.sets = ent.sets || [];
    while (ent.sets.length <= i) ent.sets.push({});
    const s = ent.sets[i];
    s[f] = num(t.value);
    if (
      f === "reps" &&
      s.reps != null &&
      s.kg == null &&
      (ex.type === "load" || ex.type === "bw")
    ) {
      const kgEl = document.getElementById(`f-${exId}-${i}-kg`);
      let cand = i > 0 && ent.sets[i - 1] ? num(ent.sets[i - 1].kg) : null;
      if (cand == null && kgEl && ex.type === "load") cand = plainNum(kgEl.placeholder);
      if (cand != null && kgEl && kgEl.value === "") {
        kgEl.value = fmt(cand);
        s.kg = cand;
      }
    }
  }
  touch();
  refreshDayMapSoon();
  if (f === "kg" || f === "reps") scheduleAdvice(exId);
}
function onTick(btn) {
  const exId = btn.dataset.tick,
    i = +btn.dataset.i,
    ex = program.ex[exId];
  if (!ex) return;
  ensureAudio();
  const ent = entry(exId, true);
  ent.sets = ent.sets || [];
  while (ent.sets.length <= i) ent.sets.push({});
  const s = ent.sets[i],
    row = btn.closest(".srow");
  if (!s.done) {
    row.querySelectorAll("input").forEach((inp) => {
      if (inp.value === "") {
        const v = plainNum(inp.placeholder);
        if (v != null) {
          inp.value = fmt(v);
          s[inp.dataset.f] = v;
        }
      }
    });
    s.done = true;
    if (settings.autoRest) startRest(restFor(ex), ex.name);
  } else s.done = false;
  row.classList.toggle("done", !!s.done);
  btn.setAttribute("aria-pressed", String(!!s.done));
  touch();
  if (state.mapMode === "done") refreshMap("day");
  clearTimeout(advT[exId]);
  updateAdvice(exId, !!s.done);
}

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset && t.dataset.ex && t.type !== "checkbox") {
    onField(t);
    return;
  }
  if (t.id === "ed-name" || t.id === "ed-focus") {
    const d = program.days[state.day];
    d[t.id === "ed-name" ? "name" : "focus"] = t.value;
    saveProgram();
    renderDays();
    return;
  }
  if (t.id === "ed-notes") {
    program.days[state.day].restNotes = t.value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    saveProgram();
    return;
  }
  if (t.id === "st-restC" || t.id === "st-restI") {
    const v = plainNum(t.value);
    if (v != null && v >= 10 && v <= 900) {
      settings[t.id === "st-restC" ? "restC" : "restI"] = v;
      saveSettings();
    }
    return;
  }
  if (t.id === "st-stepC" || t.id === "st-stepI") {
    const v = num(t.value);
    if (v != null && v >= 0.25 && v <= 20) {
      settings[t.id === "st-stepC" ? "stepC" : "stepI"] = v;
      saveSettings();
    }
    return;
  }
  if (t.id === "add-q") {
    const q = t.value.trim().toLowerCase();
    document.querySelectorAll("#add-list li").forEach((li) => {
      li.hidden = !!q && !li.dataset.name.includes(q);
    });
    return;
  }
  if (t.id === "bw-kg") state.bwDirty = true;
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset && t.dataset.ex && t.type === "checkbox") {
    onField(t);
    return;
  }
  if (t.id === "session-date") {
    persistSessions();
    state.date = t.value || todayISO();
    state.extra = {};
    renderWorkout();
    return;
  }
  if (t.id === "ed-rest") {
    program.days[state.day].rest = t.checked;
    saveProgramNow();
    renderDays();
    renderWorkout();
    return;
  }
  if (t.id === "e-type") {
    syncEditor();
    return;
  }
  if (t.id === "st-auto") {
    settings.autoRest = t.checked;
    saveSettings();
    return;
  }
  if (t.id === "st-sound") {
    settings.sound = t.checked;
    saveSettings();
    if (t.checked) ensureAudio();
    return;
  }
  if (t.id === "st-wake") {
    settings.wake = t.checked;
    saveSettings();
    syncWake();
    return;
  }
  if (t.id === "imp") {
    onImportFile(t.files && t.files[0]);
    t.value = "";
    return;
  }
  if (t.id === "bw-date") {
    state.bwDirty = false;
    syncBwForm();
    $("#bw-err").hidden = true;
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "bw-form") {
    e.preventDefault();
    saveBw();
  }
});
document.addEventListener("click", (e) => {
  const el = e.target.closest("button,[data-m],[data-close]");
  if (!el) return;
  const ds = el.dataset;
  if (ds.close !== undefined) {
    closeSheet();
    return;
  }
  if (ds.day) {
    if (ds.day !== state.day) {
      persistSessions();
      state.day = ds.day;
      state.date = defaultDateFor(ds.day);
      state.extra = {};
      state.sel = null;
      renderDays();
      renderWorkout();
      window.scrollTo(0, 0);
    }
    return;
  }
  if (ds.tab) {
    showView(ds.tab);
    return;
  }
  if (ds.tick) {
    onTick(el);
    return;
  }
  if (ds.addset) {
    const ex = program.ex[ds.addset];
    if (!ex) return;
    state.extra[ex.id] = (state.extra[ex.id] || 0) + 1;
    const box = document.querySelector(`[data-sets="${CSS.escape(ex.id)}"]`);
    if (box) {
      box.innerHTML = setsHTML(ex);
      const rows = box.querySelectorAll(".srow");
      const r = rows[rows.length - 1];
      const f = r && r.querySelector("input");
      if (f) f.focus();
    }
    return;
  }
  if (ds.m) {
    const card = el.closest(".mapcard");
    const kind = card && card.dataset.mapkind;
    if (kind === "week") {
      state.weekSel = state.weekSel === ds.m ? null : ds.m;
    } else {
      state.sel = state.sel === ds.m ? null : ds.m;
    }
    refreshMap(kind || "day");
    return;
  }
  if (ds.mapmode) {
    state.mapMode = ds.mapmode;
    refreshMap("day");
    return;
  }
  if (ds.weekmode) {
    state.weekMode = ds.weekmode;
    refreshMap("week");
    return;
  }
  if (ds.mv) {
    moveItem(ds.sk, +ds.i, +ds.mv);
    return;
  }
  if (ds.rm !== undefined && ds.sk) {
    removeItem(ds.sk, +ds.rm);
    return;
  }
  if (ds.editex) {
    openEditor(ds.editex, { day: state.day, sk: ds.sk, i: +ds.i });
    return;
  }
  if (ds.addto) {
    openAdd(ds.addto);
    return;
  }
  if (ds.pick) {
    program.days[state.day].sections[ds.sk].push(it(ds.pick));
    saveProgramNow();
    closeSheet();
    renderWorkout();
    toast(`เพิ่ม ${program.ex[ds.pick].name} แล้ว`);
    return;
  }
  if (ds.mus) {
    const k = ds.mus,
      c = edCtx;
    if (!c) return;
    const nx = c.mus[k] === "p" ? "s" : c.mus[k] === "s" ? "" : "p";
    if (nx) c.mus[k] = nx;
    else delete c.mus[k];
    el.dataset.st = nx;
    return;
  }
  if (ds.preset) {
    startRest(+ds.preset, "พัก");
    closeSheet();
    return;
  }
  if (ds.t) {
    if (ds.t === "stop") {
      stopTimer();
      closeSheet();
    } else adjustTimer(+ds.t);
    return;
  }
  if (ds.bwdate) {
    const d = $("#bw-date");
    d.value = ds.bwdate;
    state.bwDirty = false;
    syncBwForm();
    window.scrollTo(0, 0);
    $("#bw-kg").focus();
    return;
  }
  if (el.id === "timer-open") {
    ensureAudio();
    openTimerSheet();
    return;
  }
  switch (ds.act) {
    case "edit":
      persistSessions();
      state.edit = true;
      renderWorkout();
      break;
    case "done-edit":
      state.edit = false;
      saveProgramNow();
      renderDays();
      renderWorkout();
      break;
    case "add-new": {
      const sk = ds.sk;
      closeSheet();
      openEditor(null, { day: state.day, sk, isNew: true });
      break;
    }
    case "e-save":
      saveEditor();
      break;
    case "e-remove": {
      const c = edCtx;
      closeSheet();
      if (c && c.ctx) removeItem(c.ctx.sk, c.ctx.i);
      break;
    }
    case "export-json":
      exportJSON();
      break;
    case "export-csv":
      exportCSV();
      break;
    case "import": {
      const f = $("#imp");
      if (f) f.click();
      break;
    }
    case "imp-yes":
      applyImport();
      break;
    case "imp-no":
      pendingImport = null;
      $("#imp-box").hidden = true;
      break;
    case "reset-prog":
      if (!el.classList.contains("armed")) {
        el.classList.add("armed");
        el.textContent = "แตะอีกครั้งเพื่อยืนยันการรีเซ็ต";
        clearTimeout(resetArmT);
        resetArmT = setTimeout(() => {
          if (document.contains(el)) {
            el.classList.remove("armed");
            el.textContent = "รีเซ็ตตารางท่าเป็นค่าเริ่มต้น";
          }
        }, 4000);
      } else {
        clearTimeout(resetArmT);
        program = normalizeProgram(defaultProgram());
        saveProgramNow();
        renderDays();
        renderSettings();
        toast("รีเซ็ตตารางท่าแล้ว");
      }
      break;
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    persistSessions();
    saveProgramNow();
  } else {
    renderTimer();
  }
  syncWake();
});
window.addEventListener("pagehide", () => {
  persistSessions();
  saveProgramNow();
});

/* ================= Boot ================= */
updateBanner();
renderDays();
renderWorkout();
if (timer && timer.end > Date.now() - 12000) showTimer();
else if (timer) stopTimer();
syncWake();

/* ================= Offline support ================= */
if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
