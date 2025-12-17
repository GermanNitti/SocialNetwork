import { useEffect, useRef, useState } from "react";
import { REACTIONS, REACTION_ORDER } from "../../constants/reactions";
import { createPortal } from "react-dom";
import { MODES } from "./ModeConfig";

export default function HighlightViewer({ open, items = [], index = 0, onClose, mode }) {
  const [activeIndex, setActiveIndex] = useState(index);
  const [videoReady, setVideoReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reactionsVisible, setReactionsVisible] = useState(true);
  const [reactionsOpacity, setReactionsOpacity] = useState(1);
  const videoRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  const touchState = useRef({ startX: 0, startY: 0, moved: false });
  const reactionsIdleTimeout = useRef(null);

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

  useEffect(() => {
    // ensure reactions start visible when viewer opens
    if (open) {
      setReactionsVisible(true);
      setReactionsOpacity(1);
      if (reactionsIdleTimeout.current) clearTimeout(reactionsIdleTimeout.current);
      reactionsIdleTimeout.current = setTimeout(() => setReactionsOpacity(0.35), 3000);
    }
    return () => {
      if (reactionsIdleTimeout.current) clearTimeout(reactionsIdleTimeout.current);
    };
  }, [open, activeIndex]);

  const item = items[activeIndex];
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
    setIsPaused(!isPaused);
    showStatusIndicator();
  };

  const resetReactionsIdle = () => {
    setReactionsOpacity(1);
    if (reactionsIdleTimeout.current) clearTimeout(reactionsIdleTimeout.current);
    reactionsIdleTimeout.current = setTimeout(() => setReactionsOpacity(0.35), 3000);
  };

  const onTouchStart = (e) => {
    resetReactionsIdle();
    const t = e.touches ? e.touches[0] : e;
    touchState.current.startX = t.clientX;
    touchState.current.startY = t.clientY;
    touchState.current.moved = false;
  };

  const onTouchMove = (e) => {
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - touchState.current.startX;
    const dy = t.clientY - touchState.current.startY;
    if (Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy)) {
      touchState.current.moved = true;
      e.stopPropagation();
      e.preventDefault?.();
    }
  };

  const onTouchEnd = (e) => {
    resetReactionsIdle();
    if (touchState.current.ignoreTap) {
      // interaction started on reactions; consume and reset
      touchState.current.ignoreTap = false;
      return;
    }
    if (!touchState.current.moved) {
      // tap
      togglePlayPause();
      return;
    }
    const lastTouch = (e.changedTouches && e.changedTouches[0]) || e;
    const dx = lastTouch.clientX - touchState.current.startX;
    const threshold = 50;
    if (dx > threshold) {
      handlePrev();
    } else if (dx < -threshold) {
      handleNext();
    }
  };

  const [selectedReactions, setSelectedReactions] = useState({});

  const applyReaction = async (reactionKey, ev) => {
    ev.stopPropagation();
    // mark locally
    setSelectedReactions((s) => ({ ...s, [activeIndex]: reactionKey }));
    // TODO: call API to persist reaction for `item` (if API available)
    try {
      if (item?.id) {
        // best-effort: try POSTing to a known-ish endpoint; ignore errors
        await fetch(`/api/posts/${item.id}/reaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reaction: reactionKey }),
        });
      }
    } catch (err) {
      // ignore network errors here; developer can wire proper endpoint
      console.debug('applyReaction failed', err);
    }
  };

  const handleTimeUpdate = (e) => {
    const video = e.target;
    if (video.duration) {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden bg-slate-950 text-slate-50 flex flex-col">
      <div
        className="relative flex-1 overflow-hidden bg-slate-900"
        onClick={(e) => { /* keep click handlers on tap handled in touchend */ }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onPointerDown={resetReactionsIdle}
        onMouseMove={resetReactionsIdle}
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

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-white" style={{ width: `${progress}%` }} />
        </div>

        <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Cerrar" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-lg">✕</button>

        {/* Reactions column (right side) */}
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3"
          style={{ opacity: reactionsOpacity, transition: 'opacity 300ms' }}
          aria-hidden={!reactionsVisible}
        >
          {REACTION_ORDER.map((key) => {
            const r = REACTIONS[key];
            const selected = selectedReactions[activeIndex] === key;
            return (
              <button
                key={key}
                onClick={(ev) => applyReaction(key, ev)}
                onTouchStart={(ev) => { ev.stopPropagation(); touchState.current.ignoreTap = true; }}
                onPointerDown={(ev) => { ev.stopPropagation(); touchState.current.ignoreTap = true; }}
                onMouseDown={(ev) => { ev.stopPropagation(); touchState.current.ignoreTap = true; }}
                className={`h-12 w-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-xl ${selected ? 'scale-110 ring-2 ring-white/30' : ''}`}
                aria-label={key}
              >
                <span>{r?.icon || r?.label}</span>
              </button>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-3">
          <div className="text-left space-y-1 drop-shadow">
            <div className="text-sm font-semibold">{item.title || "Highlight"}</div>
            <div className="text-xs text-slate-200">{item.authorName || ""}</div>
          </div>
          <div className="text-xs text-slate-200 flex items-center gap-2">
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
