"use client";

import { createContext, useContext } from "react";

/** Opens the wallet modal from anywhere inside <Shell>. */
export const ConnectModalContext = createContext<() => void>(() => {});
export const useOpenConnect = () => useContext(ConnectModalContext);
