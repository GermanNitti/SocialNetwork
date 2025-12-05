import { createContext, useContext, useMemo, useState } from "react";

const LightboxContext = createContext(null);

export function LightboxProvider({ children }) {
  const [image, setImage] = useState(null);

  const open = (src, alt = "") => setImage({ src, alt });
  const close = () => setImage(null);

  const value = useMemo(() => ({ image, open, close }), [image]);

  return <LightboxContext.Provider value={value}>{children}</LightboxContext.Provider>;
}

export function useLightbox() {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error("useLightbox debe usarse dentro de LightboxProvider");
  return ctx;
}
