window.TPEPE_CONFIG = {
  token: {
    name: "TeraPepe",
    ticker: "TPEPE",
    evm: "", // EVM CA (shared by Robinhood / Base / BSC)
    sol: "",
  },
  domain: "terapepe.xyz",
  social: {
    x: "",        // e.g. "https://x.com/terapepe" — hidden while empty
    telegram: "",
  },

  mode: "single", // single | multi
  singleNetwork: "base",
  multiOrder: ["solana", "robinhood", "base", "bsc"],

  networks: {
    robinhood: { name: "Robinhood Chain", short: "RH", color: "#CCFF00", tagline: "Fast, low-fee L2 built for trading", explorer: "https://robinhoodchain.blockscout.com/token/", buy: "", chart: "robinhood", ca: "" },
    solana: { name: "Solana", short: "SOL", color: "#9945FF", tagline: "Lightning-fast and meme-native", explorer: "https://solscan.io/token/", buy: "https://jup.ag/swap/SOL-{ca}", chart: "solana", ca: "" },
    base: { name: "Base", short: "BASE", color: "#0052FF", tagline: "Onchain with the Base community", explorer: "https://basescan.org/token/", buy: "https://app.uniswap.org/swap?chain=base&outputCurrency={ca}", chart: "base", ca: "" },
    bsc: { name: "BNB Chain", short: "BSC", color: "#F0B90B", tagline: "Degen energy on BNB Chain", explorer: "https://bscscan.com/token/", buy: "https://pancakeswap.finance/swap?chain=bsc&outputCurrency={ca}", chart: "bsc", ca: "" },
  },
};

/* ---- hybot sync: CA, token name, symbol, X and Telegram follow the newest token hybot launched for this site ----
   https://hybot.xyz/api/site-token?site=<domain> · values above are the fallback when hybot has none / is unreachable.
   Links in the page that point to the old X / Telegram are updated, or hidden when the launched token has none. */
(function (C) {
  if (!C || typeof window === "undefined") return;
  var DOMAIN = "terapepe.xyz";
  var host = String(location.hostname || "").replace(/^www\./, "");
  var site = /\./.test(host) && !/(^|\.)(vercel\.app|localhost|127\.0\.0\.1)$/.test(host) ? host : DOMAIN;
  if (!site) return;
  var d = null, key = "hybot:" + site;
  try { var c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 60000) d = c.d; } catch (e) {}
  if (!d) {
    try {
      var x = new XMLHttpRequest();
      x.open("GET", "https://hybot.xyz/api/site-token?site=" + encodeURIComponent(site), false); // sync: config must be ready before the app scripts run
      x.send();
      if (x.status === 200) { d = JSON.parse(x.responseText); try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
    } catch (e) {}
  }
  if (!d || !d.found || !/^0x[0-9a-fA-F]{40}$/.test(d.ca || "")) return;
  var handle = function (u) { var m = String(u || "").match(/(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})|^@?([A-Za-z0-9_]{1,15})$/); return m ? (m[1] || m[2]) : ""; };
  var tgName = function (u) { var m = String(u || "").match(/t\.me\/([\w+/-]+)/); return m ? m[1].replace(/\/+$/, "") : String(u || "").replace(/^@/, ""); };
  var X0 = C.social && C.social.x || "", TG0 = C.social && C.social.telegram || "";
  var oldX = handle(X0), oldTg = tgName(TG0);
  var X = d.x || "", TG = d.telegram || "", SYM = d.symbol, NAME = d.name, CA = d.ca;
  // no X / Telegram on the launched token → config keeps the old link so the app renders as usual, and the link fixer below hides it
  var XV = X || X0, TGV = TG || TG0, XH = handle(XV);
  // single-network per-chain CA overrides would win over the shared address → clear them
  var net = C.singleNetwork || C.singleChain || (C.token && C.token.singleNetwork);
  [C.networks, C.chains, C.token && C.token.chains].forEach(function (m) { if (m && net && m[net] && "ca" in m[net]) m[net].ca = ""; });
  C.token.name = NAME; C.token.ticker = SYM; C.token.evm = CA;
  if (C.mode !== "multi") { C.singleNetwork = "robinhood"; C.networks.robinhood.ca = ""; } // hybot launches on Robinhood Chain
  C.social.x = XV; C.social.telegram = TGV;
  // page links still pointing to the old X / Telegram (hard-coded or rendered later)
  var fix = function (root) {
    var as = root.querySelectorAll ? root.querySelectorAll("a[href]") : [];
    for (var i = 0; i < as.length; i++) {
      var a = as[i], h = a.getAttribute("href") || "";
      if (oldX && new RegExp("(x|twitter)\\.com/@?" + oldX + "(?![A-Za-z0-9_])", "i").test(h) && !/intent|share/i.test(h)) {
        if (X) { if (h !== X) { a.href = X; if (XH && oldX !== XH) a.innerHTML = a.innerHTML.split("@" + oldX).join("@" + XH); } }
        else a.style.display = "none";
      } else if (oldTg && /t\.me\//i.test(h) && tgName(h).toLowerCase() === oldTg.toLowerCase()) {
        if (TG) { if (h !== TG) a.href = TG; } else a.style.display = "none";
      }
    }
  };
  var start = function () { fix(document); new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { fix(n); if (n.matches && n.matches("a[href]")) fix(n.parentNode || n); } }); }); }).observe(document.documentElement, { childList: true, subtree: true }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})(window.TPEPE_CONFIG);
