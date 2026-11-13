"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sampleCampaign } from "@/lib/sampleCampaigns";
import { useSession } from "@/lib/useSession";
import {
  BuyButton, Countdown, PoolBar, ShareBox, StatusBadge, TokenLinks, refKey, refLink, storedRef, tp, track, type PublicCampaign,
} from "@/components/quests";
import { SignInPrompt } from "../QuestsBoard";

const MESSAGES: Record<string, string> = {
  ok: "Your visit was counted. Thanks for supporting the person who shared this.",
  duplicate: "Your visit was already counted for this campaign.",
  self: "This is your own link. Share it with others to earn.",
  ip_limit: "Visits from this network have reached the limit for this campaign.",
  device_limit: "Visits from this device have reached the limit for this campaign.",
  exhausted: "This campaign's reward pool has run out.",
  inactive: "This campaign has ended.",
  bad_ref: "This share link is not valid.",
};

export default function CampaignLanding({ id }: { id: number }) {
  const s = useSession();
  const [c, setC] = useState<PublicCampaign | null>(null);
  const [missing, setMissing] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const signedIn = s.isSignedIn && s.family === "evm";
  const tracked = useRef<string | null>(null);
  const live = c?.status === "live";

  // remember who referred this browser to this campaign (first ref link wins)
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("ref")?.toLowerCase() ?? null;
    const saved = storedRef(id);
    const r = saved ?? (fromUrl && /^[a-z0-9]{4,16}$/.test(fromUrl) ? fromUrl : null);
    if (r && !saved) {
      try { localStorage.setItem(refKey(id), r); } catch {}
    }
    setRef(r);
  }, [id]);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setC(d.campaign))
      .catch(() => {
        const sample = sampleCampaign(id);
        if (sample) setC(sample);
        else setMissing(true);
      });
  }, [id]);

  // count the visit once the visitor is signed in
  useEffect(() => {
    if (!live || !ref || !signedIn || !s.address) return;
    const doneKey = `tpepe.visit.${id}.${s.address.toLowerCase()}`;
    if (tracked.current === doneKey) return; // once per page load and wallet
    tracked.current = doneKey;
    try {
      const prev = localStorage.getItem(doneKey);
      if (prev) { setResult(prev); return; }
    } catch {}
    track(id, "visit", ref).then((r) => {
      setResult(r.status);
      if (r.status !== "error") {
        try { localStorage.setItem(doneKey, r.status === "ok" ? "duplicate" : r.status); } catch {}
      }
      if (r.status === "ok") fetch(`/api/campaigns/${id}`).then((x) => x.json()).then((d) => d.campaign && setC(d.campaign));
    });
  }, [live, ref, signedIn, s.address, id]);

  if (missing) {
    return (
      <section className="page-head">
        <h1>Campaign not found</h1>
        <p className="lede">It may have been removed or the link is wrong.</p>
        <div className="hero-actions"><Link className="btn primary" href="/quests">See all share quests</Link></div>
      </section>
    );
  }
  if (!c) return <section className="page-head"><p className="muted">Loading…</p></section>;

  return (
    <>
      <section className="page-head">
        <div className="qland-top">
          <StatusBadge s={c.status} />
          <span className="muted">{c.content.chain}</span>
        </div>
        <h1>{c.content.name} <span className="ticker">${c.content.ticker}</span></h1>
        {c.content.description && <p className="lede qdesc">{c.content.description}</p>}
        <TokenLinks c={c.content} />
        <p className="muted small mono addr-line">{c.content.tokenAddress}</p>
        <div className="hero-actions">
          <BuyButton c={c} signedIn={signedIn} className="btn primary lg" />
        </div>
      </section>

      {ref && live && (
        <section className="block">
          <div className="notice">
            <h2>Someone shared this with you</h2>
            {signedIn ? (
              result ? <p className={result === "ok" ? "ok" : "muted"}>{MESSAGES[result] ?? "Could not count this visit right now."}</p>
                     : <p className="muted">Counting your visit…</p>
            ) : (
              <SignInPrompt why="Sign in with your wallet so your visit counts for them. It is free and sends no transaction." />
            )}
          </div>
        </section>
      )}

      <section className="block two">
        <h2>Campaign</h2>
        <div className="qland-body">
          <div className="qrewards">
            <span><b>+{tp(c.rewardPerVisit)}</b> TPEPE per visit</span>
            <span><b>+{tp(c.rewardPerClick)}</b> TPEPE per buy click</span>
          </div>
          <PoolBar c={c} />
          <Countdown endsAt={c.endsAt} status={c.status} />
        </div>
      </section>

      <section className="block two">
        <h2>Earn by sharing</h2>
        <div>
          {!live ? (
            <p className="muted">This campaign is no longer paying for new visits. <Link href="/quests" className="more">See live campaigns</Link></p>
          ) : signedIn && s.refCode ? (
            <ShareBox url={refLink(c.id, s.refCode)} c={c.content} />
          ) : (
            <SignInPrompt why="Sign in to get your own link for this campaign." />
          )}
        </div>
      </section>
    </>
  );
}
