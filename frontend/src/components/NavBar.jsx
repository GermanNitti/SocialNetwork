import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
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
    `${isActive ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"} px-3 py-2 rounded-full transition`;

  return (
    <header className="bg-white/90 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/feed"
              className="flex items-center gap-2 text-lg font-bold text-indigo-600 dark:text-indigo-300"
            >
              <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-indigo-600 text-white">
                M
              </span>
              <span>Macanudos</span>
            </Link>
            <div className="hidden md:block w-[380px]">
              <UserSearch />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={logout}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Salir
            </button>
            <FriendRequests iconOnly />
            <NotificationBell iconOnly />
            <ThemeToggle iconOnly />
            <RouterLink
              to="/feed#composer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 shadow-sm"
            >
              ✏️ Crear
            </RouterLink>
            <Link to={`/profile/${user.username}`} className="flex items-center gap-2">
              <Avatar user={user} size={40} />
              <div className="leading-tight hidden md:block">
                <div className="text-slate-900 dark:text-white font-semibold">{user.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</div>
              </div>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[260px] md:hidden">
            <UserSearch />
          </div>
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <Link to="/feed" className={navLink(location.pathname === "/feed")}>
              Inicio
            </Link>
            <Link to="/chat" className={navLink(location.pathname === "/chat")}>
              Chat
            </Link>
            <Link
              to={`/profile/${user.username}`}
              className={navLink(
                location.pathname.startsWith("/profile/") && location.pathname !== "/profile/edit"
              )}
            >
              Perfil
            </Link>
            <Link to="/profile/edit" className={navLink(location.pathname === "/profile/edit")}>
              Editar
            </Link>
            <Link to="/settings" className={navLink(location.pathname === "/settings")}>
              Personaliza
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
            <div className="px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60">
              Puntos: <span className="text-indigo-600 dark:text-indigo-300">{user?.points ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
