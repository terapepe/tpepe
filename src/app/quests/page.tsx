import type { Metadata } from "next";
import Scene from "@/components/Scene";
import QuestsBoard from "./QuestsBoard";

export const metadata: Metadata = { title: "Share quests" };

export default function Page() {
  return (
    <>
      <section className="page-head with-scene">
        <div>
          <span className="status">Robinhood Chain</span>
          <h1>Share a token, earn TPEPE</h1>
          <p className="lede">
            Sign in with your wallet, pick a campaign and share your own link. You earn TPEPE for every signed-in
            wallet that visits through it, and more when they click to buy.
          </p>
        </div>
        <Scene name="quests" />
      </section>
      <section className="block">
        <QuestsBoard />
      </section>
      <section className="block two">
        <h2>How it pays</h2>
        <ol className="steps">
          <li><h3>Sign in with an EVM wallet</h3><p>Your wallet gets one ref code that works for every campaign.</p></li>
          <li><h3>Share your link</h3><p>Use the buttons on a campaign to post it on X, Telegram, Facebook and more.</p></li>
          <li><h3>Visitors sign in too</h3><p>Each visiting wallet counts once per campaign for a visit, and once for a buy click.</p></li>
          <li><h3>Claim your TPEPE</h3><p>Rewards stop when a campaign&apos;s pool runs out or its time ends. Claim what you earned any time.</p></li>
        </ol>
      </section>
    </>
  );
}
