import { Fragment } from "react";
import { createPortal } from "react-dom";
import { MODES, MODE_ORDER } from "./ModeConfig";
import { useReelsMode } from "./ReelsModeProvider";

export default function ModePicker({ open, onClose }) {
  const { mode, setMode, chaosEndsAt } = useReelsMode();
  if (!open) return null;

  const DESCRIPTIONS = {
    CERCA: "Amigos, familia y círculos.",
    DESCUBRIR: "Gente/ideas fuera de tu burbuja.",
    AHORA: "Lo reciente y lo que está pasando.",
    PROFUNDO: "Lecturas e hilos con sustancia.",
    CALMA: "Contenido liviano, cero bardo.",
    HUMOR: "Memes y ocurrencias bien a tu gusto.",
    APRENDER: "Tips, guías y data aplicable.",
    CAOS: "Mezcla sin freno, algoritmo estándar (10 min).",
  };

  const body = (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm md:hidden"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-slate-900 text-slate-50 rounded-t-2xl p-4 border-t border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Modo de highlights</h3>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded-full bg-slate-800">Cerrar</button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {MODE_ORDER.map((key) => {
            const m = MODES[key];
            const active = mode === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setMode(key);
                  onClose?.();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition ${
                  active
                    ? "border-indigo-400 bg-indigo-500/10"
                    : "border-slate-800 bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-8 w-8 rounded-full"
                    style={{ background: m.accent }}
                  />
                  <div>
                    <div className="text-sm font-semibold">{m.label}</div>
                    <div className="text-[12px] text-slate-400">{DESCRIPTIONS[key]}</div>
                  </div>
                </div>
                {active && <span className="text-[10px] uppercase text-indigo-300 font-semibold">Activo</span>}
              </button>
            );
          })}
        </div>
        {mode === "CAOS" && chaosEndsAt && (
          <div className="mt-3 text-xs text-rose-300">
            CAOS termina en: {Math.max(0, chaosEndsAt - Date.now()) / 1000 | 0}s
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
