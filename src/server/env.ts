import "server-only";

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const env = {
  get supabaseUrl() { return need("SUPABASE_URL"); },
  /** Service-role key, or else the publishable key used together with SERVER_DB_KEY. */
  get supabaseKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY || need("SUPABASE_PUBLISHABLE_KEY"); },
  get serverDbKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY ? null : need("SERVER_DB_KEY"); },
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

/** Database + sign-in secrets are set (sign-in, ref codes and campaign lists work). */
export function backendReady() {
  const e = process.env;
  return !!(e.SUPABASE_URL && (e.SUPABASE_SERVICE_ROLE_KEY || (e.SUPABASE_PUBLISHABLE_KEY && e.SERVER_DB_KEY)) && e.SESSION_SECRET && e.IP_SALT);
}

/** TPEPE and the campaign contract are deployed and the signer key is set (create, claim, finalize work). */
export function contractReady() {
  const e = process.env;
  const addr = /^0x[0-9a-fA-F]{40}$/;
  return backendReady() && addr.test(e.NEXT_PUBLIC_CAMPAIGNS_CONTRACT || "") && /^0x[0-9a-fA-F]{64}$/.test(e.ADMIN_PRIVATE_KEY || "");
}
