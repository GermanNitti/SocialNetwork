import { useEffect, useRef, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MODES } from "./ModeConfig";
import { REACTIONS, REACTION_ORDER } from '../../constants/reactions';
import api from '../../api/client';

const ReelPlayer = memo(({ src, poster, isActive, onNext, isPaused, videoReady, onVideoReady, onVideoError }) => {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.currentTime = 0;
      setProgress(0);
    }
  }, [isActive, src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (videoReady) {
      if (isPaused) {
        v.pause();
      } else {
        v.play().catch(error => {
          console.error("ReelPlayer autoplay prevented:", error);
        });
      }
    }
  }, [isPaused, videoReady]);

  const handleTimeUpdate = useCallback((e) => {
    const video = e.target;
    if (video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  }, []);
  
  const isPlayableVideo = typeof src === "string" && /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);

  return (
    <>
      {isPlayableVideo ? (
        <video
          key={src}
          ref={videoRef}
          src={src}
          autoPlay
          playsInline
          poster={poster}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ opacity: videoReady ? 1 : 0 }}
          onCanPlay={onVideoReady}
          onError={onVideoError}
          onEnded={onNext}
          onTimeUpdate={handleTimeUpdate}
        />
      ) : (
        poster ? <img src={poster} alt="Highlight" className="w-full h-full object-cover" draggable={false} /> : <div className="w-full h-full flex items-center justify-center text-slate-400">Highlight</div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div className="h-full bg-white" style={{ width: `${progress}%` }} />
      </div>
    </>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.src === nextProps.src &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.videoReady === nextProps.videoReady
  );
});

const HighlightViewer = memo(function HighlightViewer({ open, items = [], index = 0, onClose, mode }) {
  const [activeIndex, setActiveIndex] = useState(index);
  const [videoReady, setVideoReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const statusTimeoutRef = useRef(null);

  const [userReaction, setUserReaction] = useState(null);
  const [reactionCounts, setReactionCounts] = useState({});
  const [reactionCache, setReactionCache] = useState({});
  const [swipeDirection, setSwipeDirection] = useState(0);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swiped = useRef(false);
  const swipeThreshold = 50;

  const formatCount = (num) => (num > 9999 ? `${(num / 1000).toFixed(1)}mil` : num);

  useEffect(() => {
    if (open) {
      setActiveIndex(index);
    }
  }, [open, index]);

  const item = items[activeIndex];

  useEffect(() => {
    setVideoReady(false);
    setIsPaused(false);
    setShowStatus(false);
    if (item) {
      const cached = reactionCache[item.id];
      if (cached) {
        setUserReaction(cached.userReaction);
        setReactionCounts(cached.reactions);
      } else {
        setUserReaction(item.userReaction || null);
        setReactionCounts(item.reactions || {});
      }
    }
  }, [activeIndex, item, reactionCache]);

  const handleReaction = async (e, type) => {
    e.stopPropagation();
    const prevReaction = userReaction;
    const optimisticCounts = { ...reactionCounts };
    let newUserReactionState = prevReaction === type ? null : type;

    if (prevReaction === type) {
      if (optimisticCounts[type]) optimisticCounts[type]--;
    } else {
      if (prevReaction && optimisticCounts[prevReaction]) optimisticCounts[prevReaction]--;
      optimisticCounts[type] = (optimisticCounts[type] || 0) + 1;
    }
    
    setUserReaction(newUserReactionState);
    setReactionCounts(optimisticCounts);
    setReactionCache(prev => ({ ...prev, [item.id]: { userReaction: newUserReactionState, reactions: optimisticCounts } }));

    try {
      console.log('Reaccionando:', type, 'al item:', item.id);
    } catch (error) {
      console.error("Error sending reaction:", error);
      setUserReaction(prevReaction);
      setReactionCounts(reactionCounts);
      setReactionCache(prev => ({ ...prev, [item.id]: { userReaction: prevReaction, reactions: reactionCounts } }));
    }
  };

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

  const togglePlayPause = useCallback(() => {
    if (swiped.current) return;
    setIsPaused(prev => !prev);
    showStatusIndicator();
  }, [showStatusIndicator]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; swiped.current = false; };
  const handleTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    if (distance > swipeThreshold) { handleNext(); swiped.current = true; }
    else if (distance < -swipeThreshold) { handlePrev(); swiped.current = true; }
    touchStartX.current = 0; touchEndX.current = 0;
  };

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
  };
  
  if (!item) return null;

  const accent = MODES[mode]?.accent || "#3B82F6";

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden bg-slate-950 text-slate-50 flex flex-col" style={{ display: open ? 'flex' : 'none' }}>
      <div
        className="relative flex-1 overflow-hidden bg-slate-900"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={swipeDirection}>
          <motion.div
            key={activeIndex}
            custom={swipeDirection}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            className="absolute inset-0 w-full h-full flex flex-col"
          >
            <ReelPlayer
              src={item.url}
              poster={item.thumbUrl || item.thumbnail || item.imageUrl}
              isActive={true}
              onNext={handleNext}
              isPaused={isPaused}
              videoReady={videoReady}
              onVideoReady={useCallback(() => setVideoReady(true), [])}
              onVideoError={useCallback(() => setVideoReady(false), [])}
              togglePlayPause={togglePlayPause}
              showStatus={showStatus}
            />

            <div className="absolute right-4 bottom-24 z-40 flex flex-col gap-4 items-center" onTouchStart={(e) => e.stopPropagation()}>
              {REACTION_ORDER.map((key) => {
                const reaction = REACTIONS[key];
                const isActive = userReaction === key;
                const count = reactionCounts[key] || 0;
                return (
                  <div key={key} className="flex flex-col items-center">
                    <button onClick={(e) => handleReaction(e, key)} className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isActive ? "bg-indigo-600/90 scale-110 shadow-lg border border-indigo-400" : "bg-black/40 hover:bg-black/60 border border-white/10"}`}>
                      <span className="text-xl" role="img" aria-label={reaction.label}>{reaction.icon}</span>
                    </button>
                    {count > 0 && <span className="text-xs text-white drop-shadow-md mt-1">{formatCount(count)}</span>}
                  </div>
                );
              })}
            </div>

            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

            <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Cerrar" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-lg z-50">✕</button>

            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-3">
              <div className="text-left space-y-1 drop-shadow">
                <div className="text-sm font-semibold">{item?.title || "Highlight"}</div>
                <div className="text-xs text-slate-200">{item?.authorName || ""}</div>
              </div>
              <div className="text-xs text-slate-200 flex items-center justify-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                <span>{activeIndex + 1}/{items.length}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-200">
        <div className="px-3 py-1 rounded-full border border-white/20" style={{ color: accent }}>Reels: {MODES[mode]?.label || "Modo"}</div>
        <div className="text-slate-400">{item?.contentType || item?.type || ""}</div>
      </div>
    </div>,
    document.body
  );
});

export default HighlightViewer;