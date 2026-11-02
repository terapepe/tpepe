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

/**
 * One view over both wallet families.
 * Sign-in here is client-side only. When a backend exists, verify the signature
 * server-side against a server-issued nonce (SIWE for EVM, SIWS for Solana).
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

  useEffect(() => {
    setMounted(true);
    try {
      setSignedIn(localStorage.getItem(KEY));
    } catch {}
  }, []);

  const family: Family | null = evm.isConnected ? "evm" : sol.connected ? "solana" : null;
  const address = evm.isConnected ? evm.address ?? null : sol.publicKey?.toBase58() ?? null;
  const isSignedIn = !!address && signedIn === address;

  const signIn = useCallback(async () => {
    if (!address || !family) return;
    setBusy(true);
    setError(null);
    try {
      const message = buildMessage(address, family);
      if (family === "evm") {
        await signMessageAsync({ message });
      } else {
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
    if (evm.isConnected) evmDisconnect.disconnect();
    if (sol.connected) await sol.disconnect();
  }, [evm.isConnected, evmDisconnect, sol]);

  return { mounted: mounted, family, address, isSignedIn, signIn, disconnect, busy, error, setError };
}

export const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
