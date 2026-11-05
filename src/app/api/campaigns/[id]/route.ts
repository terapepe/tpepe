import { CAMPAIGN_COLUMNS, publicCampaign, type CampaignRow } from "@/server/campaigns";
import { db } from "@/server/db";
import { backendReady } from "@/server/env";
import { fail, json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!backendReady()) return fail("Campaign not found", 404);
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return fail("Invalid campaign", 404);
  const r = await db().from("campaigns").select(CAMPAIGN_COLUMNS).eq("id", id).maybeSingle();
  if (r.error) return fail("Could not load campaign", 500);
  if (!r.data) return fail("Campaign not found", 404);
  return json({ campaign: publicCampaign(r.data as CampaignRow) });
}
