import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const LITE_KEY = "jetkiz-lite";

interface ModeApi {
  lite: boolean;
  setLite: (v: boolean) => void;
}

const ModeContext = createContext<ModeApi | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [lite, setLiteState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LITE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const setLite = useCallback((v: boolean) => {
    setLiteState(v);
    try {
      localStorage.setItem(LITE_KEY, v ? "1" : "0");
    } catch {
      // storage unavailable — mode lives in memory
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.lite = lite ? "true" : "false";
  }, [lite]);

  const value = useMemo(() => ({ lite, setLite }), [lite, setLite]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeApi {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}