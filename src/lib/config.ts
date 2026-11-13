export const SITE_MODE = "single" as "single" | "multi";
export const SINGLE_CHAIN: ChainKey = "base";
/** EVM chain where TPEPE and the campaign contract live (campaigns, share quests, claims). */
export const CAMPAIGN_CHAIN: Exclude<ChainKey, "solana"> = "base";
export const MULTI_ORDER: ChainKey[] = ["solana", "robinhood", "base", "bsc"];

export type ChainKey = "robinhood" | "solana" | "base" | "bsc" | "ethereum";
export const NETWORKS: Record<ChainKey, { name: string; short: string; color: string; tagline: string; ca: string }> = {
  robinhood: { name: "Robinhood Chain", short: "RH", color: "#CCFF00", tagline: "Fast, low-fee L2 built for trading", ca: "" },
  solana: { name: "Solana", short: "SOL", color: "#9945FF", tagline: "Lightning-fast and meme-native", ca: "" },
  base: { name: "Base", short: "BASE", color: "#0052FF", tagline: "Onchain with the Base community", ca: "" },
  bsc: { name: "BNB Chain", short: "BSC", color: "#F0B90B", tagline: "Degen energy on BNB Chain", ca: "" },
  ethereum: { name: "Ethereum", short: "ETH", color: "#8A92FF", tagline: "The original smart-contract chain", ca: "" },
};

export const TOKEN = {
  name: "TeraPepe",
  ticker: "TPEPE",
  ca: {
    evm: "0x6e98862d03151bd3c5ae47def76380336051ea01",
    solana: "",
  },
  domain: "terapepe.xyz",
};

/** Show sample campaigns in Share quests while there are no real ones (design review). Set false before launch. */
export const SHOW_SAMPLE_CAMPAIGNS = true;

export const SOCIAL = {
  x: { handle: "", url: "https://x.com/" },
};

export const NAV = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/campaigns", label: "Campaigns", icon: "megaphone" },
  { href: "/quests", label: "Share quests", icon: "ripple" },
  { href: "/spotlight", label: "Spotlight auction", icon: "gavel" },
  { href: "/launchpad", label: "Launchpad", icon: "rocket" },
  { href: "/token", label: "$TPEPE token", icon: "coin" },
  { href: "/roadmap", label: "Roadmap", icon: "route" },
] as const;

export type IconName = (typeof NAV)[number]["icon"];

// Character scenes shown on each page. To change one, drop a new image in
// public/scenes/ and edit src / alt / caption / focus (CSS object-position) here.
export const SCENES = {
  campaigns: { src: "/scenes/command-center.webp", alt: "TeraPepe running a meme campaign command center", caption: "Campaign HQ", focus: "50% 40%" },
  quests: { src: "/scenes/asteroid.webp", alt: "Astronaut TeraPepe holding a TPEPE coin in space", caption: "Earn TPEPE", focus: "50% 35%" },
  spotlight: { src: "/scenes/stage.webp", alt: "TeraPepe presenting on stage to a packed meme crowd", caption: "This week's spotlight", focus: "50% 35%" },
  launchpad: { src: "/scenes/robot-lab.webp", alt: "TeraPepe building a new project in the robot lab", caption: "Building the launchpad", focus: "50% 45%" },
  token: { src: "/avatar-hero.webp", alt: "TeraPepe holding the TPEPE coin", caption: "$TPEPE", focus: "50% 50%" },
  roadmap: { src: "/scenes/lab.webp", alt: "TeraPepe in the lab working on the next stage", caption: "In the lab", focus: "50% 40%" },
} as const;

export type SceneKey = keyof typeof SCENES;
