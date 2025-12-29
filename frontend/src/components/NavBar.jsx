import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import MacanudosLogo from "./MacanudosLogo";
import UserSearch from "./UserSearch";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import FriendRequests from "./FriendRequests";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navLink = (isActive) =>
    `${isActive ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"} px-2.5 py-1 rounded-full smooth-transition text-xs sm:text-sm`;

  return (
    <header className="glass bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 py-0.5">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 min-w-[180px]"
          >
            <Link to="/feed" className="flex items-center gap-2">
              <MacanudosLogo showText size={90} />
            </Link>
          </motion.div>

          <nav className="flex items-center gap-1 flex-1 justify-center min-w-[200px]">
            <Link to="/feed" className={navLink(location.pathname === "/feed")}>
              Inicio
            </Link>
            <Link to="/chat" className={navLink(location.pathname === "/chat")}>
              Chat
            </Link>
            <Link to="/shop" className={navLink(location.pathname === "/shop")}>
              Tienda
            </Link>
            <Link to="/squads" className={navLink(location.pathname.startsWith("/squads"))}>
              Squads
            </Link>
            <Link to="/feedback" className={navLink(location.pathname === "/feedback")}>
              Ideas
            </Link>
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden md:block w-[200px]">
              <UserSearch />
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={logout}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 smooth-transition"
            >
              Salir
            </motion.button>
            <FriendRequests iconOnly />
            <NotificationBell iconOnly />
            <ThemeToggle iconOnly />
            <motion.div
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              <RouterLink
                to="/feed#composer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-semibold hover:from-indigo-500 hover:to-indigo-400 shadow-md smooth-transition"
              >
                ✏️
              </RouterLink>
            </motion.div>
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-sm smooth-transition">
              Puntos: <span className="text-indigo-600 dark:text-indigo-300 font-bold">{user?.points ?? 0}</span>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={`/profile/${user.username}`} className="flex items-center gap-2">
                <Avatar user={user} size={32} emotionColor={user?.currentEmotionColor || null} />
                <div className="leading-tight hidden md:block">
                  <div className="text-slate-900 dark:text-white font-semibold text-sm">{user.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">@{user.username}</div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
}
