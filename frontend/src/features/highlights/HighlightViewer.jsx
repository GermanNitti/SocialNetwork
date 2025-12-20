import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
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

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swiped = useRef(false);
  const swipeThreshold = 50;

  const formatCount = (num) => {
    if (num > 9999) {
      return (num / 1000).toFixed(1) + "mil";
    }
    return num;
  };

  useEffect(() => {
    if (open) {
      setActiveIndex(index);
      setVideoReady(false);
      setIsPaused(false);
      setProgress(0);
    }
  }, [open, index]);

  const item = items[activeIndex];

  // --- START MODIFICATION ---
  // This useEffect now only depends on activeIndex and item.
  // The 'reactionCache' dependency has been removed to prevent the video state
  // from being reset (causing it to disappear) when only reaction data changes.
  // The video state should only reset when a new video item is loaded.
  useEffect(() => {
    setVideoReady(false);
    setIsPaused(false);
    setProgress(0);
    
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
  }, [activeIndex, item]); // 'reactionCache' removed from dependencies
  // --- END MODIFICATION ---

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (videoReady) {
      if (isPaused) {
        v.pause();
      } else {
        v.play().catch(error => {
          console.error("Autoplay was prevented:", error);
          setIsPaused(true);
        });
      }
    }
  }, [isPaused, videoReady]);

  const handleReaction = useCallback(async (e, type) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!item?.id) return;
    
    const prevReaction = userReaction;
    const optimisticCounts = { ...reactionCounts };
    let newUserReactionState = null;

    if (prevReaction === type) {
      newUserReactionState = null;
      if (optimisticCounts[type]) optimisticCounts[type]--;
    } else {
      if (prevReaction && optimisticCounts[prevReaction]) {
        optimisticCounts[prevReaction]--;
      }
      newUserReactionState = type;
      optimisticCounts[type] = (optimisticCounts[type] || 0) + 1;
    }
    
    setUserReaction(newUserReactionState);
    setReactionCounts(optimisticCounts);

    setReactionCache(prev => ({
        ...prev,
        [item.id]: {
            userReaction: newUserReactionState,
            reactions: optimisticCounts
        }
    }));

    try {
      console.log('Reaccionando:', type, 'al item:', item.id);
    } catch (error) {
      console.error("Error sending reaction:", error);
      setUserReaction(prevReaction);
      setReactionCounts(reactionCounts);
      setReactionCache(prev => ({
          ...prev,
          [item.id]: {
              userReaction: prevReaction,
              reactions: reactionCounts
          }
      }));
    }
  }, [item?.id, userReaction, reactionCounts]);

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

  const togglePlayPause = useCallback(() => {
    if (swiped.current) return;
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

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    swiped.current = false;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    if (distance > swipeThreshold) {
      handleNext();
      swiped.current = true;
    } else if (distance < -swipeThreshold) {
      handlePrev();
      swiped.current = true;
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (!open || !item) return null;

  const isPlayableVideo = item.type === "video" && typeof item.url === "string" && /\.(mp4|webm/ogg)(\?.*)?$/i.test(item.url);
  const thumb = item.thumbUrl || item.thumbnail || item.imageUrl;

  const accent = MODES[mode]?.accent || "#3B82F6";

  const renderMedia = useMemo(() => {
    if (!item) return null; // This check is redundant with the one outside of renderMedia but harmless.
    const isPlayable = item.type === "video" && typeof item.url === "string" && /\.(mp4|webm|ogg)(\?.*)?$/i.test(item.url);
    const thumbnail = item.thumbUrl || item.thumbnail || item.imageUrl;

    return (
      <>
        {isPlayable ? (
          <video
            key={`${item.id}-${activeIndex}`}
            ref={videoRef}
            src={item.url}
            autoPlay
            playsInline
            poster={thumbnail}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ opacity: videoReady ? 1 : 0 }}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoReady(false)}
            onEnded={handleNext}
            onTimeUpdate={handleTimeUpdate}
          />
        ) : (
          thumbnail ? (
            <img src={thumbnail} alt={item.title || "Highlight"} className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">Highlight</div>
          )
        )}
        {showStatus && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <span className="text-white text-6xl drop-shadow-lg">{isPaused ? '❚❚' : '►'}</span>
          </div>
        )}
      </>
    );
  }, [activeIndex, item, videoReady, isPaused, handleNext, handleTimeUpdate]);

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden bg-slate-950 text-slate-50 flex flex-col" style={{ display: open ? 'flex' : 'none' }}>
      <div
        className="relative flex-1 overflow-hidden bg-slate-900"
        onClick={togglePlayPause}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {renderMedia}

        <div
          className="absolute right-4 bottom-24 z-40 flex flex-col gap-4 items-center"
          onTouchStart={(e) => e.stopPropagation()}
        >
          {REACTION_ORDER.map((key) => {
            const reaction = REACTIONS[key];
            const isActive = userReaction === key;
            const count = reactionCounts[key] || 0;

            return (
              <div key={key} className="flex flex-col items-center">
                <button onClick={(e) => handleReaction(e, key)} className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isActive ? "bg-indigo-600/90 scale-110 shadow-lg border border-indigo-400" : "bg-black/40 hover:bg-black/60 border border-white/10"}`}>
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

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div ref={progressBarRef} className="h-full bg-white" style={{ width: '0%' }} />
        </div>

        <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Cerrar" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-lg">✕</button>

        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-3">
          <div className="text-left space-y-1 drop-shadow">
            <div className="text-sm font-semibold">{item.title || "Highlight"}</div>
            <div className="text-xs text-slate-200">{item.authorName || ""}</div>
          </div>
          <div className="text-xs text-slate-200 flex items-center justify-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
            <span>{activeIndex + 1}/{items.length}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-200">
        <div className="px-3 py-1 rounded-full border border-white/20" style={{ color: accent }}>Reels: {MODES[mode]?.label || "Modo"}</div>
        <div className="text-slate-400">{item.contentType || item.type || ""}</div>
      </div>
    </div>,
    document.body
  );
}