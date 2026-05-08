import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserConfig } from "./config";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseBrowserConfig();

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createBrowserClient(url, anonKey);
}
