import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import MacanudosLogo from "./MacanudosLogo";
import UserSearch from "./UserSearch";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import FriendRequests from "./FriendRequests";
import { Link as RouterLink } from "react-router-dom";

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navLink = (isActive) =>
    `${isActive ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"} px-2.5 py-1 rounded-full transition text-xs sm:text-sm`;

  return (
    <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 py-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <Link to="/feed" className="flex items-center gap-2">
              <MacanudosLogo showText size={90} />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Salir
              </button>
              <FriendRequests iconOnly />
              <NotificationBell iconOnly />
              <ThemeToggle iconOnly />
              <RouterLink
                to="/feed#composer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow-sm"
              >
                ✏️
              </RouterLink>
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60">
                Puntos: <span className="text-indigo-600 dark:text-indigo-300">{user?.points ?? 0}</span>
              </div>
              <Link to={`/profile/${user.username}`} className="flex items-center gap-2">
                <Avatar user={user} size={32} />
                <div className="leading-tight hidden md:block">
                  <div className="text-slate-900 dark:text-white font-semibold text-sm">{user.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">@{user.username}</div>
                </div>
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <nav className="flex flex-wrap items-center gap-2">
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

            <div className="w-full sm:w-72 md:w-80">
              <UserSearch />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
