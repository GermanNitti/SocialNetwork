import { createContext, useContext, useMemo, useState } from "react";

const LightboxContext = createContext(null);

export function LightboxProvider({ children }) {
  const [media, setMedia] = useState(null);

  const open = (src, alt = "", options = {}) => {
    if (typeof src === "object" && src !== null) {
      setMedia(src);
    } else {
      setMedia({ src, alt, isVideo: options.isVideo || false });
    }
  };
  const close = () => setMedia(null);

  const value = useMemo(() => ({ media, open, close }), [media]);

  return <LightboxContext.Provider value={value}>{children}</LightboxContext.Provider>;
}

export function useLightbox() {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error("useLightbox debe usarse dentro de LightboxProvider");
  return ctx;
}
