/* utils.js — Small helpers: DOM, escaping, numbers, dates, URLs. */
"use strict";

/* ================= Helpers ================= */
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch],
  );
function clone(o) {
  return JSON.parse(JSON.stringify(o == null ? {} : o));
}
function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isFinite(n) ? n : null;
}
function plainNum(v) {
  return /^\d+(\.\d+)?$/.test(String(v).trim()) ? parseFloat(v) : null;
}
function fmt(n) {
  return n == null ? "" : String(Math.round(n * 100) / 100);
}
function fmtS(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
function mmss(sec) {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
const pad = (n) => String(n).padStart(2, "0");
function isoLocal(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseISO(s) {
  const p = String(s).split("-").map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}
const todayISO = () => isoLocal(new Date());
function defaultDateFor(day) {
  const t = new Date();
  const diff = (t.getDay() - DAYS.indexOf(day) + 7) % 7;
  return isoLocal(new Date(t.getFullYear(), t.getMonth(), t.getDate() - diff));
}
function thDate(iso) {
  try {
    return parseISO(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  } catch (e) {
    return iso;
  }
}
function thDay(iso) {
  try {
    return parseISO(iso).toLocaleDateString("th-TH", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch (e) {
    return iso;
  }
}
function weekStart(iso) {
  const d = parseISO(iso);
  const off = (d.getDay() + 6) % 7;
  return isoLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() - off));
}
function daysBetween(a, b) {
  return Math.round((parseISO(a) - parseISO(b)) / 86400000);
}
function safeUrl(u) {
  u = String(u || "").trim();
  return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : "";
}
function parseSets(rx) {
  const m = String(rx || "").match(/^\s*(\d+)\s*[×xX]/);
  return m ? parseInt(m[1], 10) : 1;
}
const IN_PREVIEW = !!(window.claude && typeof window.claude.use === "function");
const STANDALONE = !!(
  window.navigator.standalone ||
  (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
);
