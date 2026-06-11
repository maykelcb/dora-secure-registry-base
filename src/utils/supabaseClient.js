import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Verifica si las credenciales de Supabase están configuradas en el .env.
 */
export function isSupabaseConfigured() {
  return (
    URL && !URL.includes("tu-proyecto.supabase.co") &&
    KEY && !KEY.includes("tu-anon-key-aqui")
  );
}

/**
 * Cliente de Supabase inicializado. Será null si no está configurado.
 */
export const supabase = isSupabaseConfigured()
  ? createClient(URL, KEY)
  : null;
