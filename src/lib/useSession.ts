"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
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

// One sign-in state for the whole app, so signing in inside the wallet modal updates every component at once.
type Shared = { signedIn: string | null; refCode: string | null };
let shared: Shared = { signedIn: null, refCode: null };
const listeners = new Set<() => void>();
function setShared(patch: Partial<Shared> | ((s: Shared) => Partial<Shared>)) {
  shared = { ...shared, ...(typeof patch === "function" ? patch(shared) : patch) };
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));
const SERVER_SNAPSHOT: Shared = { signedIn: null, refCode: null };

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
  const { signedIn, refCode } = useSyncExternalStore(subscribe, () => shared, () => SERVER_SNAPSHOT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!shared.signedIn) {
      try {
        const saved = localStorage.getItem(KEY);
        if (saved) setShared({ signedIn: saved });
      } catch {}
    }
    fetchMe().then((me) => {
      setShared((cur) => ({
        refCode: me.refCode ?? null,
        signedIn: me.address && !(cur.signedIn && cur.signedIn.toLowerCase() === me.address) ? me.address : cur.signedIn,
      }));
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
        setShared({ refCode: v.refCode ?? null });
        fetchMe(true);
      } else {
        const message = buildMessage(address, family);
        if (!sol.signMessage) throw new Error("This wallet cannot sign messages.");
        await sol.signMessage(new TextEncoder().encode(message));
      }
      try {
        localStorage.setItem(KEY, address);
      } catch {}
      setShared({ signedIn: address });
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
    setShared({ signedIn: null, refCode: null });
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    fetchMe(true);
    if (evm.isConnected) evmDisconnect.disconnect();
    if (sol.connected) await sol.disconnect();
  }, [evm.isConnected, evmDisconnect, sol]);

  return { mounted: mounted, family, address, isSignedIn, refCode, signIn, disconnect, busy, error, setError };
}

export const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
