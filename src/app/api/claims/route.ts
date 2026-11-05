import { getAddress } from "viem";
import { campaignsAbi, claimDomain, claimTypes } from "@/lib/campaign";
import { robinhood } from "@/lib/chains";
import { adminAccount, publicClient } from "@/server/chain";
import { db } from "@/server/db";
import { env, contractReady } from "@/server/env";
import { fail, json, notReady } from "@/server/http";
import { getSession } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Everything the signed-in wallet has earned as a sharer, with a signed voucher per campaign.
 * The wallet passes the vouchers to claimMany() on the contract.
 */
export async function GET() {
  if (!contractReady()) return notReady("Claiming");
  const address = await getSession();
  if (!address) return fail("Sign in first", 401);

  const r = await db().from("referrer_earnings").select("campaign_id, earned::text, events").eq("referrer", address);
  if (r.error) return fail("Could not load earnings", 500);

  const account = adminAccount();
  const domain = { ...claimDomain(robinhood.id), verifyingContract: env.contract };
  const user = getAddress(address);

  const items = await Promise.all(
    (r.data ?? []).map(async (e: { campaign_id: number; earned: string; events: number }) => {
      const cumulative = BigInt(e.earned);
      const claimed = (await publicClient.readContract({
        address: env.contract,
        abi: campaignsAbi,
        functionName: "claimedBy",
        args: [BigInt(e.campaign_id), user],
      })) as bigint;
      const signature = await account.signTypedData({
        domain,
        types: claimTypes,
        primaryType: "Claim",
        message: { account: user, campaignId: BigInt(e.campaign_id), cumulativeAmount: cumulative },
      });
      return {
        campaignId: e.campaign_id,
        events: e.events,
        earned: cumulative.toString(),
        claimed: claimed.toString(),
        claimable: (cumulative > claimed ? cumulative - claimed : 0n).toString(),
        signature,
      };
    }),
  );
  return json({ claims: items });
}
