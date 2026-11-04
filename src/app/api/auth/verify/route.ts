import { parseSiweMessage } from "viem/siwe";
import { publicClient } from "@/server/chain";
import { db } from "@/server/db";
import { fail, json } from "@/server/http";
import { setSession } from "@/server/session";
import { ensureUser } from "@/server/users";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { message, signature } = await req.json().catch(() => ({}));
  if (typeof message !== "string" || typeof signature !== "string" || !signature.startsWith("0x")) {
    return fail("Invalid request");
  }

  const parsed = parseSiweMessage(message);
  const host = new URL(req.url).host;
  if (!parsed.address || !parsed.nonce || parsed.domain !== host) return fail("Invalid sign-in message");

  // one-time nonce, bound to this address, not expired
  const used = await db()
    .from("auth_nonces")
    .update({ used_at: new Date().toISOString() })
    .eq("nonce", parsed.nonce)
    .eq("address", parsed.address.toLowerCase())
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("nonce");
  if (used.error) return fail("Could not verify", 500);
  if (!used.data?.length) return fail("Sign-in expired. Please try again.", 401);

  // also supports smart-contract wallets (ERC-1271) on Robinhood Chain
  const ok = await publicClient
    .verifySiweMessage({ message, signature: signature as `0x${string}`, domain: host, nonce: parsed.nonce })
    .catch(() => false);
  if (!ok) return fail("Signature does not match", 401);

  const refCode = await ensureUser(parsed.address);
  await setSession(parsed.address);
  return json({ address: parsed.address.toLowerCase(), refCode });
}
