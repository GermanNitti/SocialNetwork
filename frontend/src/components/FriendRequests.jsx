import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import Avatar from "./Avatar";
import ChatModal from "./ChatModal";

export default function FriendRequests({ iconOnly = false }) {
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/friends");
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.requests)
            ? data.requests
            : Array.isArray(data?.friendRequests)
              ? data.friendRequests
              : [];
        if (!Array.isArray(list)) {
          // fallback defensivo para evitar crasheos si la API no responde con array
          console.warn("[FriendRequests] Respuesta inesperada de /friends", data);
        }
        return list;
      } catch (err) {
        console.warn("[FriendRequests] Error cargando solicitudes", err);
        return [];
      }
    },
    refetchInterval: 15000,
  });

  const safeRequests = Array.isArray(data) ? data : [];
  const incoming = safeRequests.filter(
    (f) =>
      (f.status === "PENDING" || f.status === "PENDIENTE") && f.direction === "INCOMING"
  );
  const badge = incoming.length;

  const accept = useMutation({
    mutationFn: async (username) => api.post(`/friends/${username}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      setOpen(false);
    },
  });

  const reject = useMutation({
    mutationFn: async (username) => api.delete(`/friends/${username}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      setOpen(false);
    },
  });

  const openChat = (user) => {
    setChatTarget({
      username: user.username,
      name: user.name,
      avatar: user.avatar
    });
    setChatOpen(true);
    setOpen(false);
  };

  const baseClasses =
    "relative border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          iconOnly
            ? `${baseClasses} h-10 w-10 rounded-full flex items-center justify-center text-lg`
            : `${baseClasses} px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2`
        }
        aria-label="Solicitudes de amistad"
      >
        <span aria-hidden>{"\u{1F91D}"}</span>
        {!iconOnly && <span>Amigos</span>}
        <AnimatePresence>
          {badge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2"
            >
              {badge}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900 shadow-xl backdrop-blur z-30"
          >
            <div className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Solicitudes de amistad
            </div>
            {incoming.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-500">No tienes solicitudes pendientes.</div>
            )}
            {incoming.map((f) => (
              <div
                key={f.user.id}
                className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100"
              >
                <Link to={`/profile/${f.user.username}`} className="flex items-center gap-3 hover:opacity-90">
                  <Avatar user={f.user} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{f.user.name}</div>
                    <div className="text-xs text-slate-500">@{f.user.username}</div>
                  </div>
                </Link>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => accept.mutate(f.user.username)}
                    className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => openChat(f.user)}
                    className="flex-1 px-3 py-2 rounded-lg border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => {
                      const confirmed = window.confirm("¿Seguro que quieres eliminar esta solicitud/amigo?");
                      if (confirmed) reject.mutate(f.user.username);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {chatOpen && chatTarget && (
          <ChatModal
            targetUsername={chatTarget.username}
            targetName={chatTarget.name}
            targetAvatar={chatTarget.avatar}
            onClose={() => setChatOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
