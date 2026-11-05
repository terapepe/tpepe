import { getAddress, isAddress } from "viem";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";
import { robinhood } from "@/lib/chains";
import { db } from "@/server/db";
import { backendReady } from "@/server/env";
import { fail, json, notReady } from "@/server/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!backendReady()) return notReady("Wallet sign-in");
  const { address } = await req.json().catch(() => ({}));
  if (typeof address !== "string" || !isAddress(address)) return fail("Invalid address");

  const url = new URL(req.url);
  const nonce = generateSiweNonce();
  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60 * 1000);

  const ins = await db().from("auth_nonces").insert({ nonce, address: address.toLowerCase(), expires_at: expires.toISOString() });
  if (ins.error) return fail("Could not start sign-in", 500);

  const message = createSiweMessage({
    domain: url.host,
    address: getAddress(address),
    statement: "Sign in to TeraPepe. This is free and does not send a transaction.",
    uri: url.origin,
    version: "1",
    chainId: robinhood.id,
    nonce,
    issuedAt: now,
    expirationTime: expires,
  });
  return json({ message });
}
