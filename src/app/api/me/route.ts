import { db } from "@/server/db";
import { backendReady } from "@/server/env";
import { json } from "@/server/http";
import { getSession } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!backendReady()) return json({ address: null });
  const address = await getSession();
  if (!address) return json({ address: null });
  const u = await db().from("users").select("ref_code").eq("address", address).maybeSingle();
  return json({ address, refCode: u.data?.ref_code ?? null });
}
