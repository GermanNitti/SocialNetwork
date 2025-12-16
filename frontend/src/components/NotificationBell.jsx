import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function NotificationBell({ label = "Notificaciones", iconOnly = false }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/notifications");
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.notifications)
            ? data.notifications
            : [];
        if (!Array.isArray(list)) {
          console.warn("[NotificationBell] Respuesta inesperada de /notifications", data);
        }
        return list;
      } catch (err) {
        console.warn("[NotificationBell] Error cargando notificaciones", err);
        return [];
      }
    },
    refetchInterval: 15000,
  });

  const safeNotifications = Array.isArray(data) ? data : [];
  const unread = safeNotifications.filter((n) => !n.readAt).length;

  const markRead = async () => {
    await api.post("/notifications/read");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const baseClasses =
    "relative border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition";

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          markRead();
        }}
        className={
          iconOnly
            ? `${baseClasses} h-10 w-10 rounded-full flex items-center justify-center text-lg`
            : `${baseClasses} px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2`
        }
        aria-label={label}
      >
        <span aria-hidden>{"\u{1F514}"}</span>
        {!iconOnly && <span>{label}</span>}
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2"
            >
              {unread}
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
            className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900 shadow-xl backdrop-blur z-30 md:hidden"
          >
            <div className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>Notificaciones</span>
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-indigo-600 hover:text-indigo-400"
              >
                Cerrar
              </button>
            </div>
            {safeNotifications.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-500">Sin notificaciones.</div>
            )}
            {safeNotifications.map((n) => (
              <div
                key={n.id}
                className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100"
              >
                {(() => {
                  const actor = n.user?.name || n.actorName || n.actorUsername || "Alguien";
                  const post = n.postTitle ? ` en "${n.postTitle}"` : n.postId ? ` en tu post #${n.postId}` : "";
                  let desc = n.message || n.type || "Notificación";
                  if (!n.message) {
                    if (n.type === "REACTION") desc = `${actor} reaccionó${post}`;
                    else if (n.type === "COMMENT") desc = `${actor} comentó${post}`;
                    else if (n.type === "REEL_SHARED") desc = `${n.metadata?.sharerUsername || actor} compartió un reel contigo.`;
                    else if (n.type === "FOLLOW" || n.type === "FRIEND_REQUEST") desc = `${actor} quiere conectar`;
                  }
                  return n.link ? (
                    <Link to={n.link} onClick={() => setOpen(false)} className="hover:underline">
                      {desc}
                    </Link>
                  ) : (
                    <span>{desc}</span>
                  );
                })()}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
