import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const TABLE = "progress";

// Feste Ziel-URL für den Magic-Link-Rücksprung. Ohne VITE_SITE_URL (z.B. lokal in der
// Entwicklung) wird die aktuelle Origin verwendet. In Produktion sollte VITE_SITE_URL
// immer auf die stabile Domain zeigen — sonst würde ein Login von einer alten,
// eingefrorenen Vercel-Deployment-URL aus dorthin zurückführen.
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

// Hält den App-Zustand mit Supabase synchron, sobald man eingeloggt ist.
// state: { loaded, checked, tasks, exams, topics, topicChecked }
// setters: { setChecked, setTasks, setExams, setTopics, setTopicChecked }
export function useCloudSync(state, setters) {
  const { loaded, checked, tasks, exams, topics, topicChecked } = state;
  const { setChecked, setTasks, setExams, setTopics, setTopicChecked } = setters;

  const [session, setSession] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | saving | saved | error
  const hydratedUserRef = useRef(null); // user-id, für den bereits hydriert/initialisiert wurde
  const saveTimer = useRef(null);

  // Aktuellen State per Ref, damit der Erst-Upload den frischesten Stand nimmt
  const latest = useRef({ checked, tasks, exams, topics, topicChecked });
  latest.current = { checked, tasks, exams, topics, topicChecked };

  // 1) Session verfolgen
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      if (!s) hydratedUserRef.current = null; // beim Abmelden Reset
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 2) Bei Login: Cloud-Daten laden (hydrieren) oder lokalen Stand hochladen
  useEffect(() => {
    if (!isSupabaseConfigured || !loaded || !session) return;
    const userId = session.user.id;
    if (hydratedUserRef.current === userId) return; // schon erledigt
    hydratedUserRef.current = userId;

    (async () => {
      setSyncStatus("saving");
      const { data, error } = await supabase
        .from(TABLE)
        .select("data")
        .eq("user_id", userId)
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
        // Noch keine Cloud-Daten: aktuellen lokalen Stand hochladen
        const { error: upErr } = await supabase.from(TABLE).upsert({
          user_id: userId,
          data: latest.current,
          updated_at: new Date().toISOString(),
        });
        setSyncStatus(upErr ? "error" : "saved");
      }
    })();
  }, [session, loaded, setChecked, setTasks, setExams, setTopics, setTopicChecked]);

  // 3) Änderungen entprellt in die Cloud schreiben (nur wenn eingeloggt & hydriert)
  useEffect(() => {
    if (!isSupabaseConfigured || !loaded || !session) return;
    if (hydratedUserRef.current !== session.user.id) return;
    setSyncStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase.from(TABLE).upsert({
        user_id: session.user.id,
        data: { checked, tasks, exams, topics, topicChecked },
        updated_at: new Date().toISOString(),
      });
      setSyncStatus(error ? "error" : "saved");
    }, 1000);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [checked, tasks, exams, topics, topicChecked, session, loaded]);

  const signIn = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { error: new Error("Sync ist nicht konfiguriert.") };
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: SITE_URL },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }, []);

  return {
    configured: isSupabaseConfigured,
    session,
    email: session?.user?.email ?? null,
    syncStatus,
    signIn,
    signOut,
  };
}
