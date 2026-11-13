# TeraPepe ($TPEPE) — terapepe.xyz

Share-to-earn platform for new memecoins. Next.js (App Router) + TypeScript.
Wallet sign-in: EVM via wagmi/viem, and Solana via wallet-adapter.

## Network mode (all in `src/lib/config.ts`)
- `SITE_MODE = "single"` → only `SINGLE_CHAIN` (`robinhood` | `solana` | `base` | `bsc` | `ethereum`): wallet modal, CA chip, FAQ, token page and accent color follow it.
- `SITE_MODE = "multi"` → always Solana, Robinhood, Base, BSC (order = `MULTI_ORDER`; add `"ethereum"` to include it).
- `TOKEN.ca.evm` is shared by all EVM chains, `TOKEN.ca.solana` for Solana. `NETWORKS.<key>` sets `name`, `short`, `color`, `tagline`, `ca` (empty → shared CA).
- Networks with the same CA share one "Copy CA" chip (e.g. `$TPEPE RH/BASE/BSC`).
- Campaign/claim contract lives on `CAMPAIGN_CHAIN` (same chain as the TPEPE token), regardless of the mode.

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
