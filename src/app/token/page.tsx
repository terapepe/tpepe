import type { Metadata } from "next";
import CAChips from "@/components/CAChips";
import Scene from "@/components/Scene";
import { TOKEN } from "@/lib/config";
import { ALL_LABEL, ACTIVE, CA_GROUPS, TOKEN_LIVE, buyOf, chartOf, explorerOf } from "@/lib/chains";

export const metadata: Metadata = { title: "$TPEPE token" };

const uses = [
  { title: "Campaign deposits", text: "Projects open share campaigns by depositing TPEPE (at least 10,000). No holding required." },
  { title: "Share rewards", text: "Sharers are paid in TPEPE for every signed-in visitor and buy click their link brings." },
  { title: "Auction currency", text: "Weekly spotlight bids are placed in TPEPE." },
  { title: "Launch fuel", text: "Tokens launched on terapepe.xyz can attach TPEPE-rewarded share quests from the start." },
];

export default function Page() {
  return (
    <>
      <section className="page-head with-scene">
        <div>
          <span className="status">{TOKEN_LIVE ? `Live on ${ALL_LABEL()}` : "Token being built"}</span>
          <h1>$TPEPE</h1>
          <p className="lede">The base token of the TeraPepe ecosystem. It pays for reach and rewards the people who create it.</p>
          <CAChips prefix="" />
          {TOKEN_LIVE && (
            <div className="hero-actions">
              {ACTIVE.filter((n) => buyOf(n)).map((n) => (
                <a key={`buy-${n.key}`} className="btn primary" href={buyOf(n)} target="_blank" rel="noopener noreferrer">Buy on {n.name}</a>
              ))}
              {ACTIVE.filter((n) => chartOf(n)).map((n) => (
                <a key={`chart-${n.key}`} className="btn ghost" href={chartOf(n)} target="_blank" rel="noopener noreferrer">Chart{ACTIVE.length > 1 ? ` (${n.short})` : ""}</a>
              ))}
            </div>
          )}
        </div>
        <Scene name="token" round />
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
          <div><dt>Networks</dt><dd>{ALL_LABEL()}</dd></div>
          {CA_GROUPS.map((g) => (
            <div key={g.id}><dt>Contract ({g.nets.map((n) => n.name).join(", ")})</dt><dd className="mono" style={{ overflowWrap: "anywhere" }}>
              {g.ca ? <a href={explorerOf(g.nets[0])} target="_blank" rel="noopener noreferrer">{g.ca}</a> : "Coming soon"}
            </dd></div>
          ))}
          <div><dt>Supply and distribution</dt><dd>To be announced</dd></div>
          <div><dt>Where to buy</dt><dd>
            {TOKEN_LIVE
              ? ACTIVE.filter((n) => buyOf(n)).map((n, i) => (
                  <span key={n.key}>{i > 0 && " · "}<a href={buyOf(n)} target="_blank" rel="noopener noreferrer">{new URL(buyOf(n)).hostname.replace("app.", "")} ({n.name})</a></span>
                ))
              : "Posted on X when the token is live"}
          </dd></div>
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
