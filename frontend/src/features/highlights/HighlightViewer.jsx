import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MODES } from "./ModeConfig";
import { motion, AnimatePresence } from "framer-motion";

export default function HighlightViewer({ open, items, index, onClose, onNext, onPrev, mode }) {
  const item = items?.[index];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open || !item) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => Math.min(100, p + 2));
    }, 80);
    return () => clearInterval(interval);
  }, [open, item]);

  if (!open || !item) return null;
  const accent = MODES[mode]?.accent || "#3B82F6";

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/90 text-slate-50 flex flex-col md:hidden">
      <div className="p-3 flex items-center justify-between">
        <button onClick={onClose} className="px-3 py-1 text-sm rounded-full bg-slate-800">Cerrar</button>
        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="px-2 py-1 rounded-full bg-slate-800">◀</button>
          <button onClick={onNext} className="px-2 py-1 rounded-full bg-slate-800">▶</button>
        </div>
      </div>
      <div className="px-3">
        <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: accent }} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col items-center justify-center px-4 text-center space-y-3"
        >
          <div
            className="w-64 h-96 rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 shadow-lg"
            style={{ boxShadow: `0 0 0 2px ${accent}22` }}
          >
            {item.thumbUrl ? (
              <img src={item.thumbUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">Preview</div>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold">{item.title}</div>
            <div className="text-xs text-slate-400">por {item.authorName}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
