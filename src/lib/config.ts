export const TOKEN = {
  name: "TeraPepe",
  ticker: "TPEPE",
  // Set NEXT_PUBLIC_TPEPE_CA once the contract is live.
  ca: process.env.NEXT_PUBLIC_TPEPE_CA || "0x...",
  domain: "terapepe.xyz",
};

export const SOCIAL = {
  x: { handle: "TeraPepeXyz", url: "https://x.com/TeraPepeXyz" },
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
