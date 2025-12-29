import { useState } from "react";
import { usePreferences } from "../context/PreferencesContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import EmotionSelector from "../components/EmotionSelector";
import { EMOTION_MODES } from "../constants/emotions";

export default function Settings() {
  const { preferences, savePreferences } = usePreferences();
  const queryClient = useQueryClient();
  const [cardStyle, setCardStyle] = useState(() => preferences?.cardStyle || { rounded: 16, glass: true });
  const [theme, setTheme] = useState(() => preferences?.theme || "light");
  const [status, setStatus] = useState("");
  const [showEmotionSelector, setShowEmotionSelector] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      return data.user;
    },
  });

  const updateEmotionMode = useMutation({
    mutationFn: async ({ mode, manualEmotion, manualEmotionColor }) => {
      const { data } = await api.put("/users/me/emotion-mode", {
        emotionMode: mode,
        manualEmotion,
        manualEmotionColor,
      });
      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setShowEmotionSelector(false);
      setStatus("Emoción actualizada");
      setTimeout(() => setStatus(""), 1500);
    },
    onError: () => {
      setStatus("Error al actualizar emoción");
      setTimeout(() => setStatus(""), 2000);
    },
  });

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

      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-3">Emoción del avatar</h2>
        <div className="space-y-3">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Modo actual:{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {currentUser?.emotionMode === "manual"
                ? "Manual"
                : currentUser?.emotionMode === "hidden"
                ? "Oculto"
                : "Automático"}
            </span>
          </div>
          {currentUser?.emotionMode === "manual" && currentUser?.manualEmotion && (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: currentUser.manualEmotionColor }}
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                {currentUser.manualEmotion}
              </span>
            </div>
          )}
          <button
            onClick={() => setShowEmotionSelector(true)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Configurar emoción
          </button>
        </div>
      </div>

      {showEmotionSelector && (
        <EmotionSelector
          currentMode={currentUser?.emotionMode || EMOTION_MODES.AUTO}
          currentEmotion={currentUser?.manualEmotion || null}
          currentEmotionColor={currentUser?.manualEmotionColor || null}
          onSave={({ mode, manualEmotion, manualEmotionColor }) => {
            updateEmotionMode.mutate({ mode, manualEmotion, manualEmotionColor });
          }}
          onCancel={() => setShowEmotionSelector(false)}
        />
      )}

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
