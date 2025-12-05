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
      const { data } = await api.get("/friends");
      return data || [];
    },
    refetchInterval: 15000,
  });

  const incoming = (data || []).filter((f) => f.status === "PENDING" && f.direction === "INCOMING");
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
