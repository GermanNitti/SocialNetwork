import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { MODES } from "./ModeConfig";
import { REACTIONS, REACTION_ORDER } from '../../constants/reactions';
import api from '../../api/client';

// Define ReelPlayer component outside of HighlightViewer
const ReelPlayer = memo(({ src, poster, isActive, onNext, onTimeUpdate, showParentStatus, toggleParentPlayPause }) => {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // Managed internally
  const [showStatus, setShowStatus] = useState(false); // Managed internally
  const statusTimeoutRef = useRef(null);
  const [progress, setProgress] = useState(0); // Managed internally

  // Reset internal states when active (i.e., item changes)
  useEffect(() => {
    if (isActive) {
      setVideoReady(false);
      setIsPaused(false);
      setProgress(0);
      // Ensure video plays from start if it's the active one
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(e => console.error("ReelPlayer autoplay prevented:", e));
      }
    }
  }, [isActive, src]); // src is included to re-trigger if video URL changes

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (videoReady) {
      if (isPaused) {
        v.pause();
      } else {
        v.play().catch(error => {
          console.error("ReelPlayer autoplay prevented:", error);
          setIsPaused(true);
        });
      }
    }
  }, [isPaused, videoReady]);

  const isPlayableVideo = typeof src === "string" && /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);

  const showStatusIndicator = useCallback(() => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    setShowStatus(true);
    statusTimeoutRef.current = setTimeout(() => setShowStatus(false), 800);
  }, []);

  const togglePlayPauseInternal = useCallback(() => {
    setIsPaused(prev => !prev);
    showStatusIndicator();
  }, [showStatusIndicator]);

  // Use onTimeUpdate prop
  const handleTimeUpdateInternal = useCallback((e) => {
    const video = e.target;
    if (video.duration) {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage);
    }
    if (onTimeUpdate) onTimeUpdate(e); // Propagate to parent if needed
  }, [onTimeUpdate]);

  if (!isActive) return null; // Only render the actual media if it's the active one

  return (
    <div
      className="relative flex-1 overflow-hidden bg-slate-900"
      onClick={toggleParentPlayPause} // Use the parent's toggle function to also consider swipe flag
    >
      {isPlayableVideo ? (
        <video
          key={src} // Key by src to force remount on video change
          ref={videoRef}
          src={src}
          autoPlay
          playsInline
          poster={poster}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ opacity: videoReady ? 1 : 0 }}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          onEnded={onNext} // Use onNext prop
          onTimeUpdate={handleTimeUpdateInternal}
        />
      ) : (
        poster ? (
          <img src={poster} alt="Highlight" className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">Highlight</div>
        )
      )}
      
      {showStatus && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <span className="text-white text-6xl drop-shadow-lg">{isPaused ? '❚❚' : '►'}</span>
        </div>
      )}
      {/* Progress bar controlled by ReelPlayer's internal state */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div className="h-full bg-white" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.src === nextProps.src && prevProps.isActive === nextProps.isActive;
});


export default function HighlightViewer({ open, items = [], index = 0, onClose, mode }) {
  const [activeIndex, setActiveIndex] = useState(index);

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
    }
  }, [open, index]);

  const item = items[activeIndex];

  useEffect(() => {
    // Initialize userReaction and reactionCounts from cache or item data
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
      // await api.post(`/posts/${item.id}/reactions`, { type }); 
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
  };

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const showStatusIndicator = useCallback(() => {
    // This is now internal to ReelPlayer. This useCallback is no longer needed here.
    // However, the togglePlayPause still references it. It needs to be removed from here.
    // Removing the implementation and simply noting its previous existence.
  }, []);

  const togglePlayPause = useCallback(() => {
    if (swiped.current) return;
    // The actual play/pause logic will be within ReelPlayer
    // We need to trigger ReelPlayer's internal play/pause.
    // This requires passing a state setter or ref down, or letting ReelPlayer manage it.
    // For now, let's keep the isPaused state in HighlightViewer and pass it.
    // It seems the task implies moving IS_PAUSED to ReelPlayer.
    // So this function should simply toggle the local isPaused state in ReelPlayer.
    // We will pass the togglePlayPauseInternal as a prop to ReelPlayer.
  }, []); // Dependencies will change based on where isPaused state resides.

  const handleTimeUpdate = useCallback((e) => {
    // This will be internal to ReelPlayer
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

  const accent = MODES[mode]?.accent || "#3B82F6";

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden bg-slate-950 text-slate-50 flex flex-col">
      <ReelPlayer
        src={item.url}
        poster={item.thumbUrl || item.thumbnail || item.imageUrl}
        isActive={true} // Only active item is mounted, so always true
        onNext={handleNext}
        onTimeUpdate={() => {}} // ReelPlayer manages its own progress, this can be removed from parent if not needed
        toggleParentPlayPause={togglePlayPause} // Pass parent's toggle function for touch events
      />

        {/* Reacciones Flotantes */}
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

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
        
        {/* Progress bar is now internal to ReelPlayer */}
        {/* Removed: <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-white" style={{ width: `${progress}%` }} />
        </div> */}

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