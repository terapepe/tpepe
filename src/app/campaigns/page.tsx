import type { Metadata } from "next";
import { CAMPAIGN_NET } from "@/lib/chains";
import FeaturePage from "@/components/FeaturePage";

export const metadata: Metadata = { title: "Campaigns" };

export default function Page() {
  return (
    <FeaturePage
      f={{
        scene: "campaigns",
        status: CAMPAIGN_NET.name,
        title: "Campaigns for new memecoins",
        lede: "Deposit TPEPE and pay the community for every visit and every buy click they send to your token. No holding requirement, and anything left over comes back to you.",
        cta: { href: "/campaigns/new", label: "Create a campaign" },
        stepsTitle: "How a campaign works",
        steps: [
          { title: "Deposit at least 10,000 TPEPE", text: `The deposit sits in the campaign contract on ${CAMPAIGN_NET.name}, not with TeraPepe.` },
          { title: "Set the rewards and the length", text: "Choose the TPEPE paid per referral visit and per buy-link click, and run for 1, 2, 4, 6, 12 or 24 hours." },
          { title: "Sharers spread their links", text: "Every signed-in wallet gets its own ref link and share buttons. Each visiting wallet counts once." },
          { title: "Leftovers come back automatically", text: "Rewards stop when the deposit runs out. When time is up, any unearned TPEPE is returned to your wallet." },
        ],
        forWho: [
          { who: "For projects", text: "Pay only for real signed-in visitors and buy clicks, with your token info, links and socials shown in Share quests." },
          { who: "Locked once live", text: "A campaign cannot be edited or cancelled after it is created. Check every detail before you confirm." },
        ],
        callout: false,
      }}
    />
  );
}
