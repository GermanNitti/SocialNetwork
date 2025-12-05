import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import UserSearch from "./UserSearch";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import FriendRequests from "./FriendRequests";

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navLink = (isActive) =>
    `${isActive ? "bg-indigo-600 text-white" : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"} px-3 py-2 rounded-full transition`;

  return (
    <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/feed" className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
              Socialito
            </Link>
            <div className="hidden md:block w-[420px]">
              <UserSearch />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/profile/${user.username}`} className="flex items-center gap-2">
              <Avatar user={user} size={40} />
              <div className="leading-tight">
                <div className="text-slate-900 dark:text-white font-semibold">{user.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</div>
              </div>
            </Link>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[260px] md:hidden">
            <UserSearch />
          </div>
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <Link to="/feed" className={navLink(location.pathname === "/feed")}>
              Feed
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
            <Link
              to="/profile/edit"
              className={navLink(location.pathname === "/profile/edit")}
            >
              Editar
            </Link>
            <Link
              to="/settings"
              className={navLink(location.pathname === "/settings")}
            >
              Personaliza
            </Link>
            <Link to="/shop" className={navLink(location.pathname === "/shop")}>
              Tienda
            </Link>
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <FriendRequests iconOnly />
            <NotificationBell iconOnly />
            <ThemeToggle iconOnly />
            <div className="px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
              Puntos: <span className="text-indigo-600 dark:text-indigo-300">{user?.points ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
