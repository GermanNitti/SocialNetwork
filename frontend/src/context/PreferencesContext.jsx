import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "./AuthContext";

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setPreferences(null);
      return;
    }
    setLoading(true);
    api
      .get("/preferences")
      .then(({ data }) => setPreferences(data || {}))
      .catch(() => setPreferences({}))
      .finally(() => setLoading(false));
  }, [user]);

  const savePreferences = async (prefs) => {
    const { data } = await api.put("/preferences", prefs);
    setPreferences(data);
    return data;
  };

  const value = useMemo(
    () => ({ preferences, loading, savePreferences }),
    [preferences, loading]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences debe usarse dentro de PreferencesProvider");
  return ctx;
}
