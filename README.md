# TeraPepe ($TPEPE) — terapepe.xyz

Share-to-earn platform for new memecoins. Next.js (App Router) + TypeScript.
Wallet sign-in: EVM (Base, Robinhood Chain, Ethereum, BNB Chain) via wagmi/viem, and Solana via wallet-adapter.

## Run

```bash
npm install
cp .env.example .env.local   # token CAs (EVM + Solana) live in src/lib/config.ts
npm run dev
```

Deploy on Vercel: framework preset **Next.js** (build command `next build`).

## Structure

```
src/
  app/            routes (one folder per sidebar page) + globals.css
  components/     Shell, Sidebar, Topbar, Footer, ConnectModal, FeaturePage...
  lib/            config.ts (token, nav, socials), chains.ts, Providers.tsx, useSession.ts
public/           static assets (replace icon.svg / add logo)
```

Sign-in is client-side only for now. When a backend exists, verify signatures server-side
with a server-issued nonce (SIWE for EVM, SIWS for Solana).
Never ask users for seed phrases or private keys.
