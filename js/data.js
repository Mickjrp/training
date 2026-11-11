/* data.js — App info, icons, reference data (days, muscles, exercise types) and the default program. */
"use strict";

/* ---------- App info ---------- */
const APP = "weekly-training",
  VERSION = "1.3.0";

/* ================= Icons ================= */
const I = {
  pencil: '<svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
  up: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  x: '<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>',
};

/* ================= Reference data ================= */
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DN = { mon: "MON", tue: "TUE", wed: "WED", thu: "THU", fri: "FRI", sat: "SAT", sun: "SUN" };
const SECTIONS = [
  ["warmup", "Warm-up"],
  ["plyo", "Plyometrics"],
  ["strength", "Strength"],
  ["core", "Core"],
  ["cardio", "Cardio"],
];
const SECLABEL = Object.fromEntries(SECTIONS);
const MUSCLES = [
  ["chest", "Chest", "อก"],
  ["front-delts", "Front delts", "ไหล่หน้า"],
  ["side-delts", "Side delts", "ไหล่ข้าง"],
  ["rear-delts", "Rear delts", "ไหล่หลัง"],
  ["traps", "Traps", "บ่า"],
  ["mid-back", "Mid back", "หลังกลาง"],
  ["lats", "Lats", "ปีก"],
  ["lower-back", "Lower back", "หลังล่าง"],
  ["biceps", "Biceps", "ต้นแขนหน้า"],
  ["triceps", "Triceps", "ต้นแขนหลัง"],
  ["forearms", "Forearms", "แขนท่อนล่าง"],
  ["abs", "Abs", "หน้าท้อง"],
  ["obliques", "Obliques", "ข้างเอว"],
  ["glutes", "Glutes", "ก้น"],
  ["quads", "Quads", "ต้นขาหน้า"],
  ["hamstrings", "Hamstrings", "ต้นขาหลัง"],
  ["calves", "Calves", "น่อง"],
];
const MUS = Object.fromEntries(MUSCLES.map((x) => [x[0], x]));
const TYPES = [
  ["load", "น้ำหนัก (kg × reps)"],
  ["bw", "Bodyweight (+kg × reps)"],
  ["reps", "Reps อย่างเดียว"],
  ["hold", "ค้างเวลา (วินาที)"],
  ["cardio", "Cardio (นาที + HR)"],
  ["check", "เช็กลิสต์ (warm-up / plyo)"],
];

/* ================= Default program ================= */
const Y = (id) => `https://youtu.be/${id}`,
  YS = (id) => `https://youtube.com/shorts/${id}`;
function mm(p, s) {
  const sp = (x) => (x ? x.split(" ").filter(Boolean) : []);
  return { p: sp(p), s: sp(s) };
}
function L(id, name, o) {
  return Object.assign(
    {
      id,
      name,
      type: "load",
      sets: 3,
      lo: 8,
      hi: 12,
      cls: "i",
      rest: 0,
      step: 0,
      startKg: [],
      startReps: [],
      note: "",
      rx: "",
      yt: "",
      ready: "",
      muscles: { p: [], s: [] },
    },
    o || {},
  );
}
function C(id, name, rx, o) {
  return L(id, name, Object.assign({ type: "check", rx }, o || {}));
}
const DEF_EX = [
  C("open-book", "Open book", "2×10", { yt: Y("Tqv_2oe64vk") }),
  C("tspine", "T-spine stretch", "2×30s", { yt: Y("qovO0ysEpuc") }),
  C("sa-face-pull", "SA face pull", "2×8", { yt: YS("__vgT7K5qKU") }),
  C("seated-er", "Seated external rotation", "2×10", { yt: Y("T_YznGUyE0Q") }),
  L("chest-press", "Chest press", {
    sets: 3,
    lo: 6,
    hi: 8,
    cls: "c",
    startKg: [40],
    yt: YS("aArjHvULFP4"),
    clip: true,
    note: "Scap retracted, elbows 45° · Warm-up 1×10 ▸ 20 kg",
    muscles: mm("chest", "front-delts triceps"),
  }),
  L("dip", "Dip", {
    type: "bw",
    sets: 3,
    lo: 6,
    hi: 10,
    cls: "c",
    note: "10 clean reps ทุก set → เริ่มถ่วงน้ำหนัก",
    yt: YS("MDOjin9jxuY"),
    muscles: mm("chest triceps", "front-delts"),
  }),
  L("ohp", "Overhead press", {
    sets: 3,
    lo: 8,
    hi: 12,
    cls: "c",
    muscles: mm("front-delts", "side-delts triceps traps"),
  }),
  L("lateral-raise", "Lateral raise", {
    sets: 2,
    lo: 12,
    hi: 15,
    startKg: [7],
    note: "Pain-free 4+ สัปดาห์ → 3 sets",
    muscles: mm("side-delts", "traps"),
  }),
  L("fly", "Fly", { sets: 2, lo: 10, hi: 15, muscles: mm("chest", "front-delts") }),
  L("triceps-ext", "Triceps extension", { sets: 3, lo: 10, hi: 12, muscles: mm("triceps") }),
  L("biceps-curl", "Biceps curl", { sets: 3, lo: 10, hi: 12, muscles: mm("biceps", "forearms") }),
  L("situps", "Sit-ups", {
    type: "reps",
    sets: 3,
    lo: 15,
    hi: 15,
    yt: Y("1pbZ8mX2D1U"),
    muscles: mm("abs", "obliques"),
  }),
  C("bike", "Bike", "3–5 min"),
  C("sl-legext-iso", "SL leg ext iso", "1×30s", { yt: YS("OcjA4MjLDLo") }),
  C("iso-lunge", "Iso lunge", "1×30–40s", { yt: YS("q9fF5QoeN7U") }),
  C("sl-pogo", "SL pogo", "2×15", { yt: YS("_pDStuHcvTc"), muscles: mm("calves") }),
  C("box-jump", "Box jump", "2×5", {
    yt: "https://www.youtube.com/watch?v=j0nl5dWuqN4",
    muscles: mm("quads glutes", "calves"),
  }),
  C("depth-drop", "Depth drop", "2×5", {
    yt: YS("LvQLWtzQsRE"),
    muscles: mm("quads", "calves glutes"),
  }),
  L("back-squat", "Back squat", {
    sets: 3,
    lo: 8,
    hi: 10,
    cls: "c",
    startKg: [15],
    muscles: mm("quads glutes", "hamstrings lower-back"),
  }),
  L("sl-leg-ext", "SL leg extension", {
    sets: 3,
    lo: 5,
    hi: 8,
    startKg: [30],
    yt: YS("qRzzAAYk4BQ"),
    muscles: mm("quads"),
  }),
  L("split-squat", "Short split squat", {
    sets: 3,
    lo: 6,
    hi: 8,
    cls: "c",
    startKg: [16],
    yt: YS("02kvTJgao-M"),
    muscles: mm("quads glutes", "hamstrings"),
  }),
  C("ytw", "Y-T-W pulls", "2×10", { yt: YS("tlcuHSz1TQE") }),
  L("row", "Row", {
    sets: 4,
    lo: 6,
    hi: 8,
    cls: "c",
    startKg: [45],
    muscles: mm("lats mid-back", "biceps rear-delts"),
  }),
  L("kelso", "Kelso shrug", {
    sets: 3,
    lo: 10,
    hi: 12,
    startKg: [16],
    muscles: mm("mid-back traps", "rear-delts"),
  }),
  L("lat-pulldown", "Lat pulldown", {
    sets: 3,
    lo: 8,
    hi: 12,
    cls: "c",
    startKg: [45],
    muscles: mm("lats", "biceps mid-back"),
  }),
  L("straight-arm", "Straight arm pulldown", {
    sets: 2,
    lo: 10,
    hi: 15,
    muscles: mm("lats", "triceps"),
  }),
  L("reverse-fly", "Reverse fly", {
    sets: 2,
    lo: 12,
    hi: 15,
    note: "Rear delts · ใช้น้ำหนักเบา คุมจังหวะ",
    muscles: mm("rear-delts", "mid-back"),
  }),
  L("triceps-pushdown", "Triceps pushdown", { sets: 3, lo: 10, hi: 12, muscles: mm("triceps") }),
  L("back-ext", "Back extension", {
    type: "bw",
    sets: 2,
    lo: 12,
    hi: 15,
    ready: "ครบทุก set → ถือแผ่นน้ำหนักเพิ่ม",
    yt: Y("7X075Hrl5lE"),
    muscles: mm("lower-back", "glutes hamstrings"),
  }),
  L("z2-run", "Zone 2 run", { type: "cardio", rx: "20–30 min", note: "HR 120–140" }),
  C("wall-slide", "Wall slide", "2×10"),
  L("push-up", "Push-up", {
    type: "bw",
    sets: 3,
    lo: 8,
    hi: 15,
    cls: "c",
    startReps: [19, 13, 10],
    note: "Set แรกหยุดที่ RIR 1–2 ให้ reps แต่ละ set ใกล้กัน",
    ready: "ครบ 15 ทุก set → feet elevated / ใส่เป้",
    muscles: mm("chest", "triceps front-delts abs"),
  }),
  L("pull-up", "Pull-up", {
    type: "bw",
    sets: 4,
    lo: 4,
    hi: 8,
    cls: "c",
    startReps: [6, 5, 4, 3],
    note: "8 clean reps ทุก set → เริ่มถ่วงน้ำหนัก",
    muscles: mm("lats", "biceps mid-back forearms"),
  }),
  L("incline-db", "Incline DB press", {
    sets: 3,
    lo: 8,
    hi: 10,
    cls: "c",
    startKg: [5],
    muscles: mm("chest", "front-delts triceps"),
  }),
  L("face-pull", "Face pull", {
    sets: 2,
    lo: 12,
    hi: 15,
    startKg: [13],
    muscles: mm("rear-delts", "mid-back traps"),
  }),
  L("hammer-curl", "Hammer curl", {
    sets: 3,
    lo: 10,
    hi: 12,
    startKg: [7],
    muscles: mm("biceps forearms"),
  }),
  L("oh-triceps", "OH triceps extension", {
    sets: 3,
    lo: 10,
    hi: 12,
    startKg: [10],
    muscles: mm("triceps"),
  }),
  L("plank", "Plank", { type: "hold", sets: 3, lo: 30, hi: 45, muscles: mm("abs", "obliques") }),
  C("pogo", "Pogo", "2×15", { yt: Y("NBY9-kTuHEk"), muscles: mm("calves") }),
  C("tall-stance", "Tall stance landing", "2×5", {
    yt: Y("AqoU-Z37I3c"),
    muscles: mm("quads", "glutes"),
  }),
  L("deadlift", "Conventional deadlift", {
    sets: 2,
    lo: 8,
    hi: 10,
    cls: "c",
    startKg: [10],
    muscles: mm("hamstrings glutes lower-back", "traps quads forearms"),
  }),
  L("sl-leg-press", "SL leg press", {
    sets: 3,
    lo: 8,
    hi: 10,
    cls: "c",
    startKg: [10, 15, 15],
    yt: YS("LbKwZIbVYZI"),
    muscles: mm("quads", "glutes"),
  }),
  L("sl-deadlift", "SL deadlift", {
    sets: 3,
    lo: 8,
    hi: 8,
    cls: "c",
    startKg: [24],
    yt: YS("s32cCgmRV3I"),
    muscles: mm("hamstrings glutes", "lower-back"),
  }),
  L("ham-curl", "Hamstring curl", {
    sets: 3,
    lo: 8,
    hi: 12,
    startKg: [30],
    muscles: mm("hamstrings", "calves"),
  }),
  L("calf-raise", "Standing calf raise", { sets: 3, lo: 12, hi: 15, muscles: mm("calves") }),
];
const it = (ex, tag) => ({ ex, tag: tag || "" });
const emptySecs = () => ({ warmup: [], plyo: [], strength: [], core: [], cardio: [] });
function D(name, focus, secs) {
  return { name, focus, rest: false, restNotes: [], sections: Object.assign(emptySecs(), secs) };
}
function R(name, focus, notes) {
  return { name, focus, rest: true, restNotes: notes, sections: emptySecs() };
}
function defaultProgram() {
  return {
    v: 1,
    ex: Object.fromEntries(DEF_EX.map((e) => [e.id, clone(e)])),
    days: {
      mon: D("Upper D1", "Push", {
        warmup: [it("open-book"), it("tspine"), it("sa-face-pull"), it("seated-er")],
        strength: [
          it("chest-press"),
          it("dip"),
          it("ohp"),
          it("lateral-raise", "NEW"),
          it("fly"),
          it("triceps-ext", "+1 set"),
          it("biceps-curl", "+1 set"),
        ],
        core: [it("situps")],
      }),
      tue: D("Lower D1", "Quad / Power", {
        warmup: [it("bike"), it("sl-legext-iso", "2→1 set"), it("iso-lunge", "ย้ายมา warm-up")],
        plyo: [it("sl-pogo"), it("box-jump"), it("depth-drop")],
        strength: [it("back-squat", "ย้ายเป็นท่าแรก"), it("sl-leg-ext"), it("split-squat")],
      }),
      wed: D("Upper D2", "Pull", {
        warmup: [it("ytw"), it("tspine")],
        strength: [
          it("row"),
          it("kelso"),
          it("lat-pulldown"),
          it("straight-arm"),
          it("lateral-raise"),
          it("reverse-fly", "NEW"),
          it("biceps-curl", "+1 set"),
          it("triceps-pushdown", "+1 set"),
          it("back-ext"),
        ],
        cardio: [it("z2-run")],
      }),
      thu: R("Rest", "Recovery", [
        "Light walking",
        "Gentle mobility",
        "Adequate sleep",
        "Calorie surplus",
      ]),
      fri: D("Upper D3", "Mixed", {
        warmup: [it("tspine"), it("wall-slide"), it("seated-er")],
        strength: [
          it("push-up", "เพิ่ม note"),
          it("pull-up"),
          it("incline-db"),
          it("lateral-raise"),
          it("face-pull"),
          it("hammer-curl", "+1 set"),
          it("oh-triceps", "+1 set"),
        ],
        core: [it("plank")],
        cardio: [it("z2-run")],
      }),
      sat: R("Rest", "Full recovery", ["Full recovery", "Optional light walking"]),
      sun: D("Lower D2", "Posterior / Glutes", {
        warmup: [it("bike"), it("sl-legext-iso", "2→1 set"), it("iso-lunge", "ย้ายมา warm-up")],
        plyo: [it("pogo"), it("box-jump"), it("tall-stance")],
        strength: [
          it("deadlift", "ย้ายเป็นท่าแรก"),
          it("sl-leg-press"),
          it("sl-deadlift"),
          it("ham-curl"),
          it("calf-raise"),
        ],
      }),
    },
  };
}
