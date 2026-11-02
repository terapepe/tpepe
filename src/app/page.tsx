import Link from "next/link";
import CopyChip from "@/components/CopyChip";
import Icon from "@/components/Icon";
import RippleHero from "@/components/RippleHero";
import { SOCIAL, TOKEN } from "@/lib/config";

const utilities = [
  {
    href: "/campaigns",
    icon: "megaphone" as const,
    title: "Fund share campaigns",
    text: "New memecoin projects hold TPEPE to open a campaign and pay the community to spread their links.",
  },
  {
    href: "/quests",
    icon: "ripple" as const,
    title: "Earn by sharing",
    text: "Complete share quests for any live project and receive TPEPE as your reward.",
  },
  {
    href: "/spotlight",
    icon: "gavel" as const,
    title: "Win the weekly spotlight",
    text: "Bid for the featured slot. The winner is promoted on official channels and gets 100 free community shares.",
  },
  {
    href: "/launchpad",
    icon: "rocket" as const,
    title: "Launch with a crowd",
    text: "Create a token on terapepe.xyz with community share quests and rewards switched on from the first minute.",
  },
];

const faq = [
  { q: "What is TeraPepe?", a: "A platform where new memecoin projects pay for shares in TPEPE and the community earns TPEPE by sharing them." },
  { q: "Which wallets can I use?", a: "Any EVM wallet on Base, Robinhood Chain, Ethereum or BNB Chain, plus Solana wallets such as Phantom and Solflare." },
  { q: "Is anything live yet?", a: "The site and wallet sign-in are. Campaigns, share quests, auctions and the launchpad are being built in stages." },
  { q: "Does signing in cost anything?", a: "No. It is a free signature. It does not send a transaction or move funds." },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Make every new memecoin ripple.</h1>
          <p className="lede">
            TeraPepe pays people to share new tokens. Projects hold <b>${TOKEN.ticker}</b> to run campaigns, and the
            community earns <b>${TOKEN.ticker}</b> for spreading the word.
          </p>
          <div className="hero-actions">
            <Link className="btn primary lg" href="/campaigns">
              See how it works
            </Link>
            <a className="btn ghost lg" href={SOCIAL.x.url} target="_blank" rel="noopener noreferrer">
              <Icon name="x" size={16} /> @{SOCIAL.x.handle}
            </a>
          </div>
          <CopyChip value={TOKEN.ca} label={`$${TOKEN.ticker}`} />
        </div>
        <RippleHero />
      </section>

      <section className="block two">
        <h2>What TPEPE does</h2>
        <ul className="rows">
          {utilities.map((u) => (
            <li key={u.href}>
              <span className="row-icon"><Icon name={u.icon} size={22} /></span>
              <div>
                <h3>{u.title}</h3>
                <p>{u.text}</p>
                <Link href={u.href} className="more">Read more</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="block two">
        <h2>How a campaign runs</h2>
        <ol className="steps">
          <li><h3>A project holds TPEPE</h3><p>Holding the token is what unlocks campaign creation.</p></li>
          <li><h3>It funds a reward pool</h3><p>The pool pays sharers in TPEPE.</p></li>
          <li><h3>The community shares</h3><p>Users complete quests that point at the project’s links.</p></li>
          <li><h3>Sharers get paid</h3><p>Rewards arrive in the wallet they signed in with.</p></li>
        </ol>
      </section>

      <section className="block callout">
        <div>
          <h2>Built in stages, in the open</h2>
          <p>The site and wallet sign-in come first. Campaigns, quests, auctions and the launchpad follow.</p>
        </div>
        <div className="callout-actions">
          <Link className="btn primary" href="/roadmap">View the roadmap</Link>
        </div>
      </section>

      <section className="block two">
        <h2>Questions</h2>
        <div className="faq">
          {faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
