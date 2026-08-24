import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// createClient() throws synchronously on a missing/invalid URL or key --
// during module import, before React even mounts, which crashes the whole
// app to a blank white screen with no visible error. Catching that here
// turns it into a message App.jsx can actually show someone.
let client = null;
let configError = null;
if (!url || !anonKey) {
  configError = `Missing Supabase config: ${[!url && "VITE_SUPABASE_URL", !anonKey && "VITE_SUPABASE_ANON_KEY"].filter(Boolean).join(", ")} not set on this deployment.`;
} else {
  try {
    client = createClient(url, anonKey);
  } catch (e) {
    configError = "Supabase client failed to initialize: " + (e?.message || String(e));
  }
}

export const supabase = client;
export const supabaseConfigError = configError;
