import { createClient } from "@supabase/supabase-js";

// URL + anon-Key sind öffentlich unbedenklich (Schutz über Row Level Security).
// Werden über Vite-Env-Variablen geladen (.env.local lokal, Vercel-Env in Produktion).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Solange keine Zugangsdaten hinterlegt sind, läuft die App rein lokal (ohne Sync) weiter.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;
