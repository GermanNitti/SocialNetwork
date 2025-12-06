import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import SplashLogo from "../components/SplashLogo";

const AuthContext = createContext(null);
const SPLASH_DURATION = 3000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      // Mostrar el splash apenas detectamos token para evitar ver el feed antes del efecto
      setShowSplash(true);
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        setTimeout(() => setShowSplash(false), SPLASH_DURATION);
      } catch (error) {
        setShowSplash(false);
        logout();
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [token]);

  const login = async (identifier, password) => {
    const { data } = await api.post("/auth/login", { identifier, password });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async ({ name, username, email, password }) => {
    const { data } = await api.post("/auth/register", {
      name,
      username,
      email,
      password,
    });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setShowSplash(false);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      setUser,
      showSplash,
      setShowSplash,
    }),
    [user, token, loading, showSplash]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SplashLogo visible={showSplash} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return ctx;
}
