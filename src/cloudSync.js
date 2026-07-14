import { useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const TABLE = "sync_data";

// Fester, unsichtbarer Schlüssel für den einen Datentopf dieser App — kein Login,
// kein Code, kein Nutzerzutun. Jedes Gerät, das diese Website öffnet, synchronisiert
// sich automatisch mit demselben Stand. Das setzt voraus, dass die App nur von einer
// einzigen Person genutzt wird — der Link sollte daher privat bleiben.
const SYNC_KEY = "jz-lernapp-solo";

// Hält den App-Zustand ganz ohne Login/Code mit Supabase synchron.
// state: { loaded, checked, tasks, exams, topics, topicChecked, customDays }
// setters: { setChecked, setTasks, setExams, setTopics, setTopicChecked, setCustomDays }
export function useCloudSync(state, setters) {
  const { loaded, checked, tasks, exams, topics, topicChecked, customDays } = state;
  const { setChecked, setTasks, setExams, setTopics, setTopicChecked, setCustomDays } = setters;

  const [syncStatus, setSyncStatus] = useState("idle"); // idle | saving | saved | error
  const hydratedRef = useRef(false);
  const saveTimer = useRef(null);

  // Aktuellen State per Ref, damit der Erst-Upload den frischesten Stand nimmt
  const latest = useRef({ checked, tasks, exams, topics, topicChecked, customDays });
  latest.current = { checked, tasks, exams, topics, topicChecked, customDays };

  // 1) Beim Start: Cloud-Daten laden (hydrieren) oder lokalen Stand hochladen
  useEffect(() => {
    if (!isSupabaseConfigured || !loaded || hydratedRef.current) return;
    hydratedRef.current = true;

    (async () => {
      setSyncStatus("saving");
      const { data, error } = await supabase
        .from(TABLE)
        .select("data")
        .eq("code", SYNC_KEY)
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
        if (d.customDays) setCustomDays(d.customDays);
        setSyncStatus("saved");
      } else {
        // Noch keine Cloud-Daten: aktuellen lokalen Stand hochladen
        const { error: upErr } = await supabase.from(TABLE).upsert({
          code: SYNC_KEY,
          data: latest.current,
          updated_at: new Date().toISOString(),
        });
        setSyncStatus(upErr ? "error" : "saved");
      }
    })();
  }, [loaded, setChecked, setTasks, setExams, setTopics, setTopicChecked, setCustomDays]);

  // 2) Änderungen entprellt in die Cloud schreiben (sobald hydriert)
  useEffect(() => {
    if (!isSupabaseConfigured || !loaded || !hydratedRef.current) return;
    setSyncStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase.from(TABLE).upsert({
        code: SYNC_KEY,
        data: { checked, tasks, exams, topics, topicChecked, customDays },
        updated_at: new Date().toISOString(),
      });
      setSyncStatus(error ? "error" : "saved");
    }, 1000);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [checked, tasks, exams, topics, topicChecked, customDays, loaded]);

  return {
    configured: isSupabaseConfigured,
    syncStatus,
  };
}
