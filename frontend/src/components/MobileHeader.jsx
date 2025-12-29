import { Link } from "react-router-dom";
import MacanudosLogo from "./MacanudosLogo";
import NotificationBell from "./NotificationBell";
import FriendRequests from "./FriendRequests";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { motion } from "framer-motion";

export default function MobileHeader() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between glass border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/95 px-3 py-2 md:hidden backdrop-blur-md shadow-sm text-slate-900 dark:text-slate-50">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link to="/feed" className="flex items-center gap-2">
          <MacanudosLogo showText size={80} />
        </Link>
      </motion.div>
      <div className="flex items-center gap-2">
        <FriendRequests iconOnly />
        <NotificationBell iconOnly />
        <ThemeToggle iconOnly />
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link to={`/profile/${user.username}`}>
            <Avatar user={user} size={32} />
          </Link>
        </motion.div>
      </div>
    </header>
  );
}
