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
  const [userReaction, setUserReaction] = useState(null);

  // Swipe logic states/refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swiped = useRef(false); // Flag to differentiate swipe from tap
  const swipeThreshold = 50; // Minimum distance for a swipe

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
    setUserReaction(null);
  }, [activeIndex]);

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
    setUserReaction(type); // Feedback visual inmediato (Optimistic UI)
    try {
      // El item.id es la URL en los reels actuales, pero si el backend espera un ID numérico esto fallará. 
      // Por ahora, solo haz el console.log para probar la UI sin romper nada:
      console.log('Reaccionando:', type, 'al item:', item.id);
      // Descomentar cuando el backend soporte reacciones por URL o ID real:
      // await api.post(`/posts/${item.id}/reactions`, { type }); 
    } catch (error) {
      console.error(error);
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
        <div className="absolute right-4 bottom-24 z-40 flex flex-col gap-4 items-center">
          {REACTION_ORDER.map((key) => {
            const reaction = REACTIONS[key];
            const isActive = userReaction === key;
            return (
              <button
                key={key}
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