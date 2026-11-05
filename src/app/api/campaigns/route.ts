import { decodeEventLog, isHash } from "viem";
import { campaignsAbi, contentHash, validateContent } from "@/lib/campaign";
import { publicClient } from "@/server/chain";
import { CAMPAIGN_COLUMNS, publicCampaign, type CampaignRow } from "@/server/campaigns";
import { db } from "@/server/db";
import { backendReady, contractReady, env } from "@/server/env";
import { fail, json, notReady } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live campaigns first, then ones that ended in the last 3 days. */
export async function GET() {
  if (!backendReady()) return json({ campaigns: [] });
  const since = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  const r = await db()
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS)
    .gte("ends_at", since)
    .order("ends_at", { ascending: true })
    .limit(200);
  if (r.error) return fail("Could not load campaigns", 500);
  const list = (r.data as CampaignRow[]).map(publicCampaign);
  const rank = { live: 0, exhausted: 1, ended: 2 } as const;
  list.sort((a, b) => rank[a.status as keyof typeof rank] - rank[b.status as keyof typeof rank]);
  return json({ campaigns: list });
}

/**
 * Registers a campaign after the creator's createCampaign transaction is mined.
 * Everything financial comes from the on-chain event; the content must match the hash locked on-chain.
 */
export async function POST(req: Request) {
  if (!contractReady()) return notReady("Creating campaigns");
  const body = await req.json().catch(() => ({}));
  const txHash = body?.txHash;
  if (typeof txHash !== "string" || !isHash(txHash)) return fail("Invalid transaction hash");

  const v = validateContent(body?.content);
  if (!v.ok) return fail(v.errors.join("; "));

  const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` }).catch(() => null);
  if (!receipt) return fail("Transaction not found yet. Try again in a few seconds.", 404);
  if (receipt.status !== "success") return fail("Transaction failed on-chain");

  const contract = env.contract.toLowerCase();
  type Created = { id: bigint; creator: string; deposit: bigint; rewardPerVisit: bigint; rewardPerBuyClick: bigint; startsAt: bigint; endsAt: bigint; contentHash: string };
  let ev: Created | null = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contract) continue;
    try {
      const d = decodeEventLog({ abi: campaignsAbi, data: log.data, topics: log.topics });
      if (d.eventName === "CampaignCreated") ev = d.args as Created;
    } catch {}
  }
  if (!ev) return fail("No campaign was created in this transaction");
  const created: Created = ev;
  if (contentHash(v.content).toLowerCase() !== created.contentHash.toLowerCase()) {
    return fail("Content does not match what was locked on-chain");
  }

  const row = {
    id: Number(created.id),
    creator: created.creator.toLowerCase(),
    deposit: created.deposit.toString(),
    reward_per_visit: created.rewardPerVisit.toString(),
    reward_per_click: created.rewardPerBuyClick.toString(),
    starts_at: new Date(Number(created.startsAt) * 1000).toISOString(),
    ends_at: new Date(Number(created.endsAt) * 1000).toISOString(),
    content: v.content,
    content_hash: created.contentHash.toLowerCase(),
    create_tx: txHash.toLowerCase(),
  };
  // idempotent: re-posting the same transaction is fine, and nothing can be edited afterwards
  const ins = await db().from("campaigns").upsert(row, { onConflict: "id", ignoreDuplicates: true });
  if (ins.error) return fail("Could not save campaign", 500);
  return json({ id: row.id });
}
