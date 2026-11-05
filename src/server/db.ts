import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

/** Server-only client: service-role key, or publishable key + private server key (see migration 0003). */
export function db(): SupabaseClient {
  const serverKey = env.serverDbKey;
  client ??= createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: serverKey ? { headers: { "x-tp-server-key": serverKey } } : undefined,
  });
  return client;
}
