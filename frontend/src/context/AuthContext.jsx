import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import SplashLogo from "../components/SplashLogo";

const AuthContext = createContext(null);
const SPLASH_DURATION = 3000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(() => {
    // Si ya hay token guardado, no mostramos splash en recarga
    return localStorage.getItem("token") ? false : true;
  });
  const [splashSubtitle, setSplashSubtitle] = useState("SOCIAL EXPERIENCE");

  useEffect(() => {
    let timerRef = null;
    const initialize = async () => {
      if (!token) {
        // Mostrar intro inicial aunque no haya sesión
        setSplashSubtitle("SOCIAL EXPERIENCE");
        timerRef = setTimeout(() => setShowSplash(false), SPLASH_DURATION);
        setLoading(false);
        return;
      }
      // Mostrar el splash apenas detectamos token para evitar ver el feed antes del efecto
      // Si ya lo ocultamos por haber token en localStorage, no lo volvemos a mostrar
      if (!showSplash) {
        setLoading(false);
        try {
          const { data } = await api.get("/auth/me");
          setUser(data.user);
        } catch (error) {
          logout();
        }
        return;
      }
      setShowSplash(true);
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        setSplashSubtitle(
          data.user?.name
            ? `Bienvenido ${data.user.name}`
            : data.user?.username
              ? `Bienvenido ${data.user.username}`
              : "Bienvenido"
        );
        setTimeout(() => setShowSplash(false), SPLASH_DURATION);
      } catch (error) {
        setShowSplash(false);
        logout();
      } finally {
        setLoading(false);
      }
    };
    initialize();
    return () => {
      if (timerRef) clearTimeout(timerRef);
    };
  }, [token]);

  const login = async (identifier, password) => {
    const { data } = await api.post("/auth/login", { identifier, password });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    setSplashSubtitle(
      data.user?.name
        ? `Bienvenido ${data.user.name}`
        : data.user?.username
          ? `Bienvenido ${data.user.username}`
          : "Bienvenido"
    );
    setShowSplash(true);
    setTimeout(() => setShowSplash(false), SPLASH_DURATION);
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
    setSplashSubtitle(
      data.user?.name
        ? `Bienvenido ${data.user.name}`
        : data.user?.username
          ? `Bienvenido ${data.user.username}`
          : "Bienvenido"
    );
    setShowSplash(true);
    setTimeout(() => setShowSplash(false), SPLASH_DURATION);
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
      splashSubtitle,
      setSplashSubtitle,
    }),
    [user, token, loading, showSplash, splashSubtitle]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SplashLogo visible={showSplash} subtitle={splashSubtitle} />
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
