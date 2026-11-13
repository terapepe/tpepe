import "server-only";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { campaignChain } from "@/lib/chains";
import { env } from "./env";

export const publicClient = createPublicClient({ chain: campaignChain, transport: http() });

export function adminAccount() {
  return privateKeyToAccount(env.adminKey);
}

export function adminWallet() {
  return createWalletClient({ account: adminAccount(), chain: campaignChain, transport: http() });
}
