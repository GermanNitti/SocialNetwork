import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MODES } from "./ModeConfig";
import { REACTIONS, REACTION_ORDER } from '../../constants/reactions';

export default function HighlightViewer({ open, items = [], index = 0, onClose, mode }) {
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
  const [swipeDirection, setSwipeDirection] = useState(0);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swiped = useRef(false);
  const swipeThreshold = 50;

  const formatCount = (num) => {
    if (num > 9999) return `${(num / 1000).toFixed(1)}mil`;
    return num;
  };

  useEffect(() => {
    if (open) {
      setActiveIndex(index);
    }
  }, [open, index]);

  const item = items[activeIndex];
  const itemId = item?.id;

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
    
    if (isPaused) {
      v.pause();
    } else {
      v.play().catch(error => {
        console.error("Autoplay prevented:", error);
      });
    }
  }, [isPaused, videoReady]);

  const handleReaction = useCallback((e, type) => {
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

    setReactionCache(prev => ({
      ...prev,
      [itemId]: {
        userReaction: newReaction,
        reactions: newCounts
      }
    }));

    try {
      console.log('Reacción:', type, 'Item:', itemId);
    } catch (error) {
      console.error("Error sending reaction:", error);
      setUserReaction(prevReaction);
      setReactionCounts(prevCounts);
      setReactionCache(prev => ({
        ...prev,
        [itemId]: {
          userReaction: prevReaction,
          reactions: prevCounts
        }
      }));
    }
  }, [itemId, userReaction, reactionCounts]);

  const handlePrev = useCallback(() => {
    setSwipeDirection(-1);
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const handleNext = useCallback(() => {
    setSwipeDirection(1);
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const showStatusIndicator = useCallback(() => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    setShowStatus(true);
    statusTimeoutRef.current = setTimeout(() => setShowStatus(false), 800);
  }, []);

  const togglePlayPause = useCallback((e) => {
    // Solo toggle si NO es un swipe
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    
    e.stopPropagation();
    setIsPaused(prev => !prev);
    showStatusIndicator();
  }, [showStatusIndicator]);

  const handleTimeUpdate = useCallback((e) => {
    const video = e.target;
    if (video.duration) {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage);
    }
  }, []);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    swiped.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const distance = touchStartX.current - touchEndX.current;
    const absDistance = Math.abs(distance);
    
    if (absDistance > swipeThreshold) {
      swiped.current = true;
      if (distance > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [handleNext, handlePrev]);

  if (!open || !item) return null;

  const isPlayableVideo = item.type === "video" && typeof item.url === "string" && /\.(mp4|webm|ogg)(\?.*)?$/i.test(item.url);
  const thumb = item.thumbUrl || item.thumbnail || item.imageUrl;
  const accent = MODES[mode]?.accent || "#3B82F6";

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden bg-slate-950 text-slate-50 flex flex-col">
      <div
        className="relative flex-1 overflow-hidden bg-slate-900"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={swipeDirection} mode="popLayout">
          <motion.div
            key={itemId}
            custom={swipeDirection}
            initial={(direction) => ({
              x: direction > 0 ? '100%' : '-100%',
              opacity: 0.8
            })}
            animate={{
              x: 0,
              opacity: 1
            }}
            exit={(direction) => ({
              x: direction > 0 ? '-100%' : '100%',
              opacity: 0
            })}
            transition={{
              type: "tween",
              duration: 0.25,
              ease: [0.32, 0.72, 0, 1]
            }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Área clickeable para pause/play */}
            <div 
              className="absolute inset-0 w-full h-full z-10"
              onClick={togglePlayPause}
            />

            {/* Video/Image */}
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
                onError={() => setVideoReady(false)}
                onEnded={handleNext}
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              thumb ? (
                <img src={thumb} alt={item.title || "Reel"} className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">Reel</div>
              )
            )}

            {/* Play/Pause indicator */}
            {showStatus && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-30">
                <span className="text-white text-6xl drop-shadow-lg">{isPaused ? '❚❚' : '►'}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Reacciones - fuera de motion.div para que no se animen */}
        <div
          className="absolute right-4 bottom-24 z-40 flex flex-col gap-4 items-center"
          onTouchStart={(e) => e.stopPropagation()}
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
                  <span className="text-xl" role="img" aria-label={reaction.label}>
                    {reaction.icon}
                  </span>
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

        {/* Gradiente inferior */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none z-20" />
        
        {/* Barra de progreso */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
          <div 
            className="h-full bg-white transition-all duration-100" 
            style={{ width: `${progress}%` }} 
          />
        </div>

        {/* Botón cerrar */}
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          aria-label="Cerrar" 
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-lg z-50"
        >
          ✕
        </button>

        {/* Info del video */}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-end justify-between gap-3 pointer-events-none">
          <div className="text-left space-y-1 drop-shadow">
            <div className="text-sm font-semibold">
              {item.title || item.authorName || "Reel"}
            </div>
            {item.title && item.authorName && (
              <div className="text-xs text-slate-200">{item.authorName}</div>
            )}
          </div>
          <div className="text-xs text-slate-200 flex items-center justify-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
            <span>{activeIndex + 1}/{items.length}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-200">
        <div className="px-3 py-1 rounded-full border border-white/20" style={{ color: accent }}>
          Reels: {MODES[mode]?.label || "Modo"}
        </div>
        <div className="text-slate-400">{item.contentType || item.type || ""}</div>
      </div>
    </div>,
    document.body
  );
}