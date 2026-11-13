import { defineChain } from "viem";
import { base, bsc, mainnet } from "wagmi/chains";
import { MULTI_ORDER, NETWORKS, SINGLE_CHAIN, SITE_MODE, TOKEN, type ChainKey } from "./config";

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

/** All EVM chains wagmi knows (campaign contracts live on Robinhood Chain). */
export const evmChains = [base, robinhood, mainnet, bsc] as const;
const EVM_BY_KEY = { robinhood, base, bsc, ethereum: mainnet } as const;
const EXPLORER: Record<ChainKey, string> = {
  robinhood: "https://robinhoodchain.blockscout.com/token/",
  solana: "https://solscan.io/token/",
  base: "https://basescan.org/token/",
  bsc: "https://bscscan.com/token/",
  ethereum: "https://etherscan.io/token/",
};

export type Net = (typeof NETWORKS)[ChainKey] & { key: ChainKey; vm: "evm" | "svm"; explorer: string };
const net = (key: ChainKey): Net => ({ key, ...NETWORKS[key], vm: key === "solana" ? "svm" : "evm", explorer: EXPLORER[key] });

const REQUIRED: ChainKey[] = ["solana", "robinhood", "base", "bsc"]; // multi always shows these 4
export const IS_SINGLE = SITE_MODE !== "multi";
export const ACTIVE: Net[] = IS_SINGLE
  ? [net(NETWORKS[SINGLE_CHAIN] ? SINGLE_CHAIN : "robinhood")]
  : [...new Set([...MULTI_ORDER, ...REQUIRED])].filter((k) => NETWORKS[k]).map(net);
export const PRIMARY = ACTIVE[0];

/** Networks offered in the UI for SITE_MODE (wagmi still knows all chains). */
export const activeEvmChains = ACTIVE.filter((n) => n.vm === "evm").map((n) => EVM_BY_KEY[n.key as keyof typeof EVM_BY_KEY]);
export const solanaEnabled = ACTIVE.some((n) => n.vm === "svm");
export const evmEnabled = activeEvmChains.length > 0;
const join = (a: string[], sep = "and") => a.join(", ").replace(/, ([^,]*)$/, ` ${sep} $1`);
/** e.g. "Robinhood Chain, Base and BNB Chain" (multi) · "Robinhood Chain" (single) */
export const EVM_LABEL = join(ACTIVE.filter((n) => n.vm === "evm").map((n) => n.name));
export const ALL_LABEL = (sep = "and") => join(ACTIVE.map((n) => n.name), sep);
export const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com";

/** CA of a network: NETWORKS[key].ca → TOKEN.ca.evm / TOKEN.ca.solana */
export const caOf = (n: Net) => (n.ca || (n.vm === "svm" ? TOKEN.ca.solana : TOKEN.ca.evm) || "").trim();

/** Networks sharing a CA → one "Copy CA" chip (multi: RH/BASE/BSC + SOL) */
export type CaGroup = { id: string; ca: string; nets: Net[]; tag: string };
export const CA_GROUPS: CaGroup[] = ACTIVE.reduce<CaGroup[]>((acc, n) => {
  const ca = caOf(n), id = ca ? ca.toLowerCase() : n.key, g = acc.find((x) => x.id === id);
  if (g) { g.nets.push(n); g.tag = g.nets.map((x) => x.short).join("/"); } else acc.push({ id, ca, nets: [n], tag: n.short });
  return acc;
}, []);

/** Explorer page of the token on a network ("" when no CA yet). */
export const explorerOf = (n: Net) => (caOf(n) ? n.explorer + caOf(n) : "");

const BUY: Partial<Record<ChainKey, (ca: string) => string>> = {
  base: (ca) => `https://app.uniswap.org/swap?chain=base&outputCurrency=${ca}`,
  ethereum: (ca) => `https://app.uniswap.org/swap?chain=mainnet&outputCurrency=${ca}`,
  bsc: (ca) => `https://pancakeswap.finance/swap?chain=bsc&outputCurrency=${ca}`,
  solana: (ca) => `https://jup.ag/swap/SOL-${ca}`,
};
const CHART_SLUG: Partial<Record<ChainKey, string>> = { base: "base", ethereum: "ethereum", bsc: "bsc", solana: "solana", robinhood: "robinhood" };

/** Swap page for the token ("" when unknown or no CA). */
export const buyOf = (n: Net) => { const ca = caOf(n), f = BUY[n.key]; return ca && f ? f(ca) : ""; };
/** DexScreener chart ("" when no CA). */
export const chartOf = (n: Net) => { const ca = caOf(n), slug = CHART_SLUG[n.key]; return ca && slug ? `https://dexscreener.com/${slug}/${ca}` : ""; };
/** At least one network has a CA. */
export const TOKEN_LIVE = ACTIVE.some((n) => !!caOf(n));
/** First network with a swap link (hero "Buy" button, works in single and multi). */
export const BUY_NET = ACTIVE.find((n) => !!buyOf(n));
