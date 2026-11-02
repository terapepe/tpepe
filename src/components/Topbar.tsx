"use client";

import { useChainId } from "wagmi";
import { evmChains } from "@/lib/chains";
import { short, useSession } from "@/lib/useSession";
import Icon from "./Icon";

export default function Topbar({ onMenu, onConnect }: { onMenu: () => void; onConnect: () => void }) {
  const s = useSession();
  const chainId = useChainId();
  const chain = evmChains.find((c) => c.id === chainId);
  const network = s.family === "solana" ? "Solana" : s.family === "evm" ? chain?.name ?? "Unsupported network" : null;

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">
        <Icon name="menu" />
      </button>
      <div className="topbar-right">
        {s.mounted && network && <span className="net-pill">{network}</span>}
        <button className="btn primary" onClick={onConnect}>
          <Icon name="wallet" size={18} />
          {s.mounted && s.address ? short(s.address) : "Connect wallet"}
        </button>
      </div>
    </header>
  );
}
