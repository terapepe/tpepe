"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, SOCIAL, TOKEN } from "@/lib/config";
import Icon from "./Icon";
import Logo from "./Logo";

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <div className={`scrim ${open ? "show" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Main navigation">
        <Link href="/" className="brand" onClick={onClose}>
          <Logo size={56} />
          <span className="brand-text">
            TeraPepe
            <small>${TOKEN.ticker}</small>
          </span>
        </Link>

        <nav className="nav">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`nav-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <a className="side-x" href={SOCIAL.x.url} target="_blank" rel="noopener noreferrer">
          <Icon name="x" size={16} />
          <span>@{SOCIAL.x.handle}</span>
        </a>
      </aside>
    </>
  );
}
