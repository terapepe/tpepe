import "server-only";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { robinhood } from "@/lib/chains";
import { env } from "./env";

export const publicClient = createPublicClient({ chain: robinhood, transport: http() });

export function adminAccount() {
  return privateKeyToAccount(env.adminKey);
}

export function adminWallet() {
  return createWalletClient({ account: adminAccount(), chain: robinhood, transport: http() });
}
