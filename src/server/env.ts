import "server-only";

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const env = {
  get supabaseUrl() { return need("SUPABASE_URL"); },
  get supabaseServiceKey() { return need("SUPABASE_SERVICE_ROLE_KEY"); },
  get sessionSecret() { return need("SESSION_SECRET"); },
  get ipSalt() { return need("IP_SALT"); },
  get cronSecret() { return need("CRON_SECRET"); },
  get adminKey() { return need("ADMIN_PRIVATE_KEY") as `0x${string}`; },
  get contract() { return need("NEXT_PUBLIC_CAMPAIGNS_CONTRACT") as `0x${string}`; },
  /** Hostname allowed in sign-in messages, e.g. terapepe.xyz */
  get siteDomain() { return process.env.SITE_DOMAIN || "terapepe.xyz"; },
  /** Max counted events per IP per campaign and kind. */
  get ipLimit() { return Number(process.env.REF_IP_LIMIT || 3); },
  get deviceLimit() { return Number(process.env.REF_DEVICE_LIMIT || 1); },
};
