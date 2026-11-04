import { timingSafeEqual } from "node:crypto";
import { campaignsAbi } from "@/lib/campaign";
import { adminWallet, publicClient } from "@/server/chain";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { fail, json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request) {
  const got = Buffer.from(req.headers.get("authorization") || "");
  const want = Buffer.from(`Bearer ${env.cronSecret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

/**
 * Closes ended campaigns on-chain: reports what sharers earned so the rest is refunded to the creator.
 * Safe to call repeatedly.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return fail("Unauthorized", 401);

  const due = await db()
    .from("campaigns")
    .select("id, earned::text")
    .eq("closed", false)
    .lte("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: true })
    .limit(10);
  if (due.error) return fail("Could not load campaigns", 500);

  const wallet = adminWallet();
  const results: { id: number; status: string; tx?: string }[] = [];

  for (const c of due.data ?? []) {
    try {
      const onchain = (await publicClient.readContract({
        address: env.contract,
        abi: campaignsAbi,
        functionName: "getCampaign",
        args: [BigInt(c.id)],
      })) as { closed: boolean };
      if (onchain.closed) {
        // already closed (e.g. by an earlier run or the creator's reclaim)
        await db().from("campaigns").update({ closed: true }).eq("id", c.id);
        results.push({ id: c.id, status: "already_closed" });
        continue;
      }
      const { request } = await publicClient.simulateContract({
        account: wallet.account,
        address: env.contract,
        abi: campaignsAbi,
        functionName: "finalize",
        args: [BigInt(c.id), BigInt(c.earned)],
      });
      const tx = await wallet.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx, timeout: 45_000 });
      if (receipt.status !== "success") throw new Error("reverted");
      await db().from("campaigns").update({ closed: true, close_tx: tx }).eq("id", c.id);
      results.push({ id: c.id, status: "closed", tx });
    } catch (e) {
      results.push({ id: c.id, status: `error: ${e instanceof Error ? e.message.split("\n")[0] : "unknown"}` });
    }
  }
  return json({ processed: results.length, results });
}
