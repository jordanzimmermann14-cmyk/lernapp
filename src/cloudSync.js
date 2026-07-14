import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const TABLE = "sync_data";
const CODE_KEY = "lernplan-sync-code";

// Zeichen ohne 0/O/1/I/L — Vermeidung von Verwechslungen beim Abtippen auf einem anderen Gerät.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generateCode() {
  let s = "";
  for (let i = 0; i < 8; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}
function normalizeCode(raw) {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== 8) return null;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

// Hält den App-Zustand ohne Login mit Supabase synchron — verknüpft nur über einen
// Sync-Code (wie ein gemeinsames Passwort). Auf jedem Gerät mit demselben Code
// laufen dieselben Daten zusammen. Kein Konto, kein E-Mail-Login nötig.
// state: { loaded, checked, tasks, exams, topics, topicChecked }
// setters: { setChecked, setTasks, setExams, setTopics, setTopicChecked }
export function useCloudSync(state, setters) {
  const { loaded, checked, tasks, exams, topics, topicChecked } = state;
  const { setChecked, setTasks, setExams, setTopics, setTopicChecked } = setters;

  const [code, setCodeState] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | saving | saved | error
  const hydratedCodeRef = useRef(null); // Code, für den bereits hydriert/initialisiert wurde
  const saveTimer = useRef(null);

  // Aktuellen State per Ref, damit der Erst-Upload den frischesten Stand nimmt
  const latest = useRef({ checked, tasks, exams, topics, topicChecked });
  latest.current = { checked, tasks, exams, topics, topicChecked };

  // 1) Sync-Code laden oder automatisch anlegen (kein Nutzerzutun nötig)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let c = localStorage.getItem(CODE_KEY);
    if (!c) {
      c = generateCode();
      localStorage.setItem(CODE_KEY, c);
    }
    setCodeState(c);
  }, []);

  // 2) Bei (neuem) Code: Cloud-Daten laden (hydrieren) oder lokalen Stand hochladen
  useEffect(() => {
    if (!isSupabaseConfigured || !loaded || !code) return;
    if (hydratedCodeRef.current === code) return; // schon erledigt
    hydratedCodeRef.current = code;

    (async () => {
      setSyncStatus("saving");
      const { data, error } = await supabase
        .from(TABLE)
        .select("data")
        .eq("code", code)
        .maybeSingle();
      if (error) { setSyncStatus("error"); return; }

      if (data && data.data && Object.keys(data.data).length > 0) {
        // Cloud gewinnt: App-Zustand aus der Cloud übernehmen
        const d = data.data;
        if (d.checked) setChecked(d.checked);
        if (d.tasks) setTasks(d.tasks);
        if (d.exams) setExams(d.exams);
        if (d.topics) setTopics(d.topics);
        if (d.topicChecked) setTopicChecked(d.topicChecked);
        setSyncStatus("saved");
      } else {
        // Noch keine Cloud-Daten unter diesem Code: aktuellen lokalen Stand hochladen
        const { error: upErr } = await supabase.from(TABLE).upsert({
          code,
          data: latest.current,
          updated_at: new Date().toISOString(),
        });
        setSyncStatus(upErr ? "error" : "saved");
      }
    })();
  }, [code, loaded, setChecked, setTasks, setExams, setTopics, setTopicChecked]);

  // 3) Änderungen entprellt in die Cloud schreiben (sobald hydriert)
  useEffect(() => {
    if (!isSupabaseConfigured || !loaded || !code) return;
    if (hydratedCodeRef.current !== code) return;
    setSyncStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase.from(TABLE).upsert({
        code,
        data: { checked, tasks, exams, topics, topicChecked },
        updated_at: new Date().toISOString(),
      });
      setSyncStatus(error ? "error" : "saved");
    }, 1000);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [checked, tasks, exams, topics, topicChecked, code, loaded]);

  // Auf ein anderes Gerät wechseln / dessen Daten übernehmen: neuen Code eintragen.
  // Löst über den geänderten `code` automatisch eine neue Hydrierung aus (Effekt 2).
  const joinCode = useCallback((raw) => {
    const normalized = normalizeCode(raw);
    if (!normalized) return { error: new Error("Ungültiger Code — bitte 8 Zeichen eingeben.") };
    localStorage.setItem(CODE_KEY, normalized);
    setCodeState(normalized);
    return { error: null };
  }, []);

  return {
    configured: isSupabaseConfigured,
    code,
    syncStatus,
    joinCode,
  };
}
