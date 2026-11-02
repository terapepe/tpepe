"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Footer from "./Footer";
import ConnectModal from "./ConnectModal";

export default function Shell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [connect, setConnect] = useState(false);

  return (
    <div className="app">
      <a href="#main" className="skip">Skip to content</a>
      <Sidebar open={menu} onClose={() => setMenu(false)} />
      <div className="stage">
        <Topbar onMenu={() => setMenu(true)} onConnect={() => setConnect(true)} />
        <main id="main" className="main">{children}</main>
        <Footer />
      </div>
      <ConnectModal open={connect} onClose={() => setConnect(false)} />
    </div>
  );
}
