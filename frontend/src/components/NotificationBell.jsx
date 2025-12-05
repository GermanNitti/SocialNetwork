import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell({ label = "Notificaciones" }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications");
      return data || [];
    },
    refetchInterval: 15000,
  });

  const unread = (data || []).filter((n) => !n.readAt).length;

  const markRead = async () => {
    await api.post("/notifications/read");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <button
      onClick={markRead}
      className="relative px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
    >
      🔔 {label}
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
