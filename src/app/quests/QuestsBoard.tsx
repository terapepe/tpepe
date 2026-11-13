"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useChainId, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { CAMPAIGNS_CONTRACT, campaignsAbi } from "@/lib/campaign";
import { CAMPAIGN_NET, campaignChain } from "@/lib/chains";
import { useOpenConnect } from "@/lib/connectModal";
import { sampleCampaigns } from "@/lib/sampleCampaigns";
import { useSession } from "@/lib/useSession";
import { BuyButton, Countdown, PoolBar, ShareBox, StatusBadge, TokenLinks, refLink, tp, type PublicCampaign } from "@/components/quests";

type Claim = { campaignId: number; events: number; earned: string; claimed: string; claimable: string; signature: `0x${string}` };

/** Connect / sign-in prompt used across the quests pages. */
export function SignInPrompt({ why }: { why: string }) {
  const s = useSession();
  const openConnect = useOpenConnect();
  if (!s.mounted) return null;
  if (s.family === "solana") {
    return <p className="muted small">Rewards are paid on {CAMPAIGN_NET.name}, so they need an EVM wallet such as MetaMask or Rabby.</p>;
  }
  if (!s.address) {
    return (
      <div className="signin-row">
        <span className="muted">{why}</span>
        <button type="button" className="btn primary" onClick={openConnect}>Connect wallet</button>
      </div>
    );
  }
  return (
    <div className="signin-row">
      <span className="muted">{why}</span>
      <button type="button" className="btn primary" onClick={s.signIn} disabled={s.busy}>
        {s.busy ? "Check your wallet…" : "Sign in"}
      </button>
      {s.error && <span className="err">{s.error}</span>}
    </div>
  );
}

function RewardsPanel({ campaigns }: { campaigns: PublicCampaign[] }) {
  const s = useSession();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const client = usePublicClient({ chainId: campaignChain.id });
  const { writeContractAsync } = useWriteContract();
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/claims", { cache: "no-store" }).catch(() => null);
    if (r?.ok) setClaims((await r.json()).claims);
  }, []);

  useEffect(() => {
    if (s.isSignedIn && s.family === "evm") load();
    else setClaims(null);
  }, [s.isSignedIn, s.family, load]);

  if (!s.isSignedIn || s.family !== "evm") return null;

  const open = (claims ?? []).filter((c) => BigInt(c.claimable) > 0n);
  const total = open.reduce((a, c) => a + BigInt(c.claimable), 0n);
  const earnedAll = (claims ?? []).reduce((a, c) => a + BigInt(c.earned), 0n);
  const name = (id: number) => campaigns.find((c) => c.id === id)?.content;

  async function claimAll() {
    if (!client || !open.length) return;
    setBusy(true);
    setMsg(null);
    try {
      if (chainId !== campaignChain.id) await switchChainAsync({ chainId: campaignChain.id });
      const tx = await writeContractAsync({
        address: CAMPAIGNS_CONTRACT,
        abi: campaignsAbi,
        functionName: "claimMany",
        args: [open.map((c) => BigInt(c.campaignId)), open.map((c) => BigInt(c.earned)), open.map((c) => c.signature)],
        chainId: campaignChain.id,
      });
      const r = await client.waitForTransactionReceipt({ hash: tx });
      if (r.status !== "success") throw new Error("The claim failed on-chain.");
      setMsg(`Claimed ${tp(total)} TPEPE to your wallet.`);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message.split("\n")[0] : "The claim was not completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rewards" aria-label="Your rewards">
      <div className="rewards-main">
        <div>
          <span className="muted small">Ready to claim</span>
          <strong className="big">{tp(total)} TPEPE</strong>
          <span className="muted small">Earned in total: {tp(earnedAll)} TPEPE</span>
        </div>
        <button className="btn primary lg" onClick={claimAll} disabled={busy || total === 0n}>
          {busy ? "Claiming…" : "Claim all"}
        </button>
      </div>
      {msg && <p className={msg.startsWith("Claimed") ? "ok" : "err"}>{msg}</p>}
      {claims && claims.length > 0 && (
        <ul className="earn-list">
          {claims.map((c) => {
            const n = name(c.campaignId);
            return (
              <li key={c.campaignId}>
                <span>{n ? `${n.name} ($${n.ticker})` : `Campaign #${c.campaignId}`}</span>
                <span className="muted">{c.events} counted</span>
                <span>{tp(c.earned)} TPEPE{BigInt(c.claimable) > 0n ? ` · ${tp(c.claimable)} to claim` : " · claimed"}</span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="muted small">Claiming sends one transaction on {CAMPAIGN_NET.name} and needs a little ETH for gas.</p>
    </section>
  );
}

export function CampaignCard({ c, refCode, signedIn }: { c: PublicCampaign; refCode: string | null; signedIn: boolean }) {
  const live = c.status === "live";
  return (
    <article className={`qcard ${c.status}`} id={`c${c.id}`}>
      <header className="qcard-head">
        <div>
          <h3>
            <Link href={`/quests/${c.id}`}>{c.content.name}</Link> <span className="ticker">${c.content.ticker}</span>
          </h3>
          <span className="muted small">{c.content.chain}</span>
        </div>
        <StatusBadge s={c.status} />
      </header>
      {c.content.description && <p className="qdesc">{c.content.description}</p>}
      <TokenLinks c={c.content} />
      <div className="qrewards">
        <span><b>+{tp(c.rewardPerVisit)}</b> TPEPE per visit</span>
        <span><b>+{tp(c.rewardPerClick)}</b> TPEPE per buy click</span>
      </div>
      <PoolBar c={c} />
      <div className="qmeta">
        <Countdown endsAt={c.endsAt} status={c.status} />
        <BuyButton c={c} signedIn={signedIn} className="btn ghost" />
      </div>
      {live && (signedIn && refCode ? (
        <ShareBox url={refLink(c.id, refCode)} c={c.content} />
      ) : (
        <SignInPrompt why="Sign in to get your own share link." />
      ))}
    </article>
  );
}

export default function QuestsBoard() {
  const s = useSession();
  const [campaigns, setCampaigns] = useState<PublicCampaign[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let stop = false;
    const load = () =>
      fetch("/api/campaigns", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => !stop && setCampaigns(d.campaigns?.length ? d.campaigns : sampleCampaigns()))
        .catch(() => {
          if (stop) return;
          const sample = sampleCampaigns();
          if (sample.length) setCampaigns(sample);
          else setError(true);
        });
    load();
    const t = setInterval(load, 30_000); // keep pools fresh
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  const signedIn = s.isSignedIn && s.family === "evm";

  return (
    <>
      <RewardsPanel campaigns={campaigns ?? []} />
      {error && !campaigns && <p className="err">Could not load campaigns. Please refresh.</p>}
      {campaigns && campaigns.length === 0 && (
        <div className="notice">
          <h2>No campaigns yet</h2>
          <p>When a token team opens a campaign it shows up here, with your own link to share.</p>
          <Link className="btn primary" href="/campaigns/new">Create the first campaign</Link>
        </div>
      )}
      <div className="qgrid">
        {(campaigns ?? []).map((c) => (
          <CampaignCard key={c.id} c={c} refCode={s.refCode} signedIn={signedIn} />
        ))}
      </div>
    </>
  );
}
