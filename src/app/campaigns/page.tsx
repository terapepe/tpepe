import type { Metadata } from "next";
import FeaturePage from "@/components/FeaturePage";

export const metadata: Metadata = { title: "Campaigns" };

export default function Page() {
  return (
    <FeaturePage
      f={{
        status: "In development",
        title: "Campaigns for new memecoins",
        lede: "A campaign pays the community, in TPEPE, to share your token. Hold TPEPE, fund a reward pool, and let people spread your links.",
        stepsTitle: "How a campaign works",
        steps: [
          { title: "Hold TPEPE", text: "Projects must hold TPEPE in their wallet before they can open a campaign." },
          { title: "Set up the campaign", text: "Add your token, the links to share, and the TPEPE reward pool." },
          { title: "The community shares", text: "Users complete share quests that point to your links." },
          { title: "Rewards are paid in TPEPE", text: "Sharers earn from the pool as their shares are verified." },
        ],
        forWho: [
          { who: "For projects", text: "Get steady, paid attention for a fresh launch instead of hoping a post catches on." },
          { who: "For holders", text: "Every campaign needs TPEPE, which ties the token to real activity on the platform." },
        ],
      }}
    />
  );
}
