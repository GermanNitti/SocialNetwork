import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MODES } from "./ModeConfig";
import { REACTIONS, REACTION_ORDER } from "../../constants/reactions";
import api from "../../api/client";
import { AirplaneIcon, ChevronIcon, CloseIcon } from "../../components/icons/Icons";
import Burst from "../../components/Burst";

export default function HighlightViewer({ open, items = [], index = 0, onClose, mode }) {
  const [activeIndex, setActiveIndex] = useState(index);
  const [videoReady, setVideoReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);
  const [showShare, setShowShare] = useState(false);
  const [friends, setFriends] = useState([]);
  const [sharingTo, setSharingTo] = useState(null);
  // map of reaction by item id (or index fallback)
  const [localReactions, setLocalReactions] = useState({});
  const [reactionsExpanded, setReactionsExpanded] = useState(true);
  const [friendsReactions, setFriendsReactions] = useState([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

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

  // load friend reactions for the current item when index changes
  useEffect(() => {
    if (!open) return;
    const item = items[activeIndex];
    if (!item || !item.id) {
      setFriendsReactions([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get(`/posts/${encodeURIComponent(item.id)}/reactions`);
        if (!mounted) return;
        // expected data: array of { user, type }
        setFriendsReactions(Array.isArray(data) ? data : []);
      } catch (err) {
        // fallback: empty
        setFriendsReactions([]);
      }
    })();
    return () => { mounted = false; };
  }, [open, activeIndex, items]);

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

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    const currentX = e.touches?.[0]?.clientX ?? 0;
    touchDeltaX.current = currentX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    const delta = touchDeltaX.current || 0;
    const THRESHOLD = 50; // pixels
    if (delta > THRESHOLD) {
      // swipe right -> previous
      handlePrev();
    } else if (delta < -THRESHOLD) {
      // swipe left -> next
      handleNext();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const openShare = async () => {
    setShowShare(true);
    try {
      const { data } = await api.get("/friends");
      const list = Array.isArray(data) ? data : Array.isArray(data?.friends) ? data.friends : [];
      setFriends(list);
    } catch (err) {
      console.warn("Error loading friends", err);
      setFriends([]);
    }
  };

  const shareToFriend = async (friend) => {
    if (!friend || !friend.username) return;
    try {
      await api.post(`/chat/to/${encodeURIComponent(friend.username)}`, {
        content: `Te compartí este reel: ${item.url}`,
      });
      setSharingTo(friend.username);
      setTimeout(() => {
        setShowShare(false);
        setSharingTo(null);
      }, 1000);
    } catch (err) {
      console.error("Error sharing reel:", err);
    }
  };

  const reactWith = (type) => {
    // Optimistic UI: set local reaction for this specific item and trigger burst
    const id = item?.id ?? `index_${activeIndex}`;
    const prev = localReactions[id];
    const willRemove = prev === type;

    // optimistic update
    setLocalReactions((prevMap) => {
      const next = { ...prevMap };
      if (willRemove) delete next[id];
      else next[id] = type;
      return next;
    });

    // show burst animation
    setBurst({ id, type });

    // persist on server (POST toggles if same type)
    (async () => {
      try {
        const res = await api.post(`/posts/${encodeURIComponent(id)}/reactions`, { type });
        const serverUserReaction = res?.data?.userReaction ?? res?.userReaction ?? null;
        setLocalReactions((prevMap) => {
          const next = { ...prevMap };
          if (serverUserReaction) next[id] = serverUserReaction;
          else delete next[id];
          return next;
        });
      } catch (err) {
        // rollback optimistic change on error
        console.error('Error persisting reaction', err);
        setLocalReactions((prevMap) => {
          const next = { ...prevMap };
          if (prev) next[id] = prev; else delete next[id];
          return next;
        });
      }
    })();
  };

  const handleTimeUpdate = (e) => {
    const video = e.target;
    if (video.duration) {
      const percentage = (video.currentTime / video.duration) * 100;
      setProgress(percentage);
    }
  };

  const [burst, setBurst] = useState(null);

  const onBurstComplete = () => {
    // clear burst after animation completes
    setBurst(null);
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
            className="absolute inset-0 w-full h-full object-cover"
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

        <motion.button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Cerrar"
          whileTap={{ scale: 0.95 }}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-lg"
        >
          <CloseIcon className="w-4 h-4 text-white" />
        </motion.button>

        {/* Reactions / share column (collapsible) */}
        <AnimatePresence>
          {reactionsExpanded && (
            <motion.div
              initial={{ x: 36, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 36, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute right-3 top-1/3 z-30 flex flex-col items-center gap-3"
            >
              {REACTION_ORDER.map((key) => {
                const reaction = REACTIONS[key];
                if (!reaction) return null;
                const id = item?.id ?? `index_${activeIndex}`;
                const active = localReactions[id] === key;
                return (
                  <motion.button
                    key={key}
                    onClick={(e) => { e.stopPropagation(); reactWith(key); }}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    animate={active ? { scale: 1.05 } : { scale: 1 }}
                    className={`flex items-center justify-center w-11 h-11 rounded-full border ${active ? "bg-emerald-400 text-white" : "bg-black/40 text-white/90"}`}
                    title={reaction.label}
                    aria-pressed={active}
                    aria-label={`Reaccionar: ${reaction.label}`}
                  >
                    <span className="text-lg" aria-hidden>{reaction.icon}</span>
                  </motion.button>
                );
              })}

              <motion.button
                onClick={(e) => { e.stopPropagation(); openShare(); }}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.03 }}
                className="flex items-center justify-center w-11 h-11 rounded-full border bg-black/40 text-white/90"
                title="Enviar a un amigo"
                aria-label="Enviar a un amigo"
              >
                <AirplaneIcon className="w-4 h-4 text-white" />
              </motion.button>

              {/* toggle collapse/expand reactions list */}
              <motion.button
                onClick={(e) => { e.stopPropagation(); setReactionsExpanded((s) => !s); }}
                whileTap={{ scale: 0.92 }}
                className="flex items-center justify-center w-11 h-11 rounded-full border bg-black/30 text-white/90"
                title={reactionsExpanded ? "Ocultar reacciones" : "Mostrar reacciones"}
                aria-expanded={reactionsExpanded}
              >
                <ChevronIcon direction={reactionsExpanded ? 'down' : 'right'} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
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
        {/* Burst animation over the active reel when reacting */}
        {burst && burst.id === (item?.id ?? `index_${activeIndex}`) && (
          <Burst icon={REACTIONS[burst.type]?.icon || '❤'} color="#ff7a7a" onComplete={onBurstComplete} />
        )}
      </div>

      <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-200">
        <div className="px-3 py-1 rounded-full border border-white/20" style={{ color: accent }}>Reels: {MODES[mode]?.label || "Modo"}</div>
        <div className="text-slate-400">{item.contentType || item.type || ""}</div>
      </div>
      <AnimatePresence>
        {showShare && (
          <motion.div className="fixed inset-0 z-40 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/60" onClick={() => setShowShare(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 30 }} className="bg-white dark:bg-slate-900 rounded-t-2xl p-4 w-full max-w-md mx-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Enviar a...</h3>
                <button className="text-xs text-indigo-600" onClick={() => setShowShare(false)}>Cerrar</button>
              </div>
              {sharingTo && <div className="mb-2 text-sm text-green-600">Enviado a {sharingTo}</div>}
              <div className="max-h-60 overflow-auto space-y-2">
                {friends.length === 0 && <div className="text-sm text-slate-500">No hay amigos para mostrar.</div>}
                {friends.map((f) => (
                  <motion.button
                    key={f.id}
                    onClick={() => shareToFriend(f)}
                    whileTap={{ scale: 0.99 }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-sm">{f.name || f.username}</div>
                      <div className="text-xs text-slate-500">@{f.username}</div>
                    </div>
                    <div className="text-xs text-slate-400">Enviar</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* friends reactions modal (expanded list) */}
      <AnimatePresence>
        {showFriendsModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/60" onClick={() => setShowFriendsModal(false)} initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} className="bg-white dark:bg-slate-900 rounded-lg p-4 w-full max-w-sm z-60">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">Reacciones de amigos</h4>
                <button className="text-xs text-slate-500" onClick={() => setShowFriendsModal(false)}>Cerrar</button>
              </div>
              <div className="max-h-64 overflow-auto space-y-2">
                {friendsReactions.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-1">
                    <img src={r.user?.avatar || r.user?.avatarUrl || '/public/default-avatar.png'} alt={r.user?.name || r.user?.username} className="h-8 w-8 rounded-full object-cover" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{r.user?.name || r.user?.username}</div>
                      <div className="text-xs text-slate-500">{REACTIONS[r.type]?.label || r.type}</div>
                    </div>
                    <div className="text-lg">{REACTIONS[r.type]?.icon || '❤'}</div>
                  </div>
                ))}
                {friendsReactions.length === 0 && <div className="text-sm text-slate-500">No hay reacciones de amigos.</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
