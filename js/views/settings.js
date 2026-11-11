/* settings.js — Settings page, backup/restore, CSV export. */
"use strict";

/* ================= Settings view ================= */
let pendingImport = null,
  resetArmT = null;
function renderSettings() {
  const nS = Object.keys(sessions).length,
    nB = Object.keys(bw).length;
  let h = `<section class="card"><h2 class="ch">เพิ่มน้ำหนัก</h2><div class="row2"><label class="fld num">Compound เพิ่มทีละ (kg)<input id="st-stepC" inputmode="decimal" value="${esc(settings.stepC)}"></label><label class="fld num">Isolation เพิ่มทีละ (kg)<input id="st-stepI" inputmode="decimal" value="${esc(settings.stepI)}"></label></div><p class="hint">แอปจะแนะนำให้เพิ่มน้ำหนักเมื่อทำได้ถึง reps สูงสุดครบทุก set ตาม progressive overload rule ตั้งค่าแยกรายท่าได้ในหน้าแก้ไขท่า เช่น dumbbell ที่ยิมขึ้นทีละ 2 kg</p></section>`;
  h += `<section class="card"><h2 class="ch">Rest timer</h2><div class="row2"><label class="fld num">Compound (วินาที)<input id="st-restC" inputmode="numeric" value="${esc(settings.restC)}"></label><label class="fld num">Isolation (วินาที)<input id="st-restI" inputmode="numeric" value="${esc(settings.restI)}"></label></div><p class="hint">ใช้กับท่าที่ไม่ได้ตั้งเวลาพักเอง</p><label class="switch"><span>เริ่มจับเวลาพักเมื่อกด ✓ ที่ set</span><input type="checkbox" id="st-auto"${settings.autoRest ? " checked" : ""}></label><label class="switch"><span>เสียงเตือนเมื่อครบเวลา</span><input type="checkbox" id="st-sound"${settings.sound ? " checked" : ""}></label><p class="hint">iPhone จะไม่เตือนถ้าล็อกจอหรือสลับไปแอปอื่น เวลาที่เหลือจะคำนวณใหม่ทันทีที่กลับมา และถ้าเปิดโหมดเงียบอยู่ อาจไม่มีเสียง</p></section>`;
  const th = settings.theme || "auto";
  const opt = (v, label) => `<option value="${v}"${th === v ? " selected" : ""}>${label}</option>`;
  h += `<section class="card"><h2 class="ch">หน้าจอ</h2>
    <label class="fld">ธีม<select id="st-theme">${opt("auto", "ตามเครื่อง")}${opt("light", "สว่าง")}${opt("dark", "มืด")}</select></label>
    <label class="switch"><span>ไม่ให้จอดับตอนอยู่หน้า Workout</span><input type="checkbox" id="st-wake"${settings.wake ? " checked" : ""}></label></section>`;
  h += `<section class="card"><h2 class="ch">ข้อมูล</h2><p class="hint">เก็บอยู่ในเครื่องนี้เท่านั้น: ${nS} วันซ้อม · ${nB} ค่าน้ำหนักตัว · ${Object.keys(program.ex).length} ท่า ควร Backup เก็บไว้เป็นระยะ</p><div class="btns"><button type="button" class="btn" data-act="export-json">Backup (.json)</button><button type="button" class="btn ghost" data-act="export-csv">Export CSV (Excel / Sheets)</button><button type="button" class="btn ghost" data-act="import">Restore จากไฟล์ backup</button><input type="file" id="imp" class="vh" accept="application/json,.json" tabindex="-1"></div><div id="imp-box" hidden></div><button type="button" class="btn danger" id="reset-prog" data-act="reset-prog">รีเซ็ตตารางท่าเป็นค่าเริ่มต้น</button><p class="hint">รีเซ็ตเฉพาะตารางท่า บันทึก reps และน้ำหนักตัวยังอยู่ครบ</p></section>`;
  h += `<section class="card"><h2 class="ch">ติดตั้งบน iPhone</h2>${STANDALONE ? '<p class="hint">เปิดเป็นแอปบน Home Screen อยู่แล้ว</p>' : '<ol class="hint" style="margin:0;padding-left:20px;display:grid;gap:4px"><li>เปิดหน้านี้ใน Safari</li><li>แตะปุ่ม Share</li><li>เลือก Add to Home Screen แล้วกด Add</li></ol>'}</section>`;
  h += `<p class="hint" style="text-align:center">Weekly Training · v${VERSION}</p>`;
  $("#v-settings").innerHTML = h;
}
function stamp() {
  return todayISO();
}
async function saveFile(name, text, mime) {
  if (IN_PREVIEW) {
    toast("ปุ่มนี้ใช้ได้ในแอปที่ติดตั้งแล้ว");
    return;
  }
  const blob = new Blob([text], { type: mime });
  try {
    const file = new File([blob], name, { type: mime });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (e) {
    toast("บันทึกไฟล์ไม่สำเร็จ");
  }
}
function exportJSON() {
  persistSessions();
  saveFile(
    `training-backup-${stamp()}.json`,
    JSON.stringify({
      app: APP,
      version: 1,
      exportedAt: new Date().toISOString(),
      program,
      sessions,
      bw,
      settings,
    }),
    "application/json",
  );
}
function exportCSV() {
  persistSessions();
  const q = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    ["type", "date", "day", "exercise", "set", "kg", "reps", "sec", "done", "min", "hr"],
  ];
  Object.values(sessions)
    .filter((s) => s && s.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((s) => {
      Object.keys(s.entries || {}).forEach((id) => {
        const e = s.entries[id],
          name = program.ex[id] ? program.ex[id].name : id;
        (e.sets || []).forEach((st, i) => {
          if (setHas(st))
            rows.push([
              "set",
              s.date,
              DN[s.day] || s.day,
              name,
              i + 1,
              st.kg,
              st.reps,
              st.sec,
              st.done ? 1 : 0,
              "",
              "",
            ]);
        });
        if (num(e.min) != null || num(e.hr) != null)
          rows.push(["cardio", s.date, DN[s.day] || s.day, name, "", "", "", "", "", e.min, e.hr]);
        if (e.done)
          rows.push(["check", s.date, DN[s.day] || s.day, name, "", "", "", "", 1, "", ""]);
      });
    });
  Object.values(bw)
    .filter((v) => v && v.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((v) => rows.push(["bodyweight", v.date, "", "", "", v.kg, "", "", "", "", ""]));
  saveFile(
    `training-log-${stamp()}.csv`,
    `${rows.map((r) => r.map(q).join(",")).join("\n")}`,
    "text/csv",
  );
}
function onImportFile(file) {
  const box = $("#imp-box");
  if (!file || !box) return;
  const rd = new FileReader();
  rd.onload = () => {
    let obj = null;
    try {
      obj = JSON.parse(String(rd.result));
    } catch (e) {}
    if (!obj || typeof obj !== "object" || !obj.program || !obj.program.ex || !obj.program.days) {
      box.hidden = false;
      box.innerHTML = '<p class="err">ไฟล์นี้ไม่ใช่ backup ของแอปนี้</p>';
      return;
    }
    pendingImport = obj;
    const nS = Object.keys(obj.sessions || {}).length,
      nB = Object.keys(obj.bw || {}).length;
    box.hidden = false;
    box.innerHTML = `<div class="alert" style="display:grid;gap:10px"><span>แทนที่ข้อมูลทั้งหมดในเครื่องนี้ด้วยไฟล์นี้? (${nS} วันซ้อม · ${nB} ค่าน้ำหนักตัว)</span><div class="row2"><button type="button" class="btn" data-act="imp-yes">แทนที่</button><button type="button" class="btn ghost" data-act="imp-no">ยกเลิก</button></div></div>`;
  };
  rd.readAsText(file);
}
function applyImport() {
  const o = pendingImport;
  if (!o) return;
  program = normalizeProgram(o.program);
  sessions = o.sessions && typeof o.sessions === "object" ? o.sessions : {};
  bw = o.bw && typeof o.bw === "object" ? o.bw : {};
  settings = Object.assign(settings, o.settings || {});
  saveProgramNow();
  lsSet(K.sess, sessions);
  lsSet(K.bw, bw);
  saveSettings();
  pendingImport = null;
  renderDays();
  renderSettings();
  toast("กู้ข้อมูลจาก backup แล้ว");
}
