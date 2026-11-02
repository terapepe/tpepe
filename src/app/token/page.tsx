import type { Metadata } from "next";
import CopyChip from "@/components/CopyChip";
import { TOKEN } from "@/lib/config";

export const metadata: Metadata = { title: "$TPEPE token" };

const uses = [
  { title: "Campaign access", text: "Projects hold TPEPE to create share campaigns for new memecoins." },
  { title: "Share rewards", text: "Users who complete share quests are paid in TPEPE." },
  { title: "Auction currency", text: "Weekly spotlight bids are placed in TPEPE." },
  { title: "Launch fuel", text: "Tokens launched on terapepe.xyz can attach TPEPE-rewarded share quests from the start." },
];

export default function Page() {
  return (
    <>
      <section className="page-head">
        <span className="status">Token being built</span>
        <h1>$TPEPE</h1>
        <p className="lede">The base token of the TeraPepe ecosystem. It pays for reach and rewards the people who create it.</p>
        <CopyChip value={TOKEN.ca} label="Contract" />
      </section>

      <section className="block two">
        <h2>What TPEPE is used for</h2>
        <ul className="rows">
          {uses.map((u) => (
            <li key={u.title}>
              <h3>{u.title}</h3>
              <p>{u.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="block two">
        <h2>Token details</h2>
        <dl className="facts">
          <div><dt>Name</dt><dd>{TOKEN.name}</dd></div>
          <div><dt>Ticker</dt><dd>{TOKEN.ticker}</dd></div>
          <div><dt>Contract</dt><dd className="mono">{TOKEN.ca}</dd></div>
          <div><dt>Supply and distribution</dt><dd>To be announced</dd></div>
          <div><dt>Where to buy</dt><dd>Posted on X when the token is live</dd></div>
        </dl>
      </section>

      <section className="block callout">
        <div>
          <h2>Always check the contract</h2>
          <p>Copy the contract address from this page or from the official X account. Anything else is not TPEPE.</p>
        </div>
      </section>
    </>
  );
}
