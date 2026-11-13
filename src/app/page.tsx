import Link from "next/link";
import CAChips from "@/components/CAChips";
import Icon from "@/components/Icon";
import RippleHero from "@/components/RippleHero";
import { SOCIAL, TOKEN } from "@/lib/config";
import { ALL_LABEL, EVM_LABEL, evmEnabled, IS_SINGLE, PRIMARY, solanaEnabled, TOKEN_LIVE, BUY_NET, buyOf } from "@/lib/chains";

const utilities = [
  {
    href: "/campaigns",
    icon: "megaphone" as const,
    title: "Fund share campaigns",
    text: "New memecoin projects open a campaign with a TPEPE deposit and pay the community for every visit and buy click they send.",
  },
  {
    href: "/quests",
    icon: "ripple" as const,
    title: "Earn by sharing",
    text: "Share your own link for any live campaign and earn TPEPE for every signed-in visitor and buy click.",
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
  { q: "Which wallets can I use?", a: !evmEnabled ? "Solana wallets such as Phantom and Solflare." : solanaEnabled ? `Any EVM wallet on ${EVM_LABEL.replace(" and ", " or ")}, plus Solana wallets such as Phantom and Solflare.` : `Any EVM wallet (MetaMask, Rabby, Coinbase Wallet…) on ${EVM_LABEL}.` },
  { q: `Which ${IS_SINGLE ? "chain is" : "chains are"} $TPEPE on?`, a: IS_SINGLE ? `${PRIMARY.name}. ${PRIMARY.tagline}.` : `${ALL_LABEL()}. EVM chains share one contract address; Solana has its own.` },
  { q: "Is anything live yet?", a: TOKEN_LIVE ? `Yes. $TPEPE is live on ${ALL_LABEL()}, and the site and wallet sign-in work. Campaigns, share quests, auctions and the launchpad are being built in stages.` : "The site and wallet sign-in are. Campaigns, share quests, auctions and the launchpad are being built in stages." },
  { q: "Does signing in cost anything?", a: "No. It is a free signature. It does not send a transaction or move funds." },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          {IS_SINGLE && <span className="chain-tag"><i />{PRIMARY.name} · {PRIMARY.tagline}</span>}
          <h1>Make every new memecoin ripple.</h1>
          <p className="lede">
            TeraPepe pays people to share new tokens. Projects open campaigns with <b>${TOKEN.ticker}</b>, no holding required, and the
            community earns <b>${TOKEN.ticker}</b> for spreading the word.
          </p>
          <div className="hero-actions">
            {BUY_NET && (
              <a className="btn primary lg" href={buyOf(BUY_NET)} target="_blank" rel="noopener noreferrer">
                Buy ${TOKEN.ticker}
              </a>
            )}
            <Link className={`btn ${BUY_NET ? "ghost" : "primary"} lg`} href="/campaigns">
              See how it works
            </Link>
            <a className="btn ghost lg" href={SOCIAL.x.url} target="_blank" rel="noopener noreferrer">
              <Icon name="x" size={16} /> @{SOCIAL.x.handle}
            </a>
          </div>
          <CAChips />
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
          <li><h3>A project opens a campaign with TPEPE</h3><p>It deposits at least 10,000 TPEPE. No holding requirement.</p></li>
          <li><h3>It sets the rewards</h3><p>TPEPE per referral visit and per buy-link click, for 1 to 24 hours.</p></li>
          <li><h3>The community shares</h3><p>Each signed-in wallet gets its own ref link and share buttons.</p></li>
          <li><h3>Sharers get paid</h3><p>Rewards stop when the deposit runs out; unused TPEPE goes back to the project.</p></li>
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
