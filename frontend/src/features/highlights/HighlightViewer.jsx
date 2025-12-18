import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MODES } from "./ModeConfig";
import { REACTIONS, REACTION_ORDER } from '../../constants/reactions';
import api from '../../api/client';

export default function HighlightViewer({ open, items = [], index = 0, onClose, mode }) {
  const [activeIndex, setActiveIndex] = useState(index);
  const [videoReady, setVideoReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  // Reaction states
  const [userReaction, setUserReaction] = useState(null);
  const [reactionCounts, setReactionCounts] = useState({});

  // Local cache for reactions
  const [reactionCache, setReactionCache] = useState({});

  // Swipe logic states/refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swiped = useRef(false); // Flag to differentiate swipe from tap
  const swipeThreshold = 50; // Minimum distance for a swipe

  // Helper function for formatting numbers
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

  useEffect(() => {
    setVideoReady(false);
    setIsPaused(false);
    setProgress(0);
    
    // Initialize userReaction and reactionCounts from cache or item data
    const currentItem = items[activeIndex];
    if (currentItem) {
      const cached = reactionCache[currentItem.id]; // Use item.id as key
      if (cached) {
        setUserReaction(cached.userReaction);
        setReactionCounts(cached.reactions);
      } else {
        // Fallback to original item data if not in cache
        setUserReaction(currentItem.userReaction || null);
        setReactionCounts(currentItem.reactions || {});
      }
    }
  }, [activeIndex, items, reactionCache]); // Added reactionCache to dependencies

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // This effect handles the play/pause logic based on isPaused and videoReady states.
    if (videoReady) {
      if (isPaused) {
        v.pause();
      } else {
        v.play().catch(error => {
          console.error("Autoplay was prevented:", error);
          // If autoplay fails, we update the state to reflect that the video is paused.
          setIsPaused(true);
        });
      }
    }
  }, [isPaused, videoReady]);

  const item = items[activeIndex];

  const handleReaction = async (e, type) => {
    e.stopPropagation(); // CRÍTICO: Evita que el click pause el video

    const prevReaction = userReaction;
    const optimisticCounts = { ...reactionCounts }; // Create a mutable copy
    let newUserReactionState = null;

    // Update optimistic UI
    if (prevReaction === type) {
      // User is un-reacting
      newUserReactionState = null;
      if (optimisticCounts[type]) {
        optimisticCounts[type]--;
      }
    } else if (prevReaction !== null) {
      // User is changing reaction
      if (optimisticCounts[prevReaction]) {
        optimisticCounts[prevReaction]--;
      }
      newUserReactionState = type;
      optimisticCounts[type] = (optimisticCounts[type] || 0) + 1;
    } else {
      // User is adding a new reaction
      newUserReactionState = type;
      optimisticCounts[type] = (optimisticCounts[type] || 0) + 1;
    }
    
    // Apply optimistic update to local states
    setUserReaction(newUserReactionState);
    setReactionCounts(optimisticCounts);

    // Update reactionCache
    setReactionCache(prev => ({
        ...prev,
        [item.id]: { // Use item.id as the key
            userReaction: newUserReactionState,
            reactions: optimisticCounts
        }
    }));

    try {
      console.log('Reaccionando (optimistic):', type, 'al item:', item.id);
      // Descomentar cuando el backend soporte reacciones por URL o ID real:
      // await api.post(`/posts/${item.id}/reactions`, { type }); 
    } catch (error) {
      console.error("Error sending reaction:", error);
      // Revert UI on error
      setUserReaction(prevReaction);
      setReactionCounts(reactionCounts); // Revert to original counts
      // Revert reactionCache as well
      setReactionCache(prev => ({
          ...prev,
          [item.id]: {
              userReaction: prevReaction,
              reactions: reactionCounts // Original counts before optimistic update
          }
      }));
    }
  };

  if (!open || !item) return null;

  const thumb = item.thumbUrl || item.thumbnail || item.imageUrl;
  const accent = MODES[mode]?.accent || "#3B82F6";

  const isPlayableVideo =
    item?.type === "video" &&
    typeof item?.url === "string" &&
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(item.url);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const showStatusIndicator = () => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    setShowStatus(true);
    statusTimeoutRef.current = setTimeout(() => setShowStatus(false), 800);
  };

  const togglePlayPause = () => {
    if (swiped.current) return; // Do not toggle if it was a swipe
    setIsPaused(!isPaused);
    showStatusIndicator();
  };

  const handleTimeUpdate = (e) => {
    const video = e.target;
    if (video.duration) {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage);
    }
  };

  // Touch event handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    swiped.current = false; // Reset swipe flag
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    if (distance > swipeThreshold) {
      // Swiped left
      handleNext();
      swiped.current = true;
    } else if (distance < -swipeThreshold) {
      // Swiped right
      handlePrev();
      swiped.current = true;
    }
    // Reset touch positions for next interaction
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden bg-slate-950 text-slate-50 flex flex-col">
      <div
        className="relative flex-1 overflow-hidden bg-slate-900"
        onClick={togglePlayPause}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isPlayableVideo ? (
          <video
            key={item.id ?? activeIndex}
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
            <img src={thumb} alt={item.title || "Highlight"} className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">Highlight</div>
          )
        )}
        
        {showStatus && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <span className="text-white text-6xl drop-shadow-lg">{isPaused ? '❚❚' : '►'}</span>
          </div>
        )}

        {/* Reacciones Flotantes */}
        <div
          className="absolute right-4 bottom-24 z-40 flex flex-col gap-4 items-center"
          onTouchStart={(e) => e.stopPropagation()}
        >
          {REACTION_ORDER.map((key) => {
            const reaction = REACTIONS[key];
            const isActive = userReaction === key;
            const count = reactionCounts[key] || 0; // Get count for current reaction

            return (
              <div key={key} className="flex flex-col items-center"> {/* New wrapper div */}
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
                {count > 0 && ( // Only show count if greater than 0
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
          <div className="h-full bg-white" style={{ width: `${progress}%` }} />
        </div>

        <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Cerrar" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-lg">✕</button>
        {/* Removed: <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} aria-label="Anterior" className="absolute left-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-xl">‹</button> */}
        {/* Removed: <button onClick={(e) => { e.stopPropagation(); handleNext(); }} aria-label="Siguiente" className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-xl">›</button> */}

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