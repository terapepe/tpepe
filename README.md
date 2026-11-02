# TeraPepe (terapepe.xyz)

A simple static website where users can:

- Connect a Web3 wallet (MetaMask or any EVM browser wallet)
- Sign in with a free message signature (no gas)
- Check their native coin balance and any ERC-20 token balance

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `style.css` | Styling |
| `app.js` | Wallet connect, sign-in, balance logic (ethers.js v6) |
| `vercel.json` | Vercel config and security headers |

## Configure your token

Open `app.js` and set your token contract address:

```js
const DEFAULT_TOKEN_ADDRESS = "0xYourTokenContractAddress";
```

Users must be connected to the same network the token lives on.

## Run locally

Open the folder in VS Code and use the **Live Server** extension, or run:

```bash
npx serve .
```

## Deploy to Vercel

1. Push this project to GitHub.
2. Go to vercel.com → **Add New → Project** → import the repo.
3. Framework preset: **Other**. Leave build command and output directory empty. Click **Deploy**.
4. Add the domain: Project → **Settings → Domains** → add `terapepe.xyz` and `www.terapepe.xyz`, then set the DNS records Vercel shows at your domain registrar.

## Notes

- The sign-in here is client-side only (it proves wallet ownership in the browser). If you later add a backend or gated content, verify the signature on the server with a server-generated nonce.
- Never ask users for seed phrases or private keys.
