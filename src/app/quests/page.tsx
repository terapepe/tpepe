import type { Metadata } from "next";
import FeaturePage from "@/components/FeaturePage";

export const metadata: Metadata = { title: "Share quests" };

export default function Page() {
  return (
    <FeaturePage
      f={{
        status: "In development",
        title: "Share a token, earn TPEPE",
        lede: "Pick a live campaign, share the project's link, and receive TPEPE as your reward.",
        stepsTitle: "How a share quest works",
        steps: [
          { title: "Connect your wallet", text: "Sign in with an EVM wallet (Base, Robinhood Chain, Ethereum, BNB Chain) or Solana." },
          { title: "Choose a quest", text: "Browse open campaigns and see what each one pays." },
          { title: "Share the link", text: "Post the project's link where your audience will see it." },
          { title: "Collect your reward", text: "Verified shares pay out in TPEPE to the wallet you signed in with." },
        ],
        forWho: [
          { who: "For sharers", text: "Turn the posts you already make about new tokens into TPEPE." },
          { who: "For projects", text: "Real people share your link, so reach comes from the community, not from one account." },
        ],
      }}
    />
  );
}
