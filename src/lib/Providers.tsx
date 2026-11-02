"use client";

import { useMemo, useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { evmChains, robinhood, SOLANA_RPC } from "./chains";
import { base, bsc, mainnet } from "wagmi/chains";

const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

const wagmiConfig = createConfig({
  chains: evmChains,
  ssr: true,
  connectors: [injected(), ...(wcProjectId ? [walletConnect({ projectId: wcProjectId })] : [])],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [robinhood.id]: http(),
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={SOLANA_RPC}>
          <WalletProvider wallets={wallets} autoConnect>
            {children}
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
