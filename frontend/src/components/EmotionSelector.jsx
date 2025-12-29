import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EMOTIONS, EMOTION_MODES } from "../constants/emotions";

export default function EmotionSelector({ currentMode, currentEmotion, currentEmotionColor, onSave, onCancel }) {
  const [mode, setMode] = useState(currentMode || EMOTION_MODES.AUTO);
  const [selectedEmotion, setSelectedEmotion] = useState(currentEmotion || null);

  const handleSave = () => {
    const emotionData = EMOTIONS.find(e => e.emotion === selectedEmotion);
    onSave({
      mode,
      manualEmotion: selectedEmotion,
      manualEmotionColor: emotionData?.color || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Configurar emoción del avatar
            </h2>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Modo de emoción
              </label>

              <div className="space-y-2">
                <button
                  onClick={() => setMode(EMOTION_MODES.AUTO)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    mode === EMOTION_MODES.AUTO
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white">Automático</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    La emoción cambia según tus posts más recientes
                  </div>
                </button>

                <button
                  onClick={() => setMode(EMOTION_MODES.MANUAL)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    mode === EMOTION_MODES.MANUAL
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white">Manual</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Elige una emoción fija para tu avatar
                  </div>
                </button>

                <button
                  onClick={() => setMode(EMOTION_MODES.HIDDEN)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    mode === EMOTION_MODES.HIDDEN
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white">Oculto</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Sin emoción visible, efecto simple del tema
                  </div>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {mode === EMOTION_MODES.MANUAL && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-4"
                >
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Elige tu emoción
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {EMOTIONS.map((emotion) => (
                      <button
                        key={emotion.emotion}
                        onClick={() => setSelectedEmotion(emotion.emotion)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedEmotion === emotion.emotion
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                        style={{
                          ...(selectedEmotion === emotion.emotion ? { borderColor: emotion.color } : {}),
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full mx-auto mb-2"
                          style={{ backgroundColor: emotion.color }}
                        />
                        <div className="text-xs font-medium text-slate-900 dark:text-white">
                          {emotion.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={mode === EMOTION_MODES.MANUAL && !selectedEmotion}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
