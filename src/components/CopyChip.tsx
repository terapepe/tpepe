"use client";

import { useState } from "react";
import Icon from "./Icon";

export default function CopyChip({ value, label = "Contract" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  const live = value.startsWith("0x") && value.length > 6;
  const short = value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {}
  }

  return (
    <div className="chip-wrap">
      <div className="chip">
        <span className="chip-label">{label}</span>
        <code className="chip-value" title={value}>
          <span className="ca-full">{value}</span>
          <span className="ca-short">{short}</span>
        </code>
        <button type="button" className="chip-btn" onClick={copy} aria-label={done ? "Copied" : "Copy contract address"}>
          <Icon name={done ? "check" : "copy"} size={16} />
          <span>{done ? "Copied" : live ? "Copy" : "Soon"}</span>
        </button>
      </div>
    </div>
  );
}
