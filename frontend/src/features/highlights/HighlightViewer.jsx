import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { MODES } from "./ModeConfig";
import { REACTIONS, REACTION_ORDER } from "../../constants/reactions";
import FriendSelector from "../../components/FriendSelector";

export default function HighlightViewer({ open, items = [], index = 0, onClose, mode }) {
  const [activeIndex, setActiveIndex] = useState(index);
  const [videoReady, setVideoReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const videoRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { mutateAsync: setReaction, isPending: reacting } = useMutation({
    mutationFn: async (type) => {
      // Assuming a similar API endpoint structure for reels as for posts
      // This will need to be implemented in the backend
      const { data } = await api.post(`/reels/${item.id}/reactions`, { type });
      return data;
    },
    onSuccess: () => {
      // Invalidate reels queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["reels"] });
      // Potentially, we might want to refetch the specific highlight item
      // queryClient.invalidateQueries({ queryKey: ["highlight", item.id] });
    },
  });

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

  const handleTimeUpdate = (e) => {
    const video = e.target;
    if (video.duration) {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage);
    }
  };

  const handleReaction = (type) => {
    setReaction(type);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden bg-slate-950 text-slate-50 flex flex-col">
      <div className="relative flex-1 overflow-hidden bg-slate-900" onClick={togglePlayPause}>
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
        <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} aria-label="Anterior" className="absolute left-3 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-xl">‹</button>
        
        {/* Reactions Pillar */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          {/*
            NOTE: For reactions to work, the 'item' object passed to HighlightViewer
            must include 'item.reactions' (an object like {LIKE: 5, LAUGH: 2})
            and 'item.userReaction' (a string like 'LIKE' if the user reacted).
            This data will need to be fetched/provided from the API when retrieving reels.
          */}
          {REACTION_ORDER.map((key) => {
            const currentReaction = item.userReaction; // Assuming item has userReaction
            const reactionCount = item.reactions?.[key] ?? 0; // Assuming item has reactions
            return (
              <button
                key={key}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReaction(key);
                }}
                disabled={reacting}
                className={`flex flex-col items-center justify-center gap-1 text-white drop-shadow transition ${
                  currentReaction === key
                    ? "text-indigo-400 scale-110" // Highlight selected reaction
                    : "hover:scale-105" // Basic hover effect
                }`}
              >
                <span className="text-3xl">{REACTIONS[key].icon}</span>
                <span className="text-[10px] font-bold">{reactionCount}</span>
              </button>
            );
          })}

          {/* Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowShareModal(true);
            }}
            className="flex flex-col items-center justify-center gap-1 text-white drop-shadow transition hover:scale-105 mt-4"
            aria-label="Compartir"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186A2.25 2.25 0 0116.5 10.5c.896 0 1.7-.198 2.403-.584m-2.403.584a2.25 2.25 0 00-2.186 2.186m-2.186 0a2.25 2.25 0 002.186 2.186m7.217-2.186c0 .896-.198 1.7-.584 2.403m.584-2.403a2.25 2.25 0 01-2.186 2.186M3.75 10.5c.896 0 1.7-.198 2.403-.584M6.153 4.54a2.25 2.25 0 012.186-2.186m0 0c-.896 0-1.7.198-2.403.584m2.403-.584a2.25 2.25 0 00-2.186 2.186m0 7.217a2.25 2.25 0 01-2.186 2.186m0 0c.896 0 1.7-.198 2.403-.584m-2.403.584a2.25 2.25 0 002.186 2.186m-2.186 0c-.896 0-1.7.198-2.403.584M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186A2.25 2.25 0 0116.5 10.5c.896 0 1.7-.198 2.403-.584m-2.403.584a2.25 2.25 0 00-2.186 2.186m-2.186 0a2.25 2.25 0 002.186 2.186m7.217-2.186c0 .896-.198 1.7-.584 2.403m.584-2.403a2.25 2.25 0 01-2.186 2.186M3.75 10.5c.896 0 1.7-.198 2.403-.584M6.153 4.54a2.25 2.25 0 012.186-2.186m0 0c-.896 0-1.7.198-2.403.584m2.403-.584a2.25 2.25 0 00-2.186 2.186m0 7.217a2.25 2.25 0 01-2.186 2.186m0 0c.896 0 1.7-.198 2.403-.584m-2.403.584a2.25 2.25 0 002.186 2.186m-2.186 0c-.896 0-1.7.198-2.403.584" />
            </svg>
          </button>
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

{showShareModal &&
  createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowShareModal(false)}>
      <div
        className="relative w-full max-w-md rounded-lg bg-white dark:bg-slate-800 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Compartir Reel</h3>
          <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <FriendSelector reelId={item.id} onClose={() => setShowShareModal(false)} />
        </div>
      </div>
    </div>,
    document.body
  )}
