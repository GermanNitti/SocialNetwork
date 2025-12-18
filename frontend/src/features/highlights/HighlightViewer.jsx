import { useEffect, useRef, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";

// Mock data for demonstration
const MODES = {
  highlights: { label: "Highlights", accent: "#3B82F6" },
  trending: { label: "Trending", accent: "#10B981" }
};

const REACTIONS = {
  like: { icon: "👍", label: "Like" },
  love: { icon: "❤️", label: "Love" },
  fire: { icon: "🔥", label: "Fire" },
  laugh: { icon: "😂", label: "Laugh" }
};

const REACTION_ORDER = ["like", "love", "fire", "laugh"];

// ReelPlayer component
const ReelPlayer = memo(({
  src,
  poster,
  isActive,
  onNext,
  onTimeUpdate,
  togglePlayPause,
  isPaused,
  showStatus,
  videoReady,
  onVideoReady,
  onVideoError
}) => {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);

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

  useEffect(() => {
    if (isActive) {
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive, src]);

  const isPlayableVideo = typeof src === "string" && /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);

  const handleTimeUpdateInternal = useCallback((e) => {
    const video = e.target;
    if (video.duration) {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage);
    }
    if (onTimeUpdate) onTimeUpdate(e);
  }, [onTimeUpdate]);

  if (!isActive) return null;

  return (
    <div
      className="relative flex-1 overflow-hidden bg-slate-900"
      onClick={togglePlayPause}
    >
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
      
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div className="h-full bg-white transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.src === nextProps.src &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isPaused === nextProps.isPaused &&
    prevProps.showStatus === nextProps.showStatus &&
    prevProps.videoReady === nextProps.videoReady
  );
});

ReelPlayer.displayName = 'ReelPlayer';

export default function HighlightViewer({ open, items = [], index = 0, onClose, mode = 'highlights' }) {
  const [activeIndex, setActiveIndex] = useState(index);
  const [videoReady, setVideoReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const statusTimeoutRef = useRef(null);

  // Reaction states
  const [userReaction, setUserReaction] = useState(null);
  const [reactionCounts, setReactionCounts] = useState({});
  const [reactionCache, setReactionCache] = useState({});

  // Swipe logic
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
    // Optional: use this if needed by parent
  }, []);

  const handleVideoReady = useCallback(() => setVideoReady(true), []);
  const handleVideoError = useCallback(() => setVideoReady(false), []);

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
    <div 
      className="fixed inset-0 z-50 bg-slate-950 text-slate-50 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <ReelPlayer
        src={item.url}
        poster={item.thumbUrl || item.thumbnail || item.imageUrl}
        isActive={true}
        onNext={handleNext}
        onTimeUpdate={handleTimeUpdate}
        togglePlayPause={togglePlayPause}
        isPaused={isPaused}
        showStatus={showStatus}
        videoReady={videoReady}
        onVideoReady={handleVideoReady}
        onVideoError={handleVideoError}
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

      {/* Gradiente inferior */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      {/* Botón de cierre */}
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        aria-label="Cerrar" 
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-lg hover:bg-black/80 transition-colors"
      >
        ✕
      </button>

      {/* Información del video */}
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

      {/* Información del modo */}
      <div className="absolute top-16 left-0 right-0 px-4 py-3 flex items-center justify-between text-xs text-slate-200">
        <div className="px-3 py-1 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm" style={{ color: accent }}>
          Reels: {MODES[mode]?.label || "Modo"}
        </div>
        <div className="text-slate-400">{item.contentType || item.type || ""}</div>
      </div>
    </div>,
    document.body
  );
}

// Demo con datos de ejemplo
function Demo() {
  const [open, setOpen] = useState(false);
  
  const sampleItems = [
    {
      id: 1,
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      title: "Big Buck Bunny",
      authorName: "Blender Foundation",
      contentType: "Video",
      reactions: { like: 234, love: 89, fire: 156 },
      userReaction: null
    },
    {
      id: 2,
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      title: "Elephants Dream",
      authorName: "Orange Studio",
      contentType: "Animation",
      reactions: { like: 567, laugh: 123 },
      userReaction: "like"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <button
        onClick={() => setOpen(true)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Ver Highlights
      </button>
      
      <HighlightViewer
        open={open}
        items={sampleItems}
        index={0}
        onClose={() => setOpen(false)}
        mode="highlights"
      />
    </div>
  );
}

export { Demo as default };