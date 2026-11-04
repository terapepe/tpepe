import { db } from "@/server/db";
import { env } from "@/server/env";
import { clientIp, fail, json } from "@/server/http";
import { deviceId, getSession, hashWithSalt } from "@/server/session";

export const runtime = "nodejs";

/**
 * Counts a referral visit or buy-link click for the signed-in visitor.
 * Body: { campaignId, kind: "visit" | "click", ref }
 */
export async function POST(req: Request) {
  const visitor = await getSession();
  if (!visitor) return fail("Sign in with your wallet to count this visit", 401);

  const { campaignId, kind, ref } = await req.json().catch(() => ({}));
  const id = Number(campaignId);
  if (!Number.isSafeInteger(id) || id <= 0) return fail("Invalid campaign");
  if (kind !== "visit" && kind !== "click") return fail("Invalid kind");
  if (typeof ref !== "string" || !/^[a-z0-9]{4,16}$/.test(ref)) return fail("Invalid ref code");

  const r = await db().rpc("record_referral", {
    p_campaign_id: id,
    p_kind: kind,
    p_ref_code: ref,
    p_visitor: visitor,
    p_ip_hash: hashWithSalt(clientIp(req)),
    p_device_hash: hashWithSalt(await deviceId()),
    p_ip_limit: env.ipLimit,
    p_device_limit: env.deviceLimit,
  });
  if (r.error) return fail("Could not record", 500);
  const row = Array.isArray(r.data) ? r.data[0] : r.data;
  return json({ status: row?.status ?? "error", reward: typeof row?.reward === "string" ? row.reward : "0" });
}
