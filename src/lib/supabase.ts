import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function isValidSupabaseUrl(value: unknown) {
  return typeof value === "string" && /^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(value.trim());
}

function isValidSupabaseKey(value: unknown) {
  return (
    typeof value === "string" &&
    /^[\x20-\x7e]+$/.test(value.trim()) &&
    (value.trim().startsWith("sb_pub_") ||
      value.trim().startsWith("sb_publishable_") ||
      value.trim().startsWith("eyJ"))
  );
}

export const isSupabaseConfigured =
  isValidSupabaseUrl(supabaseUrl) && isValidSupabaseKey(supabaseAnonKey);

export const supabase = createClient(
  isValidSupabaseUrl(supabaseUrl) ? supabaseUrl.trim() : "https://placeholder.supabase.co",
  isValidSupabaseKey(supabaseAnonKey) ? supabaseAnonKey.trim() : "placeholder-anon-key",
);
