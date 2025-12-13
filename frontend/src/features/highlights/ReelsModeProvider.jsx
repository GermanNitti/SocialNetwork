import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CHAOS_DURATION_MS, MODE_ORDER } from "./ModeConfig";

const ReelsModeContext = createContext(null);
const STORAGE_KEY = "reels-mode";

export function ReelsModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return stored && stored !== "CAOS" ? stored : "CERCA";
  });
  const [prevMode, setPrevMode] = useState("CERCA");
  const [chaosEndsAt, setChaosEndsAt] = useState(null);
  const chaosTimerRef = useRef(null);

  const updateMode = useCallback((nextMode) => {
    if (nextMode === "CAOS") {
      setPrevMode((m) => (m === "CAOS" ? "CERCA" : m));
      setMode("CAOS");
      const expires = Date.now() + CHAOS_DURATION_MS;
      setChaosEndsAt(expires);
      if (chaosTimerRef.current) clearTimeout(chaosTimerRef.current);
      chaosTimerRef.current = setTimeout(() => {
        setMode((m) => (m === "CAOS" ? prevMode : m));
        setChaosEndsAt(null);
      }, CHAOS_DURATION_MS);
    } else {
      setMode(nextMode);
      setChaosEndsAt(null);
      if (chaosTimerRef.current) {
        clearTimeout(chaosTimerRef.current);
        chaosTimerRef.current = null;
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, nextMode);
      }
    }
  }, [prevMode]);

  useEffect(() => {
    if (mode !== "CAOS" && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      if (chaosTimerRef.current) clearTimeout(chaosTimerRef.current);
    };
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode: updateMode,
      chaosEndsAt,
      isChaos: mode === "CAOS",
      prevMode,
      setPrevMode,
    }),
    [mode, updateMode, chaosEndsAt, prevMode]
  );

  return <ReelsModeContext.Provider value={value}>{children}</ReelsModeContext.Provider>;
}

export function useReelsMode() {
  const ctx = useContext(ReelsModeContext);
  if (!ctx) throw new Error("useReelsMode debe usarse dentro de ReelsModeProvider");
  return ctx;
}
