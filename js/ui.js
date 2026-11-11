/* ui.js — Banner messages and toast notifications. */
"use strict";

/* ================= Banner + toast ================= */
function updateBanner() {
  const m = [];
  if (IN_PREVIEW)
    m.push([
      "",
      "นี่คือหน้า preview ใน Claude ข้อมูลที่จดที่นี่แยกจากแอปที่ติดตั้งบน iPhone และปุ่ม backup อาจใช้ไม่ได้ในหน้านี้",
    ]);
  if (!storageOK)
    m.push([
      "warn",
      "เครื่องนี้บันทึกข้อมูลไม่ได้ (พื้นที่เต็มหรือถูกบล็อก) ข้อมูลใหม่อาจหายเมื่อปิดแอป",
    ]);
  const b = $("#banner");
  if (!m.length) {
    b.hidden = true;
    b.innerHTML = "";
    return;
  }
  b.hidden = false;
  b.dataset.tone = m.some((x) => x[0] === "warn") ? "warn" : "";
  b.innerHTML = m.map((x) => `<p>${esc(x[1])}</p>`).join("");
}
let toastT = null;
function toast(msg, actLabel, fn) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>${actLabel ? `<button type="button" id="toast-act">${esc(actLabel)}</button>` : ""}`;
  t.hidden = false;
  if (fn)
    $("#toast-act").addEventListener(
      "click",
      () => {
        t.hidden = true;
        fn();
      },
      { once: true },
    );
  clearTimeout(toastT);
  toastT = setTimeout(
    () => {
      t.hidden = true;
    },
    fn ? 6000 : 2600,
  );
}
