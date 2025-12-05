import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const UserThemeContext = createContext(null);

export function UserThemeProvider({ children }) {
  const [themeData, setThemeData] = useState({ theme: null, decorations: [], customThemeSettings: {} });
  const [loading, setLoading] = useState(true);

  const fetchTheme = async () => {
    try {
      const { data } = await api.get("/theme/me");
      setThemeData(data);
    } catch (e) {
      setThemeData({ theme: null, decorations: [], customThemeSettings: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheme();
  }, []);

  const updateTheme = async (payload) => {
    await api.put("/theme/me", payload);
    await fetchTheme();
  };

  const value = useMemo(
    () => ({
      themeData,
      loading,
      updateTheme,
      refresh: fetchTheme,
    }),
    [themeData, loading]
  );

  return <UserThemeContext.Provider value={value}>{children}</UserThemeContext.Provider>;
}

export function useUserTheme() {
  const ctx = useContext(UserThemeContext);
  if (!ctx) throw new Error("useUserTheme debe usarse dentro de UserThemeProvider");
  return ctx;
}
