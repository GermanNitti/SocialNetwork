import { useState } from "react";
import { usePreferences } from "../context/PreferencesContext";

export default function Settings() {
  const { preferences, savePreferences } = usePreferences();
  const [cardStyle, setCardStyle] = useState(() => preferences?.cardStyle || { rounded: 16, glass: true });
  const [theme, setTheme] = useState(() => preferences?.theme || "light");
  const [status, setStatus] = useState("");

  const handleSave = async () => {
    await savePreferences({ cardStyle, theme });
    setStatus("Guardado");
    setTimeout(() => setStatus(""), 1500);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Personaliza tu experiencia</h1>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Radio de borde (cards)</label>
        <input
          type="range"
          min="8"
          max="32"
          value={cardStyle.rounded ?? 16}
          onChange={(e) => setCardStyle((prev) => ({ ...prev, rounded: Number(e.target.value) }))}
          className="w-full"
        />
        <div className="text-sm text-slate-500">{cardStyle.rounded ?? 16}px</div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={cardStyle.glass ?? true}
          onChange={(e) => setCardStyle((prev) => ({ ...prev, glass: e.target.checked }))}
        />
        <span className="text-sm text-slate-700 dark:text-slate-200">Efecto glass</span>
      </div>
      <button
        onClick={handleSave}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
      >
        Guardar preferencias
      </button>
      {status && <div className="text-green-600 text-sm">{status}</div>}
      <div
        className="p-4 border border-slate-200 dark:border-slate-800"
        style={{
          borderRadius: `${cardStyle.rounded ?? 16}px`,
          background: cardStyle.glass ? "rgba(255,255,255,0.7)" : undefined,
          backdropFilter: cardStyle.glass ? "blur(6px)" : undefined,
        }}
      >
        Vista previa de card personalizada
      </div>
    </div>
  );
}
