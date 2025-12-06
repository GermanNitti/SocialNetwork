import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SplashLogo from "../components/SplashLogo";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      setShowSplash(true);
      setTimeout(() => {
        navigate("/feed");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <SplashLogo visible={showSplash} />
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-2xl p-8 w-full max-w-md relative z-10">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-1">Crear cuenta</h1>
        <p className="text-sm text-slate-500 mb-6">Únete y comparte tus ideas.</p>
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre completo</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-400 focus:outline-none"
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">@username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-400 focus:outline-none"
              placeholder="usuario"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-400 focus:outline-none"
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
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
            {loading ? "Creando cuenta..." : "Registrarme"}
          </button>
        </form>
        <p className="text-sm text-center text-slate-500 mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-indigo-700 dark:text-indigo-300 font-semibold">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}


