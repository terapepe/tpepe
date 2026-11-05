import Link from "next/link";
import { SOCIAL, TOKEN } from "@/lib/config";
import CopyChip from "./CopyChip";
import Icon from "./Icon";
import Logo from "./Logo";

const cols = [
  {
    title: "Platform",
    links: [
      { href: "/campaigns", label: "Campaigns" },
      { href: "/quests", label: "Share quests" },
      { href: "/spotlight", label: "Spotlight auction" },
      { href: "/launchpad", label: "Launchpad" },
    ],
  },
  {
    title: "Token",
    links: [
      { href: "/token", label: "$TPEPE overview" },
      { href: "/roadmap", label: "Roadmap" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="brand static">
            <Logo size={72} variant="lab" />
            <span className="brand-text">
              TeraPepe
              <small>{TOKEN.domain}</small>
            </span>
          </div>
          <p>Where new memecoins get shared, and the people who share them get paid.</p>
          <CopyChip value={TOKEN.ca.evm} label={`$${TOKEN.ticker} EVM`} />
          <CopyChip value={TOKEN.ca.solana} label={`$${TOKEN.ticker} SOL`} />
        </div>

        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h3>{c.title}</h3>
            <ul>
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h3>Community</h3>
          <a className="btn light" href={SOCIAL.x.url} target="_blank" rel="noopener noreferrer">
            <Icon name="x" size={16} />
            @{SOCIAL.x.handle}
          </a>
          <p className="small">Announcements, campaign calls and auction results go out here first.</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          $TPEPE is a memecoin with no promise of profit. Nothing on this site is financial advice. Do your own research,
          and never share your seed phrase or private key with anyone.
        </p>
        <p className="copy">© 2026 TeraPepe · {TOKEN.domain}</p>
      </div>
    </footer>
  );
}
