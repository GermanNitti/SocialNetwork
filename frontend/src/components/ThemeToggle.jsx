import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
    </button>
  );
}
