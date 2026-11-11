/* timer.js — Rest timer and keep-screen-on (wake lock). */
"use strict";

/* ================= Rest timer ================= */
let timer = lsGet(K.timer),
  tInt = null,
  tDoneAt = null,
  actx = null;
function ensureAudio() {
  if (!settings.sound) return;
  try {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state === "suspended") actx.resume();
  } catch (e) {}
}
function beep() {
  if (!settings.sound || !actx) return;
  try {
    const t0 = actx.currentTime;
    [0, 0.28, 0.56].forEach((o) => {
      const os = actx.createOscillator(),
        g = actx.createGain();
      os.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t0 + o);
      g.gain.exponentialRampToValueAtTime(0.35, t0 + o + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + o + 0.2);
      os.connect(g);
      g.connect(actx.destination);
      os.start(t0 + o);
      os.stop(t0 + o + 0.22);
    });
  } catch (e) {}
}
function startRest(sec, label) {
  ensureAudio();
  timer = { end: Date.now() + sec * 1000, total: sec, label: label || "พัก" };
  lsSet(K.timer, timer);
  tDoneAt = null;
  showTimer();
}
function adjustTimer(d) {
  if (!timer) return;
  const now = Date.now();
  timer.end = Math.max(now, timer.end + d * 1000);
  timer.total = Math.max(1, timer.total + d);
  lsSet(K.timer, timer);
  tDoneAt = null;
  renderTimer();
}
function stopTimer() {
  timer = null;
  lsDel(K.timer);
  clearInterval(tInt);
  tInt = null;
  $("#timer").hidden = true;
  document.body.classList.remove("has-timer");
}
function showTimer() {
  $("#timer").hidden = false;
  document.body.classList.add("has-timer");
  renderTimer();
  clearInterval(tInt);
  tInt = setInterval(renderTimer, 250);
}
function renderTimer() {
  if (!timer) return;
  const rem = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
  $("#t-time").textContent = mmss(rem);
  $("#t-prog").style.transform = `scaleX(${Math.max(0, Math.min(1, rem / timer.total))})`;
  const card = $("#tcard");
  if (rem === 0) {
    if (!tDoneAt) {
      tDoneAt = Date.now();
      card.classList.add("done");
      $("#t-label").textContent = `ครบเวลาพัก · ${timer.label}`;
      $("#t-stop").textContent = "ปิด";
      beep();
      try {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      } catch (e) {}
    } else if (Date.now() - tDoneAt > 12000) stopTimer();
  } else {
    card.classList.remove("done");
    $("#t-label").textContent = `พัก · ${timer.label}`;
    $("#t-stop").textContent = "ข้าม";
  }
}

/* ================= Wake lock ================= */
let wake = null;
async function syncWake() {
  const want =
    !!settings.wake && state.view === "workout" && document.visibilityState === "visible";
  try {
    if (want && !wake && navigator.wakeLock) {
      wake = await navigator.wakeLock.request("screen");
      wake.addEventListener("release", () => {
        wake = null;
      });
    } else if (!want && wake) {
      const w = wake;
      wake = null;
      await w.release();
    }
  } catch (e) {
    wake = null;
  }
}
