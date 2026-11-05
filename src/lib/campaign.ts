// Shared by the browser and the server so both compute the same content hash.
import { keccak256, stringToBytes, isAddress } from "viem";

export const CAMPAIGNS_CONTRACT = (process.env.NEXT_PUBLIC_CAMPAIGNS_CONTRACT || "") as `0x${string}`;
export const TPEPE_DECIMALS = 18;
export const MIN_DEPOSIT_TOKENS = 10_000;
export const DURATIONS_HOURS = [1, 2, 4, 6, 12, 24] as const;

/** What a token team fills in. Locked by its hash on-chain at creation. */
export type CampaignContent = {
  name: string;
  ticker: string;
  chain: string;
  tokenAddress: string;
  description: string;
  website: string;
  x: string;
  telegram: string;
  discord: string;
  buyUrl: string;
};

const LIMITS: Record<keyof CampaignContent, number> = {
  name: 40,
  ticker: 12,
  chain: 30,
  tokenAddress: 64,
  description: 600,
  website: 200,
  x: 200,
  telegram: 200,
  discord: 200,
  buyUrl: 300,
};
const LABELS: Record<keyof CampaignContent, string> = {
  name: "Token name", ticker: "Ticker", chain: "Chain", tokenAddress: "Token address", description: "About the token",
  website: "Website", x: "X account", telegram: "Telegram", discord: "Discord", buyUrl: "Buy link",
};
const URL_FIELDS = ["website", "x", "telegram", "discord", "buyUrl"] as const;
const ORDER = Object.keys(LIMITS) as (keyof CampaignContent)[];

function isHttpsUrl(v: string) {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
}

/** Trims fields and checks them. Returns the cleaned content or a list of problems. */
export function validateContent(input: unknown): { ok: true; content: CampaignContent } | { ok: false; errors: string[] } {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const out = {} as CampaignContent;
  for (const k of ORDER) {
    const v = typeof src[k] === "string" ? (src[k] as string).trim() : "";
    if (v.length > LIMITS[k]) errors.push(`${LABELS[k]} is too long (max ${LIMITS[k]} characters)`);
    out[k] = v;
  }
  for (const k of ["name", "ticker", "chain", "tokenAddress", "buyUrl"] as const) {
    if (!out[k]) errors.push(`${LABELS[k]} is required`);
  }
  for (const k of URL_FIELDS) {
    if (out[k] && !isHttpsUrl(out[k])) errors.push(`${LABELS[k]} must be an https:// link`);
  }
  if (out.tokenAddress && !isAddress(out.tokenAddress) && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(out.tokenAddress)) {
    errors.push("Token address is not a valid EVM or Solana address");
  }
  return errors.length ? { ok: false, errors } : { ok: true, content: out };
}

/** Stable JSON (fixed key order) → keccak256. Must match what the creator passed to createCampaign. */
export function contentHash(c: CampaignContent): `0x${string}` {
  const ordered: Record<string, string> = {};
  for (const k of ORDER) ordered[k] = c[k];
  return keccak256(stringToBytes(JSON.stringify(ordered)));
}

export const campaignsAbi = [
  {
    type: "function",
    name: "createCampaign",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "rewardPerVisit", type: "uint256" },
      { name: "rewardPerBuyClick", type: "uint256" },
      { name: "durationHours", type: "uint256" },
      { name: "contentHash", type: "bytes32" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
  },
  {
    type: "function",
    name: "claimMany",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ids", type: "uint256[]" },
      { name: "cumulativeAmounts", type: "uint256[]" },
      { name: "signatures", type: "bytes[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "finalize",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "earned", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimedBy",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getCampaign",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "creator", type: "address" },
          { name: "startsAt", type: "uint64" },
          { name: "endsAt", type: "uint64" },
          { name: "closed", type: "bool" },
          { name: "deposit", type: "uint128" },
          { name: "rewardPerVisit", type: "uint128" },
          { name: "rewardPerBuyClick", type: "uint128" },
          { name: "earned", type: "uint128" },
          { name: "claimed", type: "uint128" },
          { name: "contentHash", type: "bytes32" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "CampaignCreated",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "deposit", type: "uint256", indexed: false },
      { name: "rewardPerVisit", type: "uint256", indexed: false },
      { name: "rewardPerBuyClick", type: "uint256", indexed: false },
      { name: "startsAt", type: "uint64", indexed: false },
      { name: "endsAt", type: "uint64", indexed: false },
      { name: "contentHash", type: "bytes32", indexed: false },
    ],
  },
] as const;

export const claimTypes = {
  Claim: [
    { name: "account", type: "address" },
    { name: "campaignId", type: "uint256" },
    { name: "cumulativeAmount", type: "uint256" },
  ],
} as const;

export function claimDomain(chainId: number) {
  return { name: "TeraPepeCampaigns", version: "1", chainId, verifyingContract: CAMPAIGNS_CONTRACT } as const;
}
