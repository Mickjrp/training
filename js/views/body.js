/* body.js — Body weight page. */
"use strict";

/* ================= Body weight view ================= */
function renderBody() {
  $("#v-body").innerHTML =
    `<section class="block"><h2 class="blabel">บันทึกน้ำหนักตัว</h2><form class="card" id="bw-form" novalidate><div class="row2"><label class="fld num">วันที่<input type="date" id="bw-date" value="${todayISO()}"></label><label class="fld num">น้ำหนัก (kg)<input id="bw-kg" inputmode="decimal" autocomplete="off" placeholder="53.0"></label></div><button class="btn" type="submit" id="bw-save">บันทึก</button><p class="err" id="bw-err" hidden></p><p class="hint">ชั่งตอนเช้า 3–4 วัน/สัปดาห์ แล้วดูค่าเฉลี่ยรายสัปดาห์ · เว้นช่องว่างแล้วกดบันทึก = ลบค่าของวันนั้น</p></form></section><div class="view" id="bw-body"></div>`;
  state.bwDirty = false;
  syncBwForm();
  renderBwBody();
}
function syncBwForm() {
  const d = $("#bw-date"),
    k = $("#bw-kg"),
    b = $("#bw-save");
  if (!d) return;
  const ex = bw[d.value];
  k.value = ex && num(ex.kg) != null ? num(ex.kg).toFixed(1) : "";
  b.textContent = ex ? "อัปเดต" : "บันทึก";
}
function rateChip(r) {
  if (r == null) return '<span class="chip none">–</span>';
  const t = (r > 0 ? "+" : "") + r.toFixed(2);
  if (r <= 0) return `<span class="chip bad">${t} ไม่ขึ้น</span>`;
  if (r < 0.15) return `<span class="chip warn">${t} ช้ากว่าเป้า</span>`;
  if (r <= 0.25) return `<span class="chip good">${t} ตามเป้า</span>`;
  return `<span class="chip warn">${t} เร็วกว่าเป้า</span>`;
}
function renderBwBody() {
  const host = $("#bw-body");
  if (!host) return;
  const list = Object.values(bw)
    .filter((v) => v && v.date && num(v.kg) != null)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!list.length) {
    host.innerHTML = '<p class="empty">ยังไม่มีบันทึก ใส่น้ำหนักเช้าวันนี้ด้านบนเพื่อเริ่ม</p>';
    return;
  }
  const g = new Map();
  list.forEach((v) => {
    const ws = weekStart(v.date);
    if (!g.has(ws)) g.set(ws, []);
    g.get(ws).push(num(v.kg));
  });
  const wk = [...g.entries()]
    .map(([s, a]) => ({ s, avg: a.reduce((x, y) => x + y, 0) / a.length, n: a.length }))
    .sort((a, b) => b.s.localeCompare(a.s));
  wk.forEach((w, i) => {
    const p = wk[i + 1];
    w.rate = p ? (w.avg - p.avg) / Math.max(1, daysBetween(w.s, p.s) / 7) : null;
  });
  const cur = weekStart(todayISO()),
    thisWk = wk.find((w) => w.s === cur),
    complete = wk.filter((w) => w.s < cur),
    latest = list[0];
  let h = `<div class="stats"><div class="stat"><div class="k">ล่าสุด</div><div class="v">${num(latest.kg).toFixed(1)} <small>kg</small></div><div class="s">${esc(thDay(latest.date))}</div></div><div class="stat"><div class="k">เฉลี่ยสัปดาห์นี้</div><div class="v">${thisWk ? thisWk.avg.toFixed(2) : "–"} <small>kg</small></div><div class="s">${thisWk ? `${thisWk.n} วันที่ชั่ง` : "ยังไม่ได้ชั่งสัปดาห์นี้"}</div></div></div>`;
  if (complete.length >= 3 && complete[0].avg <= complete[2].avg)
    h +=
      '<p class="alert">ค่าเฉลี่ยไม่ขึ้นมา 2 สัปดาห์แล้ว → เพิ่ม <b>100–150 kcal/วัน</b> ตามกฎ</p>';
  else if (complete.length < 3)
    h +=
      '<p class="hint">กฎ “ไม่ขึ้น 2 สัปดาห์ → +100–150 kcal” จะเช็กให้อัตโนมัติเมื่อมีข้อมูลครบ 3 สัปดาห์</p>';
  h += `<section class="block"><h2 class="blabel">รายสัปดาห์ · เป้า +0.15–0.25 kg</h2><div class="tablewrap"><table><thead><tr><th>สัปดาห์เริ่ม</th><th>เฉลี่ย</th><th>วัน</th><th>ต่อสัปดาห์</th></tr></thead><tbody>${wk
    .slice(0, 8)
    .map(
      (w) =>
        `<tr><td>${esc(thDate(w.s))}${w.s === cur ? " (นี้)" : ""}</td><td class="n">${w.avg.toFixed(2)}</td><td class="n">${w.n}</td><td>${rateChip(w.rate)}</td></tr>`,
    )
    .join("")}</tbody></table></div></section>`;
  h += `<section class="block"><h2 class="blabel">บันทึกล่าสุด</h2><ul class="recent">${list
    .slice(0, 12)
    .map(
      (v) =>
        `<li><button type="button" data-bwdate="${esc(v.date)}"><span>${esc(thDay(v.date))}</span><b>${num(v.kg).toFixed(1)} kg</b></button></li>`,
    )
    .join("")}</ul></section>`;
  host.innerHTML = h;
}
function saveBw() {
  const d = $("#bw-date").value,
    raw = $("#bw-kg").value,
    err = $("#bw-err");
  err.hidden = true;
  if (!d) {
    err.textContent = "เลือกวันที่ก่อน";
    err.hidden = false;
    return;
  }
  const kg = num(raw);
  if (raw.trim() !== "" && (kg == null || kg < 25 || kg > 250)) {
    err.textContent = "ใส่น้ำหนักเป็น kg เช่น 53.2";
    err.hidden = false;
    return;
  }
  if (kg == null) delete bw[d];
  else bw[d] = { date: d, kg: Math.round(kg * 10) / 10 };
  lsSet(K.bw, bw);
  state.bwDirty = false;
  syncBwForm();
  renderBwBody();
  toast(
    kg == null
      ? `ลบค่าวันที่ ${thDate(d)} แล้ว`
      : `บันทึก ${(Math.round(kg * 10) / 10).toFixed(1)} kg แล้ว`,
  );
}
