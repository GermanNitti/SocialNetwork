import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue } from "framer-motion";
import { MODES } from "./ModeConfig";
import { REACTIONS, REACTION_ORDER } from "../../constants/reactions";

export default function HighlightViewer({
  open,
  items = [],
  index = 0,
  onClose,
  mode,
}) {
  const [activeIndex, setActiveIndex] = useState(index);
  const [videoReady, setVideoReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  const [userReaction, setUserReaction] = useState(null);
  const [reactionCounts, setReactionCounts] = useState({});
  const [reactionCache, setReactionCache] = useState({});

  // 🔥 motion value para tracking real
  const x = useMotionValue(0);

  const item = items[activeIndex];
  const itemId = item?.id;
  const accent = MODES[mode]?.accent || "#3B82F6";

  const formatCount = (num) => {
    if (num > 9999) return `${(num / 1000).toFixed(1)}mil`;
    return num;
  };

  useEffect(() => {
    if (open) setActiveIndex(index);
  }, [open, index]);

  useEffect(() => {
    if (!itemId) return;

    setVideoReady(false);
    setIsPaused(false);
    setProgress(0);

    const cached = reactionCache[itemId];
    if (cached) {
      setUserReaction(cached.userReaction);
      setReactionCounts(cached.reactions);
    } else {
      setUserReaction(null);
      setReactionCounts({});
    }
  }, [itemId]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoReady) return;

    if (isPaused) v.pause();
    else v.play().catch(() => {});
  }, [isPaused, videoReady]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const showStatusIndicator = useCallback(() => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    setShowStatus(true);
    statusTimeoutRef.current = setTimeout(() => setShowStatus(false), 800);
  }, []);

  const togglePlayPause = useCallback(
    (e) => {
      e.stopPropagation();
      setIsPaused((prev) => !prev);
      showStatusIndicator();
    },
    [showStatusIndicator]
  );

  const handleTimeUpdate = useCallback((e) => {
    const video = e.target;
    if (!video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  const handleReaction = useCallback(
    (e, type) => {
      e.stopPropagation();
      e.preventDefault();
      if (!itemId) return;

      const prevReaction = userReaction;
      const prevCounts = { ...reactionCounts };
      const newCounts = { ...reactionCounts };

      let newReaction = null;

      if (prevReaction === type) {
        newReaction = null;
        if (newCounts[type]) newCounts[type]--;
      } else {
        if (prevReaction && newCounts[prevReaction]) {
          newCounts[prevReaction]--;
        }
        newReaction = type;
        newCounts[type] = (newCounts[type] || 0) + 1;
      }

      setUserReaction(newReaction);
      setReactionCounts(newCounts);

      setReactionCache((prev) => ({
        ...prev,
        [itemId]: {
          userReaction: newReaction,
          reactions: newCounts,
        },
      }));
    },
    [itemId, userReaction, reactionCounts]
  );

  if (!open || !item) return null;

  const isPlayableVideo =
    item.type === "video" &&
    typeof item.url === "string" &&
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(item.url);

  const thumb = item.thumbUrl || item.thumbnail || item.imageUrl;

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden bg-slate-950 text-slate-50 flex flex-col">
      <div className="relative flex-1 overflow-hidden bg-slate-900">
        {/* 🎯 SWIPE REAL */}
        <motion.div
          key={itemId}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          style={{ x }}
          onDragEnd={(e, info) => {
            const { offset, velocity } = info;

            if (offset.x < -80 || velocity.x < -500) {
              handleNext();
            } else if (offset.x > 80 || velocity.x > 500) {
              handlePrev();
            }

            x.set(0);
          }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Área pause/play */}
          <div
            className="absolute inset-0 w-full h-full z-10"
            onClick={togglePlayPause}
          />

          {/* Video / Image */}
          {isPlayableVideo ? (
            <video
              ref={videoRef}
              src={item.url}
              autoPlay
              playsInline
              poster={thumb}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ opacity: videoReady ? 1 : 0 }}
              onCanPlay={() => setVideoReady(true)}
              onEnded={handleNext}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : thumb ? (
            <img
              src={thumb}
              alt={item.title || "Reel"}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              Reel
            </div>
          )}

          {/* Play / Pause indicator */}
          {showStatus && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-30">
              <span className="text-white text-6xl drop-shadow-lg">
                {isPaused ? "❚❚" : "►"}
              </span>
            </div>
          )}
        </motion.div>

        {/* Reacciones */}
        <div
          className="absolute right-4 bottom-24 z-40 flex flex-col gap-4 items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {REACTION_ORDER.map((key) => {
            const reaction = REACTIONS[key];
            const isActive = userReaction === key;
            const count = reactionCounts[key] || 0;

            return (
              <div key={key} className="flex flex-col items-center">
                <button
                  onClick={(e) => handleReaction(e, key)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                    isActive
                      ? "bg-indigo-600/90 scale-110 shadow-lg border border-indigo-400"
                      : "bg-black/40 hover:bg-black/60 border border-white/10"
                  }`}
                >
                  <span className="text-xl">{reaction.icon}</span>
                </button>
                {count > 0 && (
                  <span className="text-xs text-white drop-shadow-md mt-1">
                    {formatCount(count)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Gradiente */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none z-20" />

        {/* Progreso */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Cerrar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-lg z-50"
        >
          ✕
        </button>

        {/* Info */}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-end justify-between gap-3 pointer-events-none">
          <div className="text-left space-y-1 drop-shadow">
            <div className="text-sm font-semibold">
              {item.title || item.authorName || "Reel"}
            </div>
            {item.title && item.authorName && (
              <div className="text-xs text-slate-200">{item.authorName}</div>
            )}
          </div>
          <div className="text-xs text-slate-200 flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: accent }}
            />
            <span>
              {activeIndex + 1}/{items.length}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-200">
        <div
          className="px-3 py-1 rounded-full border border-white/20"
          style={{ color: accent }}
        >
          Reels: {MODES[mode]?.label || "Modo"}
        </div>
        <div className="text-slate-400">
          {item.contentType || item.type || ""}
        </div>
      </div>
    </div>,
    document.body
  );
}
