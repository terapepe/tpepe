"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";

export type Family = "evm" | "solana";

const KEY = "tpepe.session";

function buildMessage(address: string, family: Family) {
  return [
    "Sign in to TeraPepe (terapepe.xyz)",
    "",
    "This signature is free and does not send a transaction.",
    `Wallet: ${address}`,
    `Network family: ${family}`,
    `Issued at: ${new Date().toISOString()}`,
  ].join("\n");
}

type Me = { address: string | null; refCode?: string | null };
let mePromise: Promise<Me> | null = null;
/** Server session (EVM wallets). Shared across components; reset on sign-in/out. */
function fetchMe(force = false): Promise<Me> {
  if (force || !mePromise) {
    mePromise = fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { address: null }))
      .catch(() => ({ address: null }));
  }
  return mePromise;
}

/**
 * One view over both wallet families.
 * EVM sign-in is verified on the server (SIWE with a one-time nonce) and kept in an httpOnly cookie;
 * only these sessions count for referral rewards. Solana sign-in is still client-side only.
 */
export function useSession() {
  const evm = useAccount();
  const evmDisconnect = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const sol = useWallet();

  const [mounted, setMounted] = useState(false);
  const [signedIn, setSignedIn] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      setSignedIn(localStorage.getItem(KEY));
    } catch {}
    fetchMe().then((me) => {
      setRefCode(me.refCode ?? null);
      if (me.address) setSignedIn((cur) => (cur && cur.toLowerCase() === me.address ? cur : me.address));
    });
  }, []);

  const family: Family | null = evm.isConnected ? "evm" : sol.connected ? "solana" : null;
  const address = evm.isConnected ? evm.address ?? null : sol.publicKey?.toBase58() ?? null;
  const isSignedIn = !!address && !!signedIn && signedIn.toLowerCase() === address.toLowerCase();

  const signIn = useCallback(async () => {
    if (!address || !family) return;
    setBusy(true);
    setError(null);
    try {
      if (family === "evm") {
        const n = await fetch("/api/auth/nonce", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ address }),
        }).then((r) => r.json());
        if (!n.message) throw new Error(n.error || "Could not start sign-in.");
        const signature = await signMessageAsync({ message: n.message });
        const v = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: n.message, signature }),
        }).then((r) => r.json());
        if (!v.address) throw new Error(v.error || "Sign-in failed.");
        setRefCode(v.refCode ?? null);
        fetchMe(true);
      } else {
        const message = buildMessage(address, family);
        if (!sol.signMessage) throw new Error("This wallet cannot sign messages.");
        await sol.signMessage(new TextEncoder().encode(message));
      }
      try {
        localStorage.setItem(KEY, address);
      } catch {}
      setSignedIn(address);
    } catch (e) {
      setError(e instanceof Error ? e.message.split("\n")[0] : "Signature was rejected.");
    } finally {
      setBusy(false);
    }
  }, [address, family, signMessageAsync, sol]);

  const disconnect = useCallback(async () => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setSignedIn(null);
    setRefCode(null);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    fetchMe(true);
    if (evm.isConnected) evmDisconnect.disconnect();
    if (sol.connected) await sol.disconnect();
  }, [evm.isConnected, evmDisconnect, sol]);

  return { mounted: mounted, family, address, isSignedIn, refCode, signIn, disconnect, busy, error, setError };
}

export const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
