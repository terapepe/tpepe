"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { TPEPE_DECIMALS } from "@/lib/campaign";
import Icon from "./Icon";

export type PublicCampaign = {
  id: number;
  creator: string;
  content: {
    name: string; ticker: string; chain: string; tokenAddress: string; description: string;
    website: string; x: string; telegram: string; discord: string; buyUrl: string;
  };
  deposit: string;
  remaining: string;
  rewardPerVisit: string;
  rewardPerClick: string;
  startsAt: string;
  endsAt: string;
  status: "live" | "exhausted" | "ended";
};

/** TPEPE amount (raw units) → "12,345.67" */
export function tp(raw: string | bigint, max = 2) {
  const n = Number(formatUnits(BigInt(raw), TPEPE_DECIMALS));
  return n.toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 6 : max });
}

export function siteOrigin() {
  return typeof window === "undefined" ? "https://terapepe.xyz" : window.location.origin;
}

export function refLink(id: number, refCode: string) {
  return `${siteOrigin()}/quests/${id}?ref=${refCode}`;
}

// ---------------------------------------------------------------- countdown

function left(ms: number) {
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h > 0 ? `${h}h ` : ""}${pad(m)}m ${pad(sec)}s`;
}

export function Countdown({ endsAt, status }: { endsAt: string; status: PublicCampaign["status"] }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <span className="countdown">&nbsp;</span>;
  const l = left(Date.parse(endsAt) - now);
  if (!l || status === "ended") return <span className="countdown ended">Ended</span>;
  return (
    <span className="countdown" suppressHydrationWarning>
      <span className="muted">Ends in</span> <b>{l}</b>
    </span>
  );
}

// ---------------------------------------------------------------- pool bar

export function PoolBar({ c }: { c: PublicCampaign }) {
  const dep = BigInt(c.deposit);
  const rem = BigInt(c.remaining);
  const pct = dep > 0n ? Number((rem * 10000n) / dep) / 100 : 0;
  return (
    <div className="pool">
      <div className="pool-top">
        <span><b>{tp(c.remaining)}</b> <span className="muted">of {tp(c.deposit)} TPEPE left</span></span>
        <span className="muted">{(Math.floor(pct * 10) / 10).toFixed(pct < 10 || pct > 99 ? 1 : 0)}%</span>
      </div>
      <div className="pool-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatusBadge({ s }: { s: PublicCampaign["status"] }) {
  const label = s === "live" ? "Live" : s === "exhausted" ? "Pool used up" : "Ended";
  return <span className={`badge ${s}`}>{label}</span>;
}

// ---------------------------------------------------------------- token links

export function TokenLinks({ c }: { c: PublicCampaign["content"] }) {
  const links = [
    { href: c.website, label: "Website" },
    { href: c.x, label: "X" },
    { href: c.telegram, label: "Telegram" },
    { href: c.discord, label: "Discord" },
  ].filter((l) => l.href);
  if (!links.length) return null;
  return (
    <ul className="tlinks">
      {links.map((l) => (
        <li key={l.label}>
          <a href={l.href} target="_blank" rel="noopener noreferrer nofollow ugc">{l.label}</a>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- share buttons

const enc = encodeURIComponent;

function targets(url: string, text: string) {
  const both = `${text} ${url}`;
  return [
    { name: "X", href: `https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(both)}` },
    { name: "Reddit", href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { name: "Threads", href: `https://www.threads.net/intent/post?text=${enc(both)}` },
    { name: "Bluesky", href: `https://bsky.app/intent/compose?text=${enc(both)}` },
  ];
}

/** Ref link with copy, native share and one button per network. Share text carries #ad (paid promotion). */
export function ShareBox({ url, c }: { url: string; c: PublicCampaign["content"] }) {
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  useEffect(() => setCanNative(typeof navigator !== "undefined" && !!navigator.share), []);
  const text = `${c.name} ($${c.ticker}) on ${c.chain} — take a look #ad`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className="sharebox">
      <div className="reflink">
        <code title={url}>{url}</code>
        <button type="button" className="chip-btn" onClick={copy}>
          <Icon name={copied ? "check" : "copy"} size={16} />
          <span>{copied ? "Copied" : "Copy link"}</span>
        </button>
      </div>
      <div className="share-row">
        {canNative && (
          <button type="button" className="share-btn" onClick={() => navigator.share({ title: c.name, text, url }).catch(() => {})}>
            Share…
          </button>
        )}
        {targets(url, text).map((t) => (
          <a key={t.name} className="share-btn" href={t.href} target="_blank" rel="noopener noreferrer">
            {t.name}
          </a>
        ))}
      </div>
      <p className="muted small">You are paid for promoting this token, so the share text includes #ad. Keep it in your post.</p>
    </div>
  );
}

// ---------------------------------------------------------------- tracking

export const refKey = (id: number) => `tpepe.ref.${id}`;

export function storedRef(id: number): string | null {
  try {
    return localStorage.getItem(refKey(id));
  } catch {
    return null;
  }
}

export async function track(campaignId: number, kind: "visit" | "click", ref: string) {
  const r = await fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ campaignId, kind, ref }),
  }).catch(() => null);
  if (!r) return { status: "error" };
  return (await r.json().catch(() => ({ status: "error" }))) as { status: string; reward?: string; error?: string };
}

/** Counts the click (if this visitor came through a ref link and is signed in), then opens the buy link. */
export function BuyButton({ c, signedIn, className = "btn primary" }: { c: PublicCampaign; signedIn: boolean; className?: string }) {
  function go() {
    const ref = storedRef(c.id);
    // keepalive lets the request finish even though a new tab takes focus
    if (ref && signedIn && c.status === "live") {
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ campaignId: c.id, kind: "click", ref }),
        keepalive: true,
      }).catch(() => {});
    }
    window.open(c.content.buyUrl, "_blank", "noopener,noreferrer");
  }
  return (
    <button type="button" className={className} onClick={go}>
      Buy ${c.content.ticker} <Icon name="arrow" size={16} />
    </button>
  );
}
