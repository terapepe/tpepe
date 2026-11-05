import { clearSession } from "@/server/session";
import { json } from "@/server/http";

export const runtime = "nodejs";

export async function POST() {
  await clearSession();
  return json({ ok: true });
}
