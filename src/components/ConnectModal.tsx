"use client";

import { useEffect, useState } from "react";
import { useChainId, useConnect, useSwitchChain } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { evmChains } from "@/lib/chains";
import { short, useSession } from "@/lib/useSession";
import Icon from "./Icon";

export default function ConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSession();
  const [tab, setTab] = useState<"evm" | "solana">("evm");
  const evm = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const sol = useWallet();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="cm-title">
      <div className="scrim show modal-scrim" onClick={onClose} />
      <div className="modal">
        <header className="modal-head">
          <h2 id="cm-title">{s.address ? "Your wallet" : "Connect a wallet"}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>

        {s.address && s.family ? (
          <div className="modal-body">
            <p className="addr">
              <span className="muted">{s.family === "evm" ? "EVM address" : "Solana address"}</span>
              <code>{short(s.address)}</code>
            </p>

            {s.family === "evm" && (
              <div>
                <p className="muted small">Network</p>
                <div className="chain-grid">
                  {evmChains.map((c) => (
                    <button
                      key={c.id}
                      className={`chain-btn ${chainId === c.id ? "on" : ""}`}
                      onClick={() => switchChain({ chainId: c.id })}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {s.isSignedIn ? (
              <p className="ok">Signed in. Your wallet is verified for this browser.</p>
            ) : (
              <button className="btn primary block" onClick={s.signIn} disabled={s.busy}>
                {s.busy ? "Waiting for signature…" : "Sign in with signature"}
              </button>
            )}
            {s.error && <p className="err">{s.error}</p>}
            <p className="muted small">Signing is free. It never sends a transaction or gives access to your funds.</p>

            <button className="btn ghost block" onClick={() => (s.disconnect(), onClose())}>
              Disconnect
            </button>
          </div>
        ) : (
          <div className="modal-body">
            <div className="tabs" role="tablist">
              <button role="tab" aria-selected={tab === "evm"} className={tab === "evm" ? "on" : ""} onClick={() => setTab("evm")}>
                EVM
              </button>
              <button role="tab" aria-selected={tab === "solana"} className={tab === "solana" ? "on" : ""} onClick={() => setTab("solana")}>
                Solana
              </button>
            </div>

            {tab === "evm" ? (
              <>
                <p className="muted small">Base, Robinhood Chain, Ethereum and BNB Chain.</p>
                <ul className="wallet-list">
                  {evm.connectors.map((c) => (
                    <li key={c.uid}>
                      <button className="wallet-btn" onClick={() => evm.connect({ connector: c }, { onSuccess: () => {} })}>
                        {c.icon ? <img src={c.icon} alt="" width={28} height={28} /> : <Icon name="wallet" size={28} />}
                        <span>{c.name === "Injected" ? "Browser wallet" : c.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {evm.error && <p className="err">{evm.error.message.split("\n")[0]}</p>}
              </>
            ) : (
              <>
                <p className="muted small">Phantom, Solflare and other Solana wallets.</p>
                <ul className="wallet-list">
                  {sol.wallets.map((w) => {
                    const missing = w.readyState === WalletReadyState.NotDetected || w.readyState === WalletReadyState.Unsupported;
                    return (
                      <li key={w.adapter.name}>
                        {missing ? (
                          <a className="wallet-btn" href={w.adapter.url} target="_blank" rel="noopener noreferrer">
                            <img src={w.adapter.icon} alt="" width={28} height={28} />
                            <span>{w.adapter.name}</span>
                            <em>Install</em>
                          </a>
                        ) : (
                          <button className="wallet-btn" onClick={() => sol.select(w.adapter.name)}>
                            <img src={w.adapter.icon} alt="" width={28} height={28} />
                            <span>{w.adapter.name}</span>
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            <p className="muted small">TeraPepe never asks for your seed phrase or private key.</p>
          </div>
        )}
      </div>
    </div>
  );
}
