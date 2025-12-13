import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import Avatar from "./Avatar";

export default function FriendRequests({ iconOnly = false }) {
  const [open, setOpen] = useState(false);
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
        <span aria-hidden>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 13h8a4 4 0 014 4v1a1 1 0 01-1 1h-3.5l-1.3 2.167a1 1 0 01-1.7 0L10.5 19H7a1 1 0 01-1-1v-1a4 4 0 014-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 15l-2 2m12-2l2 2m-12 0l2-2m8 2l2-2" />
          </svg>
        </span>
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
                  <div>
                    <div className="font-semibold">{f.user.name}</div>
                    <div className="text-xs text-slate-500">@{f.user.username}</div>
                  </div>
                </Link>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => accept.mutate(f.user.username)}
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => {
                      const confirmed = window.confirm("¿Seguro que quieres eliminar esta solicitud/amigo?");
                      if (confirmed) reject.mutate(f.user.username);
                    }}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
