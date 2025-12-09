import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell({ label = "Notificaciones", iconOnly = false }) {
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
    <button
      onClick={markRead}
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
  );
}
