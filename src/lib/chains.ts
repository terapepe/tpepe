import { defineChain } from "viem";
import { base, bsc, mainnet } from "wagmi/chains";
import { SITE_MODE } from "./config";

export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ROBINHOOD_RPC || "https://rpc.mainnet.chain.robinhood.com"],
    },
  },
});

export const evmChains = [base, robinhood, mainnet, bsc] as const;

/** Networks offered in the UI for SITE_MODE (wagmi still knows all chains). */
export const IS_SINGLE = SITE_MODE === "single";
export const activeEvmChains = IS_SINGLE ? [robinhood] : [...evmChains];
export const solanaEnabled = !IS_SINGLE;
const join = (a: string[]) => a.join(", ").replace(/, ([^,]*)$/, " and $1");
/** e.g. "Base, Robinhood Chain, Ethereum and BNB Chain" (multi) · "Robinhood Chain" (single) */
export const EVM_LABEL = join(activeEvmChains.map((c) => (c.id === 1 ? "Ethereum" : c.name)));
export const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com";
