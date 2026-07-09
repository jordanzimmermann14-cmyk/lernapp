import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Flame, Rotate3d, Truck, Calculator, TrainFront, Boxes, Code2, MapPin, CalendarDays, Plus, Pencil, Trash2, X, Check, ChevronDown, Cloud, CloudOff, LogOut } from "lucide-react";
import { useCloudSync } from "./cloudSync";

const SUBJECT_META = {
  RW: { label: "RW u. Steuerlehre", color: "#B5442E", icon: Calculator, priority: true },
  TW: { label: "Transportwirtschaft", color: "#2C6E63", icon: Truck, priority: true },
  DY: { label: "Dynamik", color: "#8A4FA0", icon: Rotate3d, priority: true },
  FO: { label: "Förder-/Materialflusstechnik", color: "#4C6B8A", icon: Boxes, priority: false },
  VT: { label: "VT Straße u. Schiene", color: "#B08324", icon: TrainFront, priority: false },
  SW: { label: "SW-Entwicklung", color: "#4A7A3D", icon: Code2, priority: false },
  ORG: { label: "Organisation", color: "#6B6459", icon: Circle, priority: false },
};

// Each day: block1 = 2h task, block2 = two 1h tasks (or fewer on exam days)
const PLAN = [
  { id: "0704", date: "Sa 04.07", phase: "Vorbereitung", exam: null,
    b1: { s: "ORG", t: "Material sortieren, Skripte/Altklausuren bereitlegen" }, b2: [] },
  { id: "0705", date: "So 05.07", phase: "Woche 1", exam: null,
    b1: { s: "RW", t: "Grundlagen" }, b2: [{ s: "TW", t: "Grundlagen" }, { s: "FO", t: "Überblick / Altklausur sichten" }] },
  { id: "0706", date: "Mo 06.07", phase: "Woche 1", exam: null,
    b1: { s: "RW", t: "Thema 1" }, b2: [{ s: "TW", t: "Thema 1" }, { s: "DY", t: "Kurze Auffrischung" }] },
  { id: "0707", date: "Di 07.07", phase: "Woche 1", exam: null,
    b1: { s: "RW", t: "Thema 2" }, b2: [{ s: "TW", t: "Thema 2" }, { s: "FO", t: "Thema 1" }] },
  { id: "0708", date: "Mi 08.07", phase: "Woche 1", exam: null,
    b1: { s: "RW", t: "Thema 3" }, b2: [{ s: "TW", t: "Thema 3" }, { s: "DY", t: "Kurze Auffrischung" }] },
  { id: "0709", date: "Do 09.07", phase: "Woche 1", exam: null,
    b1: { s: "RW", t: "Altklausur 1" }, b2: [{ s: "TW", t: "Thema 4" }, { s: "FO", t: "Thema 2" }] },
  { id: "0710", date: "Fr 10.07", phase: "Woche 1", exam: null,
    b1: { s: "TW", t: "Altklausur 1" }, b2: [{ s: "RW", t: "Thema 4" }, { s: "DY", t: "Kurze Auffrischung" }] },
  { id: "0711", date: "Sa 11.07", phase: "Woche 2", exam: null,
    b1: { s: "RW", t: "Wiederholung Schwachstellen" }, b2: [{ s: "TW", t: "Thema 5" }, { s: "FO", t: "Thema 3" }] },
  { id: "0712", date: "So 12.07", phase: "Woche 2", exam: null,
    b1: { s: "TW", t: "Thema 6" }, b2: [{ s: "RW", t: "Altklausur 2" }, { s: "DY", t: "Kurze Auffrischung" }] },
  { id: "0713", date: "Mo 13.07", phase: "Woche 2", exam: null,
    b1: { s: "RW", t: "Thema 5" }, b2: [{ s: "TW", t: "Altklausur 2" }, { s: "FO", t: "Altklausur 1" }] },
  { id: "0714", date: "Di 14.07", phase: "Woche 2", exam: null,
    b1: { s: "RW", t: "Altklausur 3" }, b2: [{ s: "TW", t: "Thema 7" }, { s: "DY", t: "Kurze Auffrischung" }] },
  { id: "0715", date: "Mi 15.07", phase: "Woche 2", exam: null,
    b1: { s: "TW", t: "Wiederholung" }, b2: [{ s: "RW", t: "Wiederholung" }, { s: "FO", t: "Thema 4" }] },
  { id: "0716", date: "Do 16.07", phase: "Woche 2", exam: null,
    b1: { s: "RW", t: "Altklausur 4" }, b2: [{ s: "TW", t: "Altklausur 3" }, { s: "DY", t: "Kurze Auffrischung" }] },
  { id: "0717", date: "Fr 17.07", phase: "Woche 2", exam: null,
    b1: { s: "TW", t: "Zusammenfassung" }, b2: [{ s: "RW", t: "Zusammenfassung / Spickzettel" }, { s: "FO", t: "Altklausur 2" }] },
  { id: "0718", date: "Sa 18.07", phase: "Vor Klausurwoche 1", exam: null,
    b1: { s: "RW", t: "Finale Wiederholung" }, b2: [{ s: "FO", t: "Finale Wiederholung" }, { s: "TW", t: "Leichte Wiederholung" }] },
  { id: "0719", date: "So 19.07", phase: "Vor Klausurwoche 1", exam: null,
    b1: { s: "RW", t: "Letzte Altklausur — Klausur morgen!" }, b2: [{ s: "FO", t: "Wiederholung" }, { s: "TW", t: "Wiederholung" }] },
  { id: "0720", date: "Mo 20.07", phase: "Klausurwoche 1", exam: { s: "RW", time: "10:30 Uhr", room: "A-08 · 8.1.01" },
    b1: null, b2: [{ s: "FO", t: "Finale Wiederholung (nachmittags)" }, { s: "TW", t: "Wiederholung" }] },
  { id: "0721", date: "Di 21.07", phase: "Klausurwoche 1", exam: { s: "FO", time: "08:00 Uhr", room: "A-03 · 3.E.07" },
    b1: null, b2: [{ s: "TW", t: "Finale Wiederholung" }, { s: "TW", t: "Altklausur" }] },
  { id: "0722", date: "Mi 22.07", phase: "Klausurwoche 1", exam: null,
    b1: { s: "TW", t: "Letzte Altklausur — Klausur morgen!" }, b2: [{ s: "TW", t: "Finale Wiederholung" }, { s: "VT", t: "Überblick" }] },
  { id: "0723", date: "Do 23.07", phase: "Klausurwoche 1", exam: { s: "TW", time: "10:30 Uhr", room: "A-08 · 8.1.01" },
    b1: null, b2: [{ s: "VT", t: "Start Thema 1" }, { s: "SW", t: "Überblick" }] },
  { id: "0724", date: "Fr 24.07", phase: "Vor Klausurwoche 2", exam: null,
    b1: { s: "VT", t: "Thema 2" }, b2: [{ s: "SW", t: "Thema 1" }, { s: "DY", t: "Kurze Auffrischung" }] },
  { id: "0725", date: "Sa 25.07", phase: "Vor Klausurwoche 2", exam: null,
    b1: { s: "SW", t: "Thema 2" }, b2: [{ s: "VT", t: "Thema 3" }, { s: "DY", t: "Kurze Auffrischung" }] },
  { id: "0726", date: "So 26.07", phase: "Vor Klausurwoche 2", exam: null,
    b1: { s: "VT", t: "Altklausur + Wiederholung — Klausur morgen!" }, b2: [{ s: "SW", t: "Thema 3" }, { s: "DY", t: "Kurze Auffrischung" }] },
  { id: "0727", date: "Mo 27.07", phase: "Klausurwoche 2", exam: { s: "VT", time: "13:00 Uhr", room: "A-07 · 7.2.15" },
    b1: null, b2: [{ s: "SW", t: "Thema 4 (nachmittags)" }, { s: "SW", t: "Altklausur 1" }] },
  { id: "0728", date: "Di 28.07", phase: "Klausurwoche 2", exam: null,
    b1: { s: "SW", t: "Letzte Altklausur — Klausur morgen!" }, b2: [{ s: "SW", t: "Wiederholung" }, { s: "DY", t: "Letzter Check vor Intensivstart" }] },
  { id: "0729", date: "Mi 29.07", phase: "Klausurwoche 2", exam: { s: "SW", time: "13:00 Uhr", room: "A-06 · 6.1.36" },
    b1: null, b2: [{ s: "DY", t: "Intensivstart — Grundlagen" }, { s: "DY", t: "Altklausur sichten" }] },
  { id: "0730", date: "Do 30.07", phase: "Dynamik-Intensiv", exam: null,
    b1: { s: "DY", t: "Thema 1 + 2" }, b2: [{ s: "DY", t: "Altklausur 1" }, { s: "DY", t: "Nachbereitung Fehler" }] },
  { id: "0731", date: "Fr 31.07", phase: "Dynamik-Intensiv", exam: null,
    b1: { s: "DY", t: "Thema 3 + 4" }, b2: [{ s: "DY", t: "Altklausur 2" }, { s: "DY", t: "Nachbereitung Fehler" }] },
  { id: "0801", date: "Sa 01.08", phase: "Dynamik-Intensiv", exam: null,
    b1: { s: "DY", t: "Thema 5 + 6" }, b2: [{ s: "DY", t: "Altklausur 3" }, { s: "DY", t: "Nachbereitung Fehler" }] },
  { id: "0802", date: "So 02.08", phase: "Dynamik-Intensiv", exam: null,
    b1: { s: "DY", t: "Finale Wiederholung — Klausur morgen!" }, b2: [{ s: "DY", t: "Letzte Altklausur" }, { s: "DY", t: "Zusammenfassung / Spickzettel" }] },
  { id: "0803", date: "Mo 03.08", phase: "Dynamik-Intensiv", exam: { s: "DY", time: "10:30 Uhr", room: "A-09 · 9.3.03" },
    b1: null, b2: [] },
];

function flattenTasks() {
  const tasks = [];
  PLAN.forEach((day) => {
    if (day.b1) tasks.push({ id: `${day.id}-b1`, dayId: day.id, subject: day.b1.s, text: day.b1.t, block: 1, durationMin: 120 });
    day.b2.forEach((t, i) => tasks.push({ id: `${day.id}-b2-${i}`, dayId: day.id, subject: t.s, text: t.t, block: 2, durationMin: 60 }));
  });
  return tasks;
}

// Dauer eines Moduls in Minuten (Fallback für ältere gespeicherte Module ohne durationMin)
function taskDuration(t) {
  return t.durationMin != null ? t.durationMin : (t.block === 1 ? 120 : 60);
}

const ALL_TASKS = flattenTasks();
const EXAM_DAYS = PLAN.filter((d) => d.exam).map((d) => ({ dayId: d.id, date: d.date, ...d.exam }));
const SEED_EXAMS = EXAM_DAYS.map((ex) => ({ id: `exam-${ex.dayId}`, dayId: ex.dayId, subject: ex.s, time: ex.time, room: ex.room || "" }));
const DAY_INDEX = Object.fromEntries(PLAN.map((d, i) => [d.id, i]));
const DAY_DATE = Object.fromEntries(PLAN.map((d) => [d.id, d.date]));
const shortDate = (dayId) => (DAY_DATE[dayId] || "").replace(/^\S+\s/, "");

const PLAN_YEAR = 2026;
const DAY_DATEOBJ = Object.fromEntries(PLAN.map((d) => {
  const m = d.date.match(/(\d{2})\.(\d{2})/);
  return [d.id, m ? new Date(PLAN_YEAR, parseInt(m[2], 10) - 1, parseInt(m[1], 10)) : null];
}));
const startOfToday = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const STORAGE_KEY = "lernplan-checked-tasks";
const CUSTOM_KEY = "lernplan-custom-tasks";
const TASKS_KEY = "lernplan-tasks";
const EXAMS_KEY = "lernplan-exams";

// Minuten hübsch als "2h", "1h 30m" oder "45m"
function formatMinutes(min) {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0 && r > 0) return `${h}h ${r}m`;
  if (h > 0) return `${h}h`;
  return `${r}m`;
}

// Lineare Interpolation zweier Hex-Farben (t: 0..1)
function lerpColor(a, b, t) {
  const pa = a.replace("#", "").match(/.{2}/g).map((x) => parseInt(x, 16));
  const pb = b.replace("#", "").match(/.{2}/g).map((x) => parseInt(x, 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export default function LernfortschrittTracker() {
  const [checked, setChecked] = useState({});
  const [tasks, setTasks] = useState(ALL_TASKS);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("ALLE");
  const [openForm, setOpenForm] = useState(null); // { dayId, task } — task null = neu
  const [exams, setExams] = useState(SEED_EXAMS);
  const [openExamForm, setOpenExamForm] = useState(null); // { exam } — exam null = neu
  const [openExamDetail, setOpenExamDetail] = useState(null); // exam-id der aufgeklappten Inhalts-Übersicht

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChecked(JSON.parse(saved));

      const savedTasks = localStorage.getItem(TASKS_KEY);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        // Erstmigration: Basis-Plan + evtl. früher hinzugefügte eigene Module
        const legacyCustom = JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]");
        setTasks([...ALL_TASKS, ...legacyCustom]);
      }

      const savedExams = localStorage.getItem(EXAMS_KEY);
      if (savedExams) setExams(JSON.parse(savedExams));
    } catch (e) {
      // no saved progress yet
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(checked)); } catch (e) { /* storage unavailable */ }
  }, [checked, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch (e) { /* storage unavailable */ }
  }, [tasks, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(EXAMS_KEY, JSON.stringify(exams)); } catch (e) { /* storage unavailable */ }
  }, [exams, loaded]);

  const saveExam = (existingId, data) => {
    setExams((prev) => existingId
      ? prev.map((e) => (e.id === existingId ? { ...e, ...data } : e))
      : [...prev, { id: `exam-custom-${Date.now()}`, ...data }]);
    setOpenExamForm(null);
  };
  const deleteExam = (id) => setExams((prev) => prev.filter((e) => e.id !== id));
  const examForDay = (dayId) => exams.find((e) => e.dayId === dayId);
  const sortedExams = [...exams].sort((a, b) => (DAY_INDEX[a.dayId] ?? 999) - (DAY_INDEX[b.dayId] ?? 999));

  // Geräteübergreifende Synchronisierung (Supabase, E-Mail Magic-Link)
  const cloud = useCloudSync({ loaded, checked, tasks, exams }, { setChecked, setTasks, setExams });

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));

  const saveTask = (dayId, existingId, data) => {
    setTasks((prev) => {
      if (existingId) {
        return prev.map((t) => (t.id === existingId ? { ...t, ...data } : t));
      }
      const id = `custom-${dayId}-${Date.now()}`;
      return [...prev, { id, dayId, custom: true, ...data }];
    });
    setOpenForm(null);
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setChecked((c) => {
      const { [id]: _, ...rest } = c;
      return rest;
    });
  };

  const setExamContent = (id, content) =>
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, content } : e)));

  const tasksForDay = (dayId) =>
    tasks.filter((t) => t.dayId === dayId).sort((a, b) => a.block - b.block);

  const totalDone = tasks.filter((t) => checked[t.id]).length;
  const pct = tasks.length ? Math.round((totalDone / tasks.length) * 100) : 0;

  const subjectStats = useMemo(() => {
    const stats = {};
    Object.keys(SUBJECT_META).forEach((s) => (stats[s] = { done: 0, total: 0 }));
    tasks.forEach((t) => {
      if (!stats[t.subject]) return;
      stats[t.subject].total += 1;
      if (checked[t.id]) stats[t.subject].done += 1;
    });
    return stats;
  }, [checked, tasks]);

  // Streak: aufeinanderfolgende Tage (bis heute) mit ALLEN Aufgaben abgehakt.
  // Ein unvollständiger vergangener Tag friert die Streak ein; der heutige Tag
  // gilt als "in Arbeit" und friert nicht ein, solange er noch nicht komplett ist.
  const streakInfo = useMemo(() => {
    const today0 = startOfToday();
    const dayList = PLAN.filter((d) => tasks.some((t) => t.dayId === d.id));
    const complete = dayList.map((d) => {
      const dts = tasks.filter((t) => t.dayId === d.id);
      return dts.length > 0 && dts.every((t) => checked[t.id]);
    });
    const dueTime = (i) => (DAY_DATEOBJ[dayList[i].id] ? DAY_DATEOBJ[dayList[i].id].getTime() : Infinity);

    // letzter fälliger Tag (Datum <= heute)
    let lastDueIdx = -1;
    for (let i = 0; i < dayList.length; i++) { if (dueTime(i) <= today0.getTime()) lastDueIdx = i; }
    if (lastDueIdx === -1) return { streak: 0, state: "idle" };

    // Ist der letzte fällige Tag heute und noch nicht komplett? Dann "in Arbeit" -> Anker = Vortag
    const lastIsToday = dueTime(lastDueIdx) === today0.getTime();
    let anchorIdx = (lastIsToday && !complete[lastDueIdx]) ? lastDueIdx - 1 : lastDueIdx;
    if (anchorIdx < 0) return { streak: 0, state: "idle" };

    const anchorComplete = complete[anchorIdx];
    const start = anchorComplete ? anchorIdx : anchorIdx - 1;
    let streak = 0;
    for (let i = start; i >= 0 && complete[i]; i--) streak++;
    const state = anchorComplete ? "warm" : streak > 0 ? "frozen" : "idle";
    return { streak, state };
  }, [checked, tasks]);

  const visibleDays = PLAN.filter((d) => filter === "ALLE" || examForDay(d.id)?.subject === filter ||
    tasksForDay(d.id).some((t) => t.subject === filter));

  return (
    <div style={{ fontFamily: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif", background: "#EDF1EA", minHeight: "100vh", color: "#1B1B18" }}>
      <style>{`
        @media (max-width: 480px) {
          .lp-outer { padding: 18px 12px 40px !important; }
          .lp-header-card { padding: 12px 12px !important; }
          .lp-h1 { font-size: 24px !important; }
          .exam-row-main { flex-wrap: wrap !important; row-gap: 3px !important; }
          .exam-meta { flex-basis: 100% !important; margin-left: 38px !important; margin-top: 1px !important; }
          .progress-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
      <div className="lp-outer" style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 60px" }}>
        <header style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B6459", fontFamily: "ui-sans-serif, system-ui" }}>
            Klausurenphase · Juli–August 2026
          </div>
          <h1 className="lp-h1" style={{ fontSize: 30, margin: "4px 0 14px", fontWeight: 600 }}>Lernfortschritt</h1>

          <AuthBar cloud={cloud} />

          <div className="lp-header-card" style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 2px rgba(27,27,24,0.08)", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#6B6459", fontFamily: "ui-sans-serif, system-ui", marginBottom: 12 }}>
              <CalendarDays size={15} /> <span style={{ fontWeight: 600, letterSpacing: "0.02em" }}>Klausuren-Übersicht</span>
              <button onClick={() => setOpenExamForm({ exam: null })} title="Klausur hinzufügen"
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#2C6E63", background: "none", border: "1px solid #2C6E6355", borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontFamily: "ui-sans-serif, system-ui" }}>
                <Plus size={13} /> Klausur
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, fontFamily: "ui-sans-serif, system-ui" }}>
              {sortedExams.map((ex) => {
                const meta = SUBJECT_META[ex.subject];
                if (!meta) return null;
                const Icon = meta.icon;
                const isOpen = openExamDetail === ex.id;
                const toggleDetail = () => setOpenExamDetail(isOpen ? null : ex.id);
                return (
                  <div key={ex.id}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 6px 6px 10px", borderRadius: 8,
                      background: `${meta.color}0D`, borderLeft: `3px solid ${meta.color}`
                    }}>
                      <div className="exam-row-main" onClick={toggleDetail} title="Inhalt anzeigen" style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, cursor: "pointer" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#3A382F", minWidth: 46, flexShrink: 0 }}>{shortDate(ex.dayId)}</span>
                        <Icon size={14} color={meta.color} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: meta.color, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.label}</span>
                        {ex.content && <span title="Inhalt hinterlegt" style={{ width: 6, height: 6, borderRadius: 999, background: meta.color, display: "inline-block", flexShrink: 0 }} />}
                        <span className="exam-meta" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          {ex.time && <span style={{ fontSize: 12, color: "#3A382F", whiteSpace: "nowrap" }}>{ex.time}</span>}
                          {ex.room && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, color: "#6B6459", whiteSpace: "nowrap" }}>
                              <MapPin size={12} /> {ex.room}
                            </span>
                          )}
                        </span>
                      </div>
                      <button onClick={toggleDetail} title="Inhalt anzeigen" style={iconBtnSm}>
                        <ChevronDown size={15} color="#948C7C" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                      </button>
                      <button onClick={() => setOpenExamForm({ exam: ex })} title="Bearbeiten" style={iconBtnSm}><Pencil size={13} color="#6B6459" /></button>
                      <button onClick={() => deleteExam(ex.id)} title="Löschen" style={iconBtnSm}><Trash2 size={13} color="#B5442E" /></button>
                    </div>

                    {isOpen && (
                      <div style={{ margin: "2px 0 6px 10px", padding: "10px 12px", borderRadius: 8, background: "#FAFAF6", border: "1px solid #EDEBE3" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 14px", fontSize: 12, color: "#6B6459", marginBottom: 9 }}>
                          <span><b style={{ color: "#3A382F", fontWeight: 600 }}>Fach:</b> {meta.label}</span>
                          <span><b style={{ color: "#3A382F", fontWeight: 600 }}>Tag:</b> {DAY_DATE[ex.dayId] || "—"}</span>
                          <span><b style={{ color: "#3A382F", fontWeight: 600 }}>Uhrzeit:</b> {ex.time || "—"}</span>
                          <span><b style={{ color: "#3A382F", fontWeight: 600 }}>Raum:</b> {ex.room || "—"}</span>
                        </div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#6B6459", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5 }}>Inhalt</div>
                        <textarea
                          value={ex.content || ""}
                          onChange={(e) => setExamContent(ex.id, e.target.value)}
                          placeholder="Inhalt der Klausur: Themen, Kapitel, Formeln, Altklausur-Fragen …"
                          rows={4}
                          style={{ width: "100%", boxSizing: "border-box", fontSize: 13, lineHeight: 1.5, padding: "8px 10px", borderRadius: 8, border: "1px solid #D5D0C3", fontFamily: "ui-sans-serif, system-ui", outline: "none", resize: "vertical", color: "#2A2A25" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {sortedExams.length === 0 && (
                <div style={{ fontSize: 12.5, color: "#948C7C", padding: "4px 2px" }}>Noch keine Klausuren eingetragen.</div>
              )}
            </div>
            {openExamForm && (
              <ExamForm
                initial={openExamForm.exam}
                onCancel={() => setOpenExamForm(null)}
                onSave={(data) => saveExam(openExamForm.exam ? openExamForm.exam.id : null, data)}
              />
            )}
          </div>

          <div className="lp-header-card" style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 2px rgba(27,27,24,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: "ui-sans-serif, system-ui" }}>
              <span style={{ fontSize: 13, color: "#6B6459" }}>Gesamtfortschritt</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{totalDone} / {tasks.length} Module ({pct}%)</span>
            </div>
            <div style={{ height: 8, background: "#EDEBE3", borderRadius: 999, marginTop: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#2C6E63", transition: "width 0.3s" }} />
            </div>

            <div className="progress-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 16 }}>
              {Object.entries(SUBJECT_META).filter(([k, v]) => v.priority || subjectStats[k].total > 0).map(([key, meta]) => {
                const s = subjectStats[key];
                if (s.total === 0) return null;
                const Icon = meta.icon;
                const spct = Math.round((s.done / s.total) * 100);
                return (
                  <button key={key} onClick={() => setFilter(filter === key ? "ALLE" : key)}
                    style={{
                      display: "flex", flexDirection: "column", gap: 6, padding: "10px 10px", borderRadius: 10,
                      border: filter === key ? `1.5px solid ${meta.color}` : "1px solid #E4E1D6",
                      background: filter === key ? `${meta.color}14` : "#FAFAF6", cursor: "pointer", textAlign: "left",
                      fontFamily: "ui-sans-serif, system-ui"
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: meta.color }}>
                      <Icon size={14} /> {meta.priority && <Flame size={11} />}
                    </div>
                    <div style={{ fontSize: 12, color: "#3A382F", lineHeight: 1.2 }}>{meta.label}</div>
                    <div style={{ fontSize: 11, color: "#6B6459" }}>{s.done}/{s.total} · {spct}%</div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, minHeight: 20 }}>
              <div>
                {filter !== "ALLE" && (
                  <button onClick={() => setFilter("ALLE")} style={{ fontSize: 12, color: "#6B6459", background: "none", border: "none", cursor: "pointer", fontFamily: "ui-sans-serif, system-ui", textDecoration: "underline", padding: 0 }}>
                    Filter zurücksetzen
                  </button>
                )}
              </div>
              {(() => {
                const { streak, state } = streakInfo;
                const w = Math.min(streak, 7) / 7;
                const flameColor = state === "warm" ? lerpColor("#E39A4E", "#DA3B1C", w) : state === "frozen" ? "#7FB4D6" : "#CDC8BC";
                const numColor = state === "warm" ? flameColor : state === "frozen" ? "#5E93B8" : "#B7B2A3";
                const glow = state === "warm" ? `drop-shadow(0 0 ${2 + w * 6}px ${flameColor})` : state === "frozen" ? "drop-shadow(0 0 2px #C4E0F0)" : "none";
                const title = state === "warm"
                  ? `🔥 ${streak} ${streak === 1 ? "Tag" : "Tage"} in Folge alle Aufgaben abgehakt`
                  : state === "frozen"
                    ? `Streak eingefroren – zuletzt nicht alle Aufgaben eines Tages abgehakt (vorher ${streak} ${streak === 1 ? "Tag" : "Tage"})`
                    : "Noch keine Streak – hak alle Aufgaben eines Tages ab";
                return (
                  <div title={title} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "ui-sans-serif, system-ui", opacity: state === "idle" ? 0.65 : 1 }}>
                    <Flame size={16} color={flameColor} style={{ filter: glow, transition: "filter 0.3s" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: numColor, fontVariantNumeric: "tabular-nums" }}>{streak}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visibleDays.map((day) => {
            const exam = examForDay(day.id);
            const examMeta = exam ? SUBJECT_META[exam.subject] : null;
            return (
              <div key={day.id} style={{
                background: "#fff", borderRadius: 12, padding: "14px 16px",
                borderLeft: examMeta ? `4px solid ${examMeta.color}` : "4px solid transparent",
                boxShadow: "0 1px 2px rgba(27,27,24,0.06)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{day.date}</span>
                  <span style={{ fontSize: 11, color: "#948C7C", fontFamily: "ui-sans-serif, system-ui" }}>{day.phase}</span>
                </div>

                {exam && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, background: `${examMeta.color}14`,
                    color: examMeta.color, borderRadius: 8, padding: "8px 10px", marginBottom: 8,
                    fontFamily: "ui-sans-serif, system-ui", fontSize: 13, fontWeight: 600
                  }}>
                    <Flame size={14} /> Klausur {examMeta.label}{exam.time ? ` · ${exam.time}` : ""}
                    {exam.room && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: "auto", fontWeight: 500 }}>
                        <MapPin size={13} /> {exam.room}
                      </span>
                    )}
                  </div>
                )}

                {tasksForDay(day.id).map((t) => (
                  <TaskRow key={t.id} task={t} checked={checked} toggle={toggle}
                    onEdit={() => setOpenForm({ dayId: day.id, task: t })}
                    onDelete={() => deleteTask(t.id)} />
                ))}
                {tasksForDay(day.id).length === 0 && !exam && (
                  <div style={{ fontSize: 13, color: "#948C7C", fontFamily: "ui-sans-serif, system-ui" }}>Kein Modul geplant</div>
                )}

                {openForm && openForm.dayId === day.id ? (
                  <TaskForm
                    initial={openForm.task}
                    onCancel={() => setOpenForm(null)}
                    onSave={(data) => saveTask(day.id, openForm.task ? openForm.task.id : null, data)}
                  />
                ) : (
                  <button onClick={() => setOpenForm({ dayId: day.id, task: null })}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, marginTop: 6, padding: "6px 8px",
                      fontSize: 12.5, color: "#6B6459", background: "none", border: "1px dashed #D5D0C3",
                      borderRadius: 8, cursor: "pointer", fontFamily: "ui-sans-serif, system-ui", width: "100%"
                    }}>
                    <Plus size={14} /> Modul hinzufügen
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: "#948C7C", fontFamily: "ui-sans-serif, system-ui", textAlign: "center" }}>
          Dein Fortschritt wird automatisch gespeichert und bleibt erhalten, wenn du zurückkommst.
        </p>
      </div>
    </div>
  );
}

function TaskRow({ task, checked, toggle, onEdit, onDelete }) {
  if (!task) return null;
  const meta = SUBJECT_META[task.subject];
  const Icon = meta.icon;
  const isChecked = !!checked[task.id];
  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 6px", borderRadius: 8,
        fontFamily: "ui-sans-serif, system-ui"
      }}
    >
      <div onClick={() => toggle(task.id)} style={{ cursor: "pointer", display: "flex", flexShrink: 0, marginTop: 1 }}>
        {isChecked ? <CheckCircle2 size={19} color={meta.color} /> : <Circle size={19} color="#D5D0C3" />}
      </div>
      <div style={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={() => toggle(task.id)}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Icon size={13} color={meta.color} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: meta.color }}>{meta.label}</span>
          <span style={{ fontSize: 10.5, color: "#B7B2A3" }}>· Block {task.block} · {formatMinutes(taskDuration(task))}</span>
          {task.custom && <span style={{ fontSize: 9.5, color: "#948C7C", background: "#EDEBE3", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.03em" }}>EIGENES</span>}
        </div>
        <div style={{ fontSize: 13.5, color: isChecked ? "#B7B2A3" : "#2A2A25", textDecoration: isChecked ? "line-through" : "none", marginTop: 2 }}>
          {task.text}
        </div>
      </div>
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        <button onClick={onEdit} title="Bearbeiten" style={iconBtn}><Pencil size={14} color="#6B6459" /></button>
        <button onClick={onDelete} title="Löschen" style={iconBtn}><Trash2 size={14} color="#B5442E" /></button>
      </div>
    </div>
  );
}

const iconBtn = {
  display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28,
  background: "none", border: "none", borderRadius: 6, cursor: "pointer", padding: 0
};

const iconBtnSm = {
  display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, flexShrink: 0,
  background: "none", border: "none", borderRadius: 6, cursor: "pointer", padding: 0
};

function TaskForm({ initial, onSave, onCancel }) {
  const [subject, setSubject] = useState(initial?.subject || "RW");
  const [text, setText] = useState(initial?.text || "");
  const [block, setBlock] = useState(initial?.block || 2);
  const [durationStr, setDurationStr] = useState(String(initial ? taskDuration(initial) / 60 : 1));

  const parsedMin = () => {
    const h = parseFloat(durationStr.replace(",", "."));
    return isFinite(h) && h > 0 ? Math.round(h * 60) : (block === 1 ? 120 : 60);
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSave({ subject, text: trimmed, block, durationMin: parsedMin() });
  };

  return (
    <div style={{
      marginTop: 8, padding: 12, borderRadius: 10, background: "#FAFAF6", border: "1px solid #E4E1D6",
      display: "flex", flexDirection: "column", gap: 8, fontFamily: "ui-sans-serif, system-ui"
    }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} style={selectStyle}>
          {Object.entries(SUBJECT_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        <select value={block} onChange={(e) => setBlock(Number(e.target.value))} style={selectStyle}>
          <option value={1}>Block 1</option>
          <option value={2}>Block 2</option>
        </select>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#6B6459" }}>
        Dauer:
        <input
          type="number" min="0.25" step="0.25" value={durationStr}
          onChange={(e) => setDurationStr(e.target.value)}
          style={{ width: 80, fontSize: 13, padding: "7px 9px", borderRadius: 8, border: "1px solid #D5D0C3", fontFamily: "ui-sans-serif, system-ui", outline: "none" }}
        />
        Stunden <span style={{ color: "#B7B2A3" }}>(= {formatMinutes(parsedMin())})</span>
      </label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
        placeholder="Was möchtest du lernen? (z.B. Thema 1)"
        autoFocus
        style={{ fontSize: 13.5, padding: "8px 10px", borderRadius: 8, border: "1px solid #D5D0C3", fontFamily: "ui-sans-serif, system-ui", outline: "none" }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#6B6459", background: "none", border: "1px solid #D5D0C3", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "ui-sans-serif, system-ui" }}>
          <X size={14} /> Abbrechen
        </button>
        <button onClick={submit} disabled={!text.trim()} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#fff", background: text.trim() ? "#2C6E63" : "#A9B8B2", border: "none", borderRadius: 8, padding: "6px 12px", cursor: text.trim() ? "pointer" : "default", fontFamily: "ui-sans-serif, system-ui", fontWeight: 600 }}>
          <Check size={14} /> {initial ? "Speichern" : "Hinzufügen"}
        </button>
      </div>
    </div>
  );
}

const selectStyle = {
  fontSize: 12.5, padding: "7px 9px", borderRadius: 8, border: "1px solid #D5D0C3",
  background: "#fff", fontFamily: "ui-sans-serif, system-ui", cursor: "pointer", flex: 1, minWidth: 130
};

const inputStyle = {
  fontSize: 13, padding: "8px 10px", borderRadius: 8, border: "1px solid #D5D0C3",
  fontFamily: "ui-sans-serif, system-ui", outline: "none", flex: 1, minWidth: 130
};

function ExamForm({ initial, onSave, onCancel }) {
  const [subject, setSubject] = useState(initial?.subject || "RW");
  const [dayId, setDayId] = useState(initial?.dayId || PLAN[0].id);
  const [time, setTime] = useState(initial?.time || "");
  const [room, setRoom] = useState(initial?.room || "");

  const submit = () => onSave({ subject, dayId, time: time.trim(), room: room.trim() });

  return (
    <div style={{
      marginTop: 12, padding: 12, borderRadius: 10, background: "#FAFAF6", border: "1px solid #E4E1D6",
      display: "flex", flexDirection: "column", gap: 8, fontFamily: "ui-sans-serif, system-ui"
    }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} style={selectStyle}>
          {Object.entries(SUBJECT_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        <select value={dayId} onChange={(e) => setDayId(e.target.value)} style={selectStyle}>
          {PLAN.map((d) => (
            <option key={d.id} value={d.id}>{d.date}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="Uhrzeit (z.B. 10:30 Uhr)" style={inputStyle} />
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Raum (z.B. A-08 · 8.1.01)" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#6B6459", background: "none", border: "1px solid #D5D0C3", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "ui-sans-serif, system-ui" }}>
          <X size={14} /> Abbrechen
        </button>
        <button onClick={submit} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#fff", background: "#2C6E63", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "ui-sans-serif, system-ui", fontWeight: 600 }}>
          <Check size={14} /> {initial ? "Speichern" : "Hinzufügen"}
        </button>
      </div>
    </div>
  );
}

const linkBtn = {
  fontSize: 12, color: "#2C6E63", fontWeight: 600, background: "none", border: "none",
  cursor: "pointer", fontFamily: "ui-sans-serif, system-ui", textDecoration: "underline", padding: 0
};

function AuthBar({ cloud }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  // Solange Sync nicht konfiguriert ist, bleibt die Leiste unsichtbar (App läuft lokal).
  if (!cloud.configured) return null;

  const wrap = { marginBottom: 14, fontFamily: "ui-sans-serif, system-ui" };

  if (cloud.session) {
    const syncing = cloud.syncStatus === "saving";
    const error = cloud.syncStatus === "error";
    const color = error ? "#B5442E" : "#2C6E63";
    return (
      <div style={{ ...wrap, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6B6459" }}>
        {error ? <CloudOff size={14} color={color} /> : <Cloud size={14} color={color} />}
        <span style={{ color, fontWeight: 600 }}>{error ? "Sync-Fehler" : syncing ? "synchronisiert…" : "synchronisiert"}</span>
        <span style={{ color: "#948C7C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {cloud.email}</span>
        <button onClick={cloud.signOut} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6B6459", background: "none", border: "1px solid #D5D0C3", borderRadius: 7, padding: "3px 9px", cursor: "pointer", fontFamily: "ui-sans-serif, system-ui" }}>
          <LogOut size={13} /> Abmelden
        </button>
      </div>
    );
  }

  const submit = async () => {
    const v = email.trim();
    if (!v) return;
    setErr("");
    const { error } = await cloud.signIn(v);
    if (error) setErr(error.message || "Fehler beim Senden des Links.");
    else setSent(true);
  };

  return (
    <div style={wrap}>
      {!open ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6B6459" }}>
          <CloudOff size={14} color="#948C7C" />
          <span>Daten nur auf diesem Gerät</span>
          <button onClick={() => setOpen(true)} style={{ marginLeft: "auto", ...linkBtn }}>Anmelden zum Synchronisieren</button>
        </div>
      ) : sent ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#2C6E63" }}>
          <Check size={14} /> Link gesendet – öffne die E-Mail auf diesem Gerät und klicke den Anmelde-Link.
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
            type="email" placeholder="deine@email.de" autoFocus
            style={{ flex: 1, minWidth: 180, fontSize: 13, padding: "7px 10px", borderRadius: 8, border: "1px solid #D5D0C3", fontFamily: "ui-sans-serif, system-ui", outline: "none" }} />
          <button onClick={submit} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#2C6E63", border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontFamily: "ui-sans-serif, system-ui" }}>
            Link senden
          </button>
          <button onClick={() => setOpen(false)} style={linkBtn}>Abbrechen</button>
          {err && <div style={{ width: "100%", fontSize: 11.5, color: "#B5442E" }}>{err}</div>}
        </div>
      )}
    </div>
  );
}
