import type { Metadata } from "next";
import FeaturePage from "@/components/FeaturePage";

export const metadata: Metadata = { title: "Spotlight auction" };

export default function Page() {
  return (
    <FeaturePage
      f={{
        status: "In development",
        title: "Weekly spotlight auction",
        lede: "Bid for the featured spot on TeraPepe. The weekly winner is promoted across the official TPEPE channels and gets 100 free shares from the user community.",
        stepsTitle: "How the auction works",
        steps: [
          { title: "A new auction opens every week", text: "One featured token slot is up for bidding each week." },
          { title: "Projects place bids", text: "Bids are made in TPEPE." },
          { title: "The top bid wins the spot", text: "The winning token is featured on the platform and shared widely on the official TPEPE channels." },
          { title: "The community adds 100 shares", text: "100 free shares of the winning token are delivered by community members." },
        ],
        forWho: [
          { who: "For projects", text: "One week of prime placement plus a guaranteed wave of shares." },
          { who: "For the community", text: "Spotlight tokens give you something fresh to share and discover." },
        ],
      }}
    />
  );
}
