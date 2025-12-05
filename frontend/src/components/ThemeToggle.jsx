import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ iconOnly = false }) {
  const { theme, toggleTheme } = useTheme();

  const baseClasses =
    "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition";

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={
        iconOnly
          ? `${baseClasses} h-10 w-10 rounded-full flex items-center justify-center text-lg`
          : `${baseClasses} px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2`
      }
      aria-label="Cambiar tema"
    >
      <span aria-hidden>{isDark ? "\u2600" : "\u{1F319}"}</span>
      {!iconOnly && <span>{isDark ? "Claro" : "Oscuro"}</span>}
    </button>
  );
}
