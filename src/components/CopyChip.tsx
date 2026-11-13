"use client";

import { useState } from "react";
import Icon from "./Icon";

export default function CopyChip({ value: raw, label = "Contract", color, href }: { value: string; label?: string; color?: string; href?: string }) {
  const [done, setDone] = useState(false);
  const live = raw.length > 20;
  const value = live ? raw : "Coming soon";

  async function copy() {
    if (!live) return;
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {}
  }

  return (
    <div className="chip-wrap">
      <div className="chip" style={color ? ({ ["--net" as string]: color } as React.CSSProperties) : undefined}>
        <span className="chip-label">{label}</span>
        <code className="chip-value" title={value}>{value}</code>
        <button type="button" className="chip-btn" onClick={copy} aria-label={done ? "Copied" : "Copy contract address"}>
          <Icon name={done ? "check" : "copy"} size={16} />
          <span>{done ? "Copied" : live ? "Copy CA" : "Soon"}</span>
        </button>
        {live && href && (
          <a className="chip-btn ghost" href={href} target="_blank" rel="noopener noreferrer" aria-label="View on explorer">
            <Icon name="arrow" size={16} />
            <span>Explorer</span>
          </a>
        )}
      </div>
    </div>
  );
}
