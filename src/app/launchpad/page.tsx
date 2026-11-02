import type { Metadata } from "next";
import FeaturePage from "@/components/FeaturePage";

export const metadata: Metadata = { title: "Launchpad" };

export default function Page() {
  return (
    <FeaturePage
      f={{
        status: "In development",
        title: "Launch a token with the community behind it",
        lede: "Create a new token on terapepe.xyz and switch on share quests from day one, so the community can start spreading it and earning rewards the moment it goes live.",
        stepsTitle: "How a launch works",
        steps: [
          { title: "Create your token", text: "Set the name, ticker and details on the TeraPepe launchpad." },
          { title: "Turn on share quests", text: "Optionally add community share quests, with rewards, before launch." },
          { title: "Launch", text: "Your token goes live and quests open at the same moment." },
          { title: "Rewards flow immediately", text: "Sharers start earning from the first minute, not after the hype fades." },
        ],
        forWho: [
          { who: "For creators", text: "Launch with distribution built in instead of building an audience first." },
          { who: "For early sharers", text: "Be first to share a new token and get paid for it." },
        ],
      }}
    />
  );
}
