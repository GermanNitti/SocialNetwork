import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SplashLogo from "../components/SplashLogo";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(identifier, password);
      setShowSplash(true);
      setTimeout(() => {
        navigate("/feed");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <SplashLogo visible={showSplash} />
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-2xl p-8 w-full max-w-md relative z-10">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-1">Bienvenido</h1>
        <p className="text-sm text-slate-500 mb-6">Inicia sesión para ver el feed.</p>
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email o @username</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-400 focus:outline-none"
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || showSplash}
            className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="text-sm text-center text-slate-500 mt-4">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-indigo-700 dark:text-indigo-300 font-semibold">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}



