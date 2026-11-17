// Renders js/config.js (already synced with hybot) into the page
(function () {
  var C = window.TPEPE_CONFIG;
  var T = C.token.ticker;
  var single = C.mode !== "multi";
  var ids = single ? [C.singleNetwork] : C.multiOrder;
  var caOf = function (id) { var n = C.networks[id]; return (n.ca || (id === "solana" ? C.token.sol : C.token.evm) || "").trim(); };
  var buyOf = function (id) { var ca = caOf(id), b = C.networks[id].buy; return ca && b ? b.replace("{ca}", ca) : (ca ? "https://dexscreener.com/" + C.networks[id].chart + "/" + ca : ""); };
  var names = ids.map(function (id) { return C.networks[id].name; });
  var label = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0];
  var live = ids.some(caOf);
  var xHandle = (C.social.x || "").replace(/\/+$/, "").split("/").pop();
  var set = function (k, v) { document.querySelectorAll('[data-t="' + k + '"]').forEach(function (e) { e.textContent = v; }); };
  var ext = function (a, href) { a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; };

  set("ticker", T); set("name", C.token.name); set("networks", label);
  set("networksLong", single ? C.networks[ids[0]].name + ". " + C.networks[ids[0]].tagline + "." : label + ". EVM chains share one contract address; Solana has its own.");
  set("xHandle", xHandle ? "@" + xHandle : "");
  document.title = C.token.name + " ($" + T + ") — Make every new memecoin ripple";
  document.querySelector("[data-year]").textContent = new Date().getFullYear();

  var tag = document.querySelector("[data-chain-tag]");
  if (single) { var n0 = C.networks[ids[0]]; tag.querySelector("span").textContent = n0.name + " · " + n0.tagline; document.documentElement.style.setProperty("--chain", n0.color); }
  else tag.style.display = "none";

  var buy = ids.map(buyOf).filter(Boolean)[0];
  document.querySelectorAll("[data-buy]").forEach(function (a) { if (buy) ext(a, buy); else a.style.display = "none"; });
  var xa = document.querySelector("[data-x]");
  if (C.social.x && xHandle) ext(xa, C.social.x); else xa.style.display = "none";

  // CA chips + facts (click to copy)
  var chips = document.querySelector("[data-ca-chips]"), facts = document.querySelector("[data-ca-facts]");
  ids.forEach(function (id) {
    var n = C.networks[id], ca = caOf(id);
    var c = document.createElement("span");
    c.className = "chip" + (ca ? "" : " tba");
    c.innerHTML = "<b>" + n.short + "</b><span>" + (ca ? ca.slice(0, 6) + "…" + ca.slice(-4) : "CA coming soon") + "</span>";
    if (ca) { c.title = "Copy " + ca; c.onclick = function () { navigator.clipboard && navigator.clipboard.writeText(ca); var s = c.querySelector("span"), o = s.textContent; s.textContent = "Copied ✓"; setTimeout(function () { s.textContent = o; }, 1300); }; }
    chips.appendChild(c);
    var line = document.createElement("div");
    line.innerHTML = ids.length > 1 ? n.name + ": " : "";
    if (ca) { var a = document.createElement("a"); ext(a, n.explorer + ca); a.textContent = ca; line.appendChild(a); } else line.append("Coming soon");
    facts.appendChild(line);
  });
  var where = document.querySelector("[data-where]");
  var buys = ids.filter(buyOf);
  if (buys.length) buys.forEach(function (id, i) { if (i) where.append(" · "); var a = document.createElement("a"); ext(a, buyOf(id)); a.textContent = new URL(buyOf(id)).hostname.replace("app.", "") + " (" + C.networks[id].name + ")"; where.appendChild(a); });
  else where.textContent = "Posted on X when the token is live";
  if (live) {
    document.querySelector("[data-live-line]").textContent = T + " token live on " + label;
    document.querySelector("[data-live-faq]").textContent = "Yes. $" + T + " is live on " + label + ". Campaigns, share quests, auctions and the launchpad are being built in stages.";
  }

  var soc = document.querySelector("[data-socials]");
  if (C.social.x && xHandle) { var a1 = document.createElement("a"); ext(a1, C.social.x); a1.textContent = "X @" + xHandle; soc.appendChild(a1); }
  if (C.social.telegram) { var a2 = document.createElement("a"); ext(a2, C.social.telegram); a2.textContent = "Telegram"; soc.appendChild(a2); }
})();
