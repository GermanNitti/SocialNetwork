import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MODES } from "./ModeConfig";
import { motion, AnimatePresence } from "framer-motion";

const REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍", "🐐", "🔥"];

export default function HighlightViewer({ open, items, index, onClose, mode }) {
  const [activeIndex, setActiveIndex] = useState(index || 0);
  const [isCommentsOpen, setCommentsOpen] = useState(false);
  const [isReactionsOpen, setReactionsOpen] = useState(false);
  const [isPaused, setPaused] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const touchDelta = useRef({ x: 0, y: 0 });
  const [direction, setDirection] = useState(0); // -1 left, 1 right

  useEffect(() => {
    if (open) setActiveIndex(index || 0);
  }, [open, index]);

  const item = items?.[activeIndex];
  const accent = MODES[mode]?.accent || "#3B82F6";
  const thumb = item?.thumbUrl || item?.thumbnail || item?.imageUrl;
  useEffect(() => {
    setVideoReady(false);
    setPaused(false);
  }, [activeIndex]);
  useEffect(() => {
    if (open) {
      setDirection(0);
      setActiveIndex(index || 0);
    }
  }, [open, index]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPaused) video.pause();
    else video.play().catch(() => {});
  }, [isPaused, activeIndex]);

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    touchDelta.current = { x: 0, y: 0 };
  };

  const handleTouchMove = (e) => {
    const t = e.touches[0];
    touchDelta.current = {
      x: t.clientX - touchStart.current.x,
      y: t.clientY - touchStart.current.y,
    };
  };

  const handleTouchEnd = () => {
    const { x, y } = touchDelta.current;
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    if (absX > 60 && absX > absY) {
      if (x < 0) {
        // next
        setDirection(-1);
        setActiveIndex((i) => (i + 1) % items.length);
      } else {
        setDirection(1);
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
      }
      setCommentsOpen(false);
      setReactionsOpen(false);
      return;
    }
    if (absY > 60 && absY > absX) {
      if (y < 0) {
        // swipe up
        setCommentsOpen(true);
        setReactionsOpen(false);
        return;
      }
      if (y > 80) {
        onClose?.();
        return;
      }
    }
  };

  if (!open || !item) return null;

  const handleTap = () => {
    if (isCommentsOpen || isReactionsOpen) {
      setCommentsOpen(false);
      setReactionsOpen(false);
    } else {
      setPaused((p) => !p);
    }
  };

  const cards = useMemo(() => items || [], [items]);

  const variants = {
    enter: (dir) =>
      dir === 0
        ? { x: 0, opacity: 1 }
        : { x: dir > 0 ? "-100%" : "100%", opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-950 text-slate-50 flex flex-col md:hidden overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={item.id ?? activeIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
          className="flex-1 relative"
          onClick={handleTap}
        >
          {(() => {
            const isPlayableVideo =
              item?.type === "video" &&
              typeof item?.url === "string" &&
              /\.(mp4|webm|ogg)(\?.*)?$/i.test(item.url);
            return (
              <div className="absolute inset-0 bg-slate-900 z-0">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={item.title || "Reel"}
                    className="w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-900">
                    Highlight
                  </div>
                )}

                {isPlayableVideo && (
                  <video
                    ref={videoRef}
                    src={item.url}
                    muted
                    loop
                    playsInline
                    autoPlay
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{ opacity: videoReady ? 1 : 0 }}
                    onCanPlay={() => setVideoReady(true)}
                    onError={() => setVideoReady(false)}
                    poster={thumb}
                  />
                )}
              </div>
            );
          })()}
          {/* Gradient for text/readability */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between">
            <div className="text-left space-y-1">
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="text-xs text-slate-200">por {item.authorName}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCommentsOpen(true);
                  setReactionsOpen(false);
                }}
                className="px-3 py-1 rounded-full bg-black/60 text-xs font-semibold border border-white/10"
              >
                Comentarios
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setReactionsOpen((v) => !v);
                  setCommentsOpen(false);
                }}
                className="h-10 w-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-xl"
              >
                🙂
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isReactionsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-20 right-4 z-30 flex flex-col gap-2 bg-black/70 border border-white/10 rounded-2xl p-2"
              >
                {REACTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={(e) => {
                      e.stopPropagation();
                      setReactionsOpen(false);
                    }}
                    className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-xl"
                  >
                    {r}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "40%" }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 z-40 bg-slate-900 rounded-t-3xl border-t border-slate-800 p-4 flex flex-col"
            style={{ height: "60%" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Comentarios</div>
              <button
                onClick={() => setCommentsOpen(false)}
                className="text-xs px-3 py-1 rounded-full bg-slate-800"
              >
                Cerrar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 text-sm text-slate-100">
              <div className="bg-slate-800/70 rounded-xl p-2">Próximamente comentarios reales...</div>
              <div className="bg-slate-800/70 rounded-xl p-2">Deja tu opinión cuando esté integrado.</div>
            </div>
            <div className="mt-3">
              <input
                className="w-full rounded-full bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                placeholder="Escribe un comentario..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
