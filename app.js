// ============================================================
// TeraPepe - simple Web3 wallet login + token balance checker
// Uses ethers.js v6 (loaded from CDN in index.html)
// ============================================================

// OPTIONAL: put your token contract address here to prefill the input.
// Leave empty ("") to let users paste any ERC-20 address themselves.
const DEFAULT_TOKEN_ADDRESS = "";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const NETWORKS = {
  1: { name: "Ethereum", symbol: "ETH" },
  10: { name: "Optimism", symbol: "ETH" },
  56: { name: "BNB Smart Chain", symbol: "BNB" },
  137: { name: "Polygon", symbol: "POL" },
  8453: { name: "Base", symbol: "ETH" },
  42161: { name: "Arbitrum One", symbol: "ETH" },
  43114: { name: "Avalanche C-Chain", symbol: "AVAX" },
  11155111: { name: "Sepolia (testnet)", symbol: "ETH" }
};

const $ = (id) => document.getElementById(id);

const el = {
  connectBtn: $("connectBtn"),
  signBtn: $("signBtn"),
  disconnectBtn: $("disconnectBtn"),
  checkBtn: $("checkBtn"),
  notConnected: $("notConnected"),
  connected: $("connected"),
  balanceCard: $("balanceCard"),
  addr: $("addr"),
  network: $("network"),
  loginStatus: $("loginStatus"),
  nativeBal: $("nativeBal"),
  tokenInput: $("tokenInput"),
  tokenBal: $("tokenBal"),
  message: $("message"),
  year: $("year")
};

let provider = null;
let account = null;
let chainId = null;

el.year.textContent = new Date().getFullYear();
el.tokenInput.value = DEFAULT_TOKEN_ADDRESS;

// ---------- UI helpers ----------
function setMessage(text, type = "") {
  el.message.textContent = text;
  el.message.className = "message " + type;
}

function shorten(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function setSignedIn(signedIn) {
  el.loginStatus.textContent = signedIn ? "Signed in" : "Not signed in";
  el.loginStatus.classList.toggle("ok", signedIn);
  el.signBtn.textContent = signedIn ? "Signed in ✓" : "Sign In";
  el.signBtn.disabled = signedIn;
}

function sessionKey(addr) {
  return "terapepe_session_" + addr.toLowerCase();
}

function showConnected(isConnected) {
  el.notConnected.classList.toggle("hidden", isConnected);
  el.connected.classList.toggle("hidden", !isConnected);
  el.balanceCard.classList.toggle("hidden", !isConnected);
  el.connectBtn.textContent = isConnected ? shorten(account || "0x000000000000") : "Connect Wallet";
}

function resetState() {
  provider = null;
  account = null;
  chainId = null;
  el.tokenBal.textContent = "-";
  el.nativeBal.textContent = "-";
  showConnected(false);
  setSignedIn(false);
}

// ---------- Wallet ----------
async function connectWallet() {
  if (!window.ethereum) {
    setMessage("No Web3 wallet found. Please install MetaMask or another EVM wallet.", "error");
    return;
  }

  try {
    el.connectBtn.disabled = true;
    setMessage("Waiting for wallet approval...");
    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    if (!accounts || accounts.length === 0) throw new Error("No account returned.");
    await loadAccount(accounts[0]);
    setMessage("Wallet connected.", "success");
  } catch (err) {
    if (err && err.code === 4001) {
      setMessage("Connection request was rejected.", "error");
    } else {
      setMessage("Could not connect: " + (err.shortMessage || err.message || err), "error");
    }
  } finally {
    el.connectBtn.disabled = false;
  }
}

async function loadAccount(address) {
  account = ethers.getAddress(address);
  const net = await provider.getNetwork();
  chainId = Number(net.chainId);

  el.addr.textContent = account;
  el.network.textContent = (NETWORKS[chainId] && NETWORKS[chainId].name) || "Chain ID " + chainId;

  showConnected(true);
  setSignedIn(sessionStorage.getItem(sessionKey(account)) === "1");
  await refreshNativeBalance();
}

async function refreshNativeBalance() {
  try {
    const bal = await provider.getBalance(account);
    const symbol = (NETWORKS[chainId] && NETWORKS[chainId].symbol) || "Native";
    el.nativeBal.textContent = formatAmount(ethers.formatEther(bal)) + " " + symbol;
  } catch (err) {
    el.nativeBal.textContent = "Error";
  }
}

// ---------- Sign in (free signature, no gas) ----------
async function signIn() {
  if (!provider || !account) return;

  try {
    el.signBtn.disabled = true;
    const signer = await provider.getSigner();
    const nonce = crypto.getRandomValues(new Uint32Array(2)).join("");
    const message =
      "Welcome to TeraPepe (terapepe.xyz)\n\n" +
      "Sign this message to log in. This does not cost any gas and does not give access to your funds.\n\n" +
      "Wallet: " + account + "\n" +
      "Nonce: " + nonce + "\n" +
      "Issued At: " + new Date().toISOString();

    setMessage("Please sign the message in your wallet...");
    const signature = await signer.signMessage(message);
    const recovered = ethers.verifyMessage(message, signature);

    if (recovered.toLowerCase() !== account.toLowerCase()) {
      throw new Error("Signature does not match the connected wallet.");
    }

    sessionStorage.setItem(sessionKey(account), "1");
    setSignedIn(true);
    setMessage("Signed in successfully.", "success");
  } catch (err) {
    el.signBtn.disabled = false;
    if (err && (err.code === 4001 || err.code === "ACTION_REJECTED")) {
      setMessage("Signature request was rejected.", "error");
    } else {
      setMessage("Sign-in failed: " + (err.shortMessage || err.message || err), "error");
    }
  }
}

function disconnect() {
  if (account) sessionStorage.removeItem(sessionKey(account));
  resetState();
  setMessage("Disconnected. To fully revoke access, disconnect this site inside your wallet.");
}

// ---------- Token balance ----------
function formatAmount(str) {
  const n = Number(str);
  if (!isFinite(n)) return str;
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

async function checkTokenBalance() {
  if (!provider || !account) return;

  const tokenAddress = el.tokenInput.value.trim();
  if (!ethers.isAddress(tokenAddress)) {
    setMessage("Please enter a valid token contract address (0x...).", "error");
    return;
  }

  try {
    el.checkBtn.disabled = true;
    el.tokenBal.textContent = "Loading...";
    setMessage("");

    const code = await provider.getCode(tokenAddress);
    if (code === "0x") {
      throw new Error("No contract found at this address on the current network.");
    }

    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [raw, decimals, symbol] = await Promise.all([
      token.balanceOf(account),
      token.decimals(),
      token.symbol().catch(() => "TOKEN")
    ]);

    el.tokenBal.textContent = formatAmount(ethers.formatUnits(raw, decimals)) + " " + symbol;
  } catch (err) {
    el.tokenBal.textContent = "-";
    setMessage("Could not read token balance: " + (err.shortMessage || err.message || err), "error");
  } finally {
    el.checkBtn.disabled = false;
  }
}

// ---------- Events ----------
el.connectBtn.addEventListener("click", () => {
  if (!account) connectWallet();
});
el.signBtn.addEventListener("click", signIn);
el.disconnectBtn.addEventListener("click", disconnect);
el.checkBtn.addEventListener("click", checkTokenBalance);
el.tokenInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkTokenBalance();
});

if (window.ethereum) {
  window.ethereum.on("accountsChanged", async (accounts) => {
    if (!accounts || accounts.length === 0) {
      resetState();
      setMessage("Wallet disconnected.");
    } else if (provider) {
      el.tokenBal.textContent = "-";
      await loadAccount(accounts[0]);
    }
  });

  window.ethereum.on("chainChanged", async () => {
    if (!provider || !account) return;
    provider = new ethers.BrowserProvider(window.ethereum);
    el.tokenBal.textContent = "-";
    await loadAccount(account);
    setMessage("Network changed.");
  });
}
