import { parseUnits } from "viem";
import type { PublicCampaign } from "@/components/quests";
import { SHOW_SAMPLE_CAMPAIGNS } from "./config";
import { TPEPE_DECIMALS } from "./campaign";

/** Sample campaigns for design review; only used while the API returns none (see SHOW_SAMPLE_CAMPAIGNS). */
const H = 3600_000;
const u = (n: number) => parseUnits(String(n), TPEPE_DECIMALS).toString();
const BUY = "https://app.uniswap.org/";

type Seed = {
  id: number; name: string; ticker: string; chain: string; description: string;
  deposit: number; used: number; visit: number; click: number; startedH: number; endsH: number;
};

const SEEDS: Seed[] = [
  { id: 9001, name: "Froggy Rocket", ticker: "FROCKET", chain: "Base", deposit: 250_000, used: 61_400, visit: 25, click: 120, startedH: -6, endsH: 18,
    description: "A frog with a jetpack and a mission: reach the top of every Base chart. Community-owned, LP locked, no team tokens." },
  { id: 9002, name: "Lily Pad Finance", ticker: "LILY", chain: "Base", deposit: 120_000, used: 88_900, visit: 15, click: 80, startedH: -40, endsH: 8,
    description: "Hop between pools without leaving the pond. Simple swaps, low fees and a mascot that never sleeps." },
  { id: 9003, name: "Neon Toad", ticker: "NTOAD", chain: "Robinhood Chain", deposit: 500_000, used: 32_000, visit: 40, click: 200, startedH: -2, endsH: 70,
    description: "Glowing in the dark since block one. Neon Toad rewards the loudest holders with weekly raffles." },
  { id: 9004, name: "Swamp King", ticker: "SWAMP", chain: "Ethereum", deposit: 80_000, used: 12_350, visit: 10, click: 60, startedH: -1, endsH: 47,
    description: "Every swamp needs a king. Burn mechanics on each trade and a treasury voted on by holders." },
  { id: 9005, name: "Bubble Ribbit", ticker: "RIBBIT", chain: "Base", deposit: 60_000, used: 60_000, visit: 20, click: 100, startedH: -20, endsH: 4,
    description: "Small pond, big bubbles. The whole pool was shared out in under a day." },
  { id: 9006, name: "Moon Croak", ticker: "CROAK", chain: "Solana", deposit: 150_000, used: 141_200, visit: 30, click: 150, startedH: -50, endsH: -2,
    description: "Croaking all the way to the moon. Season one is over, season two is coming soon." },
];

function build(s: Seed, now: number): PublicCampaign {
  const endsAt = now + s.endsH * H;
  const status: PublicCampaign["status"] = endsAt <= now ? "ended" : s.used >= s.deposit ? "exhausted" : "live";
  return {
    id: s.id,
    creator: "0x5f3a9c1e27b84d06a1c9e2f7b3d8a4c6e0f1b2a3",
    content: {
      name: s.name, ticker: s.ticker, chain: s.chain, tokenAddress: "", description: s.description,
      website: "", x: "", telegram: "", discord: "", buyUrl: BUY,
    },
    deposit: u(s.deposit),
    remaining: u(s.deposit - s.used),
    rewardPerVisit: u(s.visit),
    rewardPerClick: u(s.click),
    startsAt: new Date(now + s.startedH * H).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
    status,
  };
}

export function sampleCampaigns(): PublicCampaign[] {
  if (!SHOW_SAMPLE_CAMPAIGNS) return [];
  const now = Date.now();
  const rank = { live: 0, exhausted: 1, ended: 2 } as const;
  return SEEDS.map((s) => build(s, now)).sort((a, b) => rank[a.status] - rank[b.status]);
}

export function sampleCampaign(id: number): PublicCampaign | null {
  return sampleCampaigns().find((c) => c.id === id) ?? null;
}
