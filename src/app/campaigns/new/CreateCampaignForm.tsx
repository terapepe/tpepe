"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { erc20Abi, formatUnits, isAddress, parseUnits } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import {
  CAMPAIGNS_CONTRACT,
  DURATIONS_HOURS,
  MIN_DEPOSIT_TOKENS,
  campaignsAbi,
  contentHash,
  validateContent,
  type CampaignContent,
} from "@/lib/campaign";
import { robinhood } from "@/lib/chains";
import { TOKEN } from "@/lib/config";
import { useOpenConnect } from "@/lib/connectModal";

const TPEPE = TOKEN.ca.evm as `0x${string}`;
const READY = isAddress(TPEPE) && isAddress(CAMPAIGNS_CONTRACT);
const PENDING_KEY = "tpepe.pendingCampaign";

const EMPTY: CampaignContent = {
  name: "", ticker: "", chain: "Robinhood Chain", tokenAddress: "", description: "",
  website: "", x: "", telegram: "", discord: "", buyUrl: "",
};

type Phase = "form" | "review" | "approving" | "creating" | "registering" | "done" | "register_failed";

function toUnits(v: string, decimals: number): bigint | null {
  const s = v.trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  try {
    return parseUnits(s, decimals);
  } catch {
    return null;
  }
}

const fmt = (v: bigint, d: number) =>
  Number(formatUnits(v, d)).toLocaleString("en-US", { maximumFractionDigits: 6 });

async function register(txHash: string, content: CampaignContent): Promise<{ id?: number; error?: string }> {
  // the server reads the mined transaction; retry briefly in case its RPC lags behind the wallet's
  for (let i = 0; i < 6; i++) {
    const r = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ txHash, content }),
    });
    const body = await r.json().catch(() => ({}));
    if (r.ok) return body;
    if (r.status !== 404) return { error: body.error || "Could not register the campaign." };
    await new Promise((res) => setTimeout(res, 2500));
  }
  return { error: "The transaction is mined but the server cannot see it yet." };
}

export default function CreateCampaignForm() {
  const openConnect = useOpenConnect();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const client = usePublicClient({ chainId: robinhood.id });
  const { writeContractAsync } = useWriteContract();

  const [content, setContent] = useState<CampaignContent>(EMPTY);
  const [deposit, setDeposit] = useState(String(MIN_DEPOSIT_TOKENS));
  const [perVisit, setPerVisit] = useState("");
  const [perClick, setPerClick] = useState("");
  const [hours, setHours] = useState<number>(24);
  const [agree, setAgree] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [errors, setErrors] = useState<string[]>([]);
  const [txError, setTxError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id?: number; txHash?: string }>({});
  const [pending, setPending] = useState<{ txHash: string; content: CampaignContent } | null>(null);

  const decimalsQ = useReadContract({
    address: TPEPE, abi: erc20Abi, functionName: "decimals", chainId: robinhood.id, query: { enabled: READY },
  });
  const decimals = decimalsQ.data ?? 18;
  const balanceQ = useReadContract({
    address: TPEPE, abi: erc20Abi, functionName: "balanceOf", args: address ? [address] : undefined,
    chainId: robinhood.id, query: { enabled: READY && !!address },
  });
  const allowanceQ = useReadContract({
    address: TPEPE, abi: erc20Abi, functionName: "allowance", args: address ? [address, CAMPAIGNS_CONTRACT] : undefined,
    chainId: robinhood.id, query: { enabled: READY && !!address },
  });

  // a campaign that was created on-chain but not yet registered on the site
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (raw) setPending(JSON.parse(raw));
    } catch {}
  }, []);

  // clear stale errors as soon as the user edits anything
  useEffect(() => setErrors([]), [content, deposit, perVisit, perClick, hours]);

  const amounts = useMemo(() => {
    const d = toUnits(deposit, decimals);
    const v = toUnits(perVisit, decimals);
    const c = toUnits(perClick, decimals);
    return { d, v, c };
  }, [deposit, perVisit, perClick, decimals]);

  const minDeposit = parseUnits(String(MIN_DEPOSIT_TOKENS), decimals);
  const set = (k: keyof CampaignContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setContent((c) => ({ ...c, [k]: e.target.value }));

  function check(): string[] {
    const errs: string[] = [];
    const v = validateContent(content);
    if (!v.ok) errs.push(...v.errors);
    const { d, v: pv, c: pc } = amounts;
    if (d === null) errs.push("Enter the TPEPE amount to deposit");
    else if (d < minDeposit) errs.push(`The deposit must be at least ${MIN_DEPOSIT_TOKENS.toLocaleString("en-US")} TPEPE`);
    if (pv === null || pv === 0n) errs.push("Enter the TPEPE paid per referral visit");
    if (pc === null || pc === 0n) errs.push("Enter the TPEPE paid per buy-link click");
    if (d !== null && pv && pv > d) errs.push("The reward per visit cannot be larger than the deposit");
    if (d !== null && pc && pc > d) errs.push("The reward per click cannot be larger than the deposit");
    if (d !== null && balanceQ.data !== undefined && balanceQ.data < d) {
      errs.push(`Your wallet holds ${fmt(balanceQ.data, decimals)} TPEPE, less than the deposit`);
    }
    return errs;
  }

  function toReview(e: React.FormEvent) {
    e.preventDefault();
    const errs = check();
    setErrors(errs);
    if (!errs.length) {
      setAgree(false);
      setPhase("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function submit() {
    if (!client || !address || amounts.d === null || !amounts.v || !amounts.c) return;
    const v = validateContent(content);
    if (!v.ok) return;
    setTxError(null);
    try {
      if (chainId !== robinhood.id) await switchChainAsync({ chainId: robinhood.id });

      const { data: allowance } = await allowanceQ.refetch();
      if ((allowance ?? 0n) < amounts.d) {
        setPhase("approving");
        const approveTx = await writeContractAsync({
          address: TPEPE, abi: erc20Abi, functionName: "approve", args: [CAMPAIGNS_CONTRACT, amounts.d], chainId: robinhood.id,
        });
        const ar = await client.waitForTransactionReceipt({ hash: approveTx });
        if (ar.status !== "success") throw new Error("The approval failed.");
      }

      setPhase("creating");
      const createTx = await writeContractAsync({
        address: CAMPAIGNS_CONTRACT,
        abi: campaignsAbi,
        functionName: "createCampaign",
        args: [amounts.d, amounts.v, amounts.c, BigInt(hours), contentHash(v.content)],
        chainId: robinhood.id,
      });
      const p = { txHash: createTx, content: v.content };
      try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch {}
      setPending(p);
      const cr = await client.waitForTransactionReceipt({ hash: createTx });
      if (cr.status !== "success") throw new Error("Creating the campaign failed on-chain.");

      await finishRegistration(p);
    } catch (e) {
      setTxError(e instanceof Error ? e.message.split("\n")[0] : "The transaction was not completed.");
      setPhase((ph) => (ph === "registering" ? "register_failed" : "review"));
    }
  }

  async function finishRegistration(p: { txHash: string; content: CampaignContent }) {
    setPhase("registering");
    setTxError(null);
    const r = await register(p.txHash, p.content);
    if (r.id) {
      try { localStorage.removeItem(PENDING_KEY); } catch {}
      setPending(null);
      setResult({ id: r.id, txHash: p.txHash });
      setPhase("done");
      balanceQ.refetch();
    } else {
      setTxError(r.error || "Could not register the campaign.");
      setPhase("register_failed");
    }
  }

  // ---------------------------------------------------------------- render

  if (!READY) {
    return (
      <div className="notice">
        <h2>Campaign creation opens when TPEPE is live</h2>
        <p>The TPEPE token and the campaign contract on Robinhood Chain are not deployed yet. Follow the official X account for the launch.</p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="notice ok-box">
        <h2>Campaign #{result.id} is live</h2>
        <p>It now appears in Share quests. Everything about it is locked, and any TPEPE left when it ends goes back to your wallet automatically.</p>
        <div className="callout-actions">
          <Link className="btn primary" href={`/quests#c${result.id}`}>See it in Share quests</Link>
        </div>
      </div>
    );
  }

  const busy = phase === "approving" || phase === "creating" || phase === "registering";
  const maxVisits = amounts.d && amounts.v ? amounts.d / amounts.v : null;
  const maxClicks = amounts.d && amounts.c ? amounts.d / amounts.c : null;

  return (
    <>
      {pending && phase !== "registering" && (
        <div className="notice warn-box">
          <h2>A campaign is waiting to be listed</h2>
          <p>Your campaign for <b>{pending.content.name}</b> was created on-chain but is not listed on the site yet.</p>
          {txError && phase === "register_failed" && <p className="err">{txError}</p>}
          <div className="callout-actions">
            <button className="btn primary" onClick={() => finishRegistration(pending)}>List it now</button>
          </div>
        </div>
      )}

      {phase === "review" || busy || phase === "register_failed" ? (
        <section className="review">
          <h2>Check everything before you create it</h2>
          <div className="notice danger-box" role="alert">
            <b>A campaign cannot be edited, paused or cancelled after it is created.</b>
            <p>The deposit, rewards, duration, token info and links are locked on-chain the moment you confirm. To change anything you would have to create a new campaign. When it ends, the TPEPE nobody earned is sent back to your wallet automatically.</p>
          </div>
          <dl className="facts">
            <div><dt>Token</dt><dd>{content.name} (${content.ticker}) on {content.chain}</dd></div>
            <div><dt>Token address</dt><dd className="mono">{content.tokenAddress}</dd></div>
            <div><dt>Deposit</dt><dd>{fmt(amounts.d ?? 0n, decimals)} TPEPE</dd></div>
            <div><dt>Per referral visit</dt><dd>{fmt(amounts.v ?? 0n, decimals)} TPEPE</dd></div>
            <div><dt>Per buy-link click</dt><dd>{fmt(amounts.c ?? 0n, decimals)} TPEPE</dd></div>
            <div><dt>Runs for</dt><dd>{hours} hour{hours > 1 ? "s" : ""}</dd></div>
            <div><dt>Buy link</dt><dd className="mono">{content.buyUrl}</dd></div>
            {content.website && <div><dt>Website</dt><dd className="mono">{content.website}</dd></div>}
            {content.x && <div><dt>X</dt><dd className="mono">{content.x}</dd></div>}
            {content.telegram && <div><dt>Telegram</dt><dd className="mono">{content.telegram}</dd></div>}
            {content.discord && <div><dt>Discord</dt><dd className="mono">{content.discord}</dd></div>}
          </dl>
          {content.description && <p className="desc">{content.description}</p>}

          <label className="agree">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} disabled={busy} />
            <span>I understand this campaign cannot be edited or cancelled once it is created.</span>
          </label>
          {txError && phase !== "register_failed" && <p className="err">{txError}</p>}
          <div className="callout-actions">
            <button className="btn ghost" onClick={() => setPhase("form")} disabled={busy}>Back and edit</button>
            <button className="btn primary" onClick={submit} disabled={!agree || busy || phase === "register_failed"}>
              {phase === "approving" ? "Approving TPEPE…" : phase === "creating" ? "Creating campaign…" : phase === "registering" ? "Listing campaign…" : "Approve and create"}
            </button>
          </div>
          <p className="muted small">Your wallet asks for up to two confirmations: allowing the contract to take the deposit, then creating the campaign. Both need a little ETH on Robinhood Chain for gas.</p>
        </section>
      ) : (
        <form className="cform" onSubmit={toReview} noValidate>
          {!isConnected && (
            <div className="notice">
              <p>Connect the wallet that holds the TPEPE you want to deposit.</p>
              <button type="button" className="btn primary" onClick={openConnect}>Connect wallet</button>
            </div>
          )}

          <fieldset>
            <legend>Your token</legend>
            <div className="grid2">
              <label>Token name<input value={content.name} onChange={set("name")} maxLength={40} required /></label>
              <label>Ticker<input value={content.ticker} onChange={set("ticker")} maxLength={12} placeholder="without $" required /></label>
              <label>Chain<input value={content.chain} onChange={set("chain")} maxLength={30} list="chains" required /></label>
              <label>Token address<input value={content.tokenAddress} onChange={set("tokenAddress")} maxLength={64} className="mono" required /></label>
            </div>
            <datalist id="chains">
              <option value="Robinhood Chain" /><option value="Base" /><option value="Ethereum" /><option value="BNB Chain" /><option value="Solana" />
            </datalist>
            <label>About the token<textarea value={content.description} onChange={set("description")} maxLength={600} rows={4} /></label>
          </fieldset>

          <fieldset>
            <legend>Links</legend>
            <label>Buy link <em>required, every click on it pays sharers</em>
              <input value={content.buyUrl} onChange={set("buyUrl")} placeholder="https://" inputMode="url" required />
            </label>
            <div className="grid2">
              <label>Website<input value={content.website} onChange={set("website")} placeholder="https://" inputMode="url" /></label>
              <label>X account<input value={content.x} onChange={set("x")} placeholder="https://x.com/…" inputMode="url" /></label>
              <label>Telegram<input value={content.telegram} onChange={set("telegram")} placeholder="https://t.me/…" inputMode="url" /></label>
              <label>Discord<input value={content.discord} onChange={set("discord")} placeholder="https://discord.gg/…" inputMode="url" /></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Rewards</legend>
            <div className="grid2">
              <label>Deposit (TPEPE) <em>min {MIN_DEPOSIT_TOKENS.toLocaleString("en-US")}</em>
                <input value={deposit} onChange={(e) => setDeposit(e.target.value)} inputMode="decimal" />
              </label>
              <label>Runs for
                <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                  {DURATIONS_HOURS.map((h) => <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>)}
                </select>
              </label>
              <label>TPEPE per referral visit
                <input value={perVisit} onChange={(e) => setPerVisit(e.target.value)} inputMode="decimal" placeholder="e.g. 10" />
              </label>
              <label>TPEPE per buy-link click
                <input value={perClick} onChange={(e) => setPerClick(e.target.value)} inputMode="decimal" placeholder="e.g. 50" />
              </label>
            </div>
            <p className="muted small">
              Only visitors who have signed in with a wallet are counted, once per wallet. Rewards stop as soon as the deposit runs out.
              {maxVisits !== null && maxClicks !== null && (
                <> This deposit covers up to <b>{maxVisits.toLocaleString("en-US")}</b> visits or <b>{maxClicks.toLocaleString("en-US")}</b> clicks.</>
              )}
            </p>
            {isConnected && balanceQ.data !== undefined && (
              <p className="muted small">Your wallet: {fmt(balanceQ.data, decimals)} TPEPE</p>
            )}
          </fieldset>

          {errors.length > 0 && (
            <ul className="err-list" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          )}
          <div className="callout-actions">
            <button className="btn primary lg" type="submit" disabled={!isConnected}>Review campaign</button>
          </div>
        </form>
      )}
    </>
  );
}
