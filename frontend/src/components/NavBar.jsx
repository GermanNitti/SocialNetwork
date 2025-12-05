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

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/feed" className="text-xl font-semibold text-indigo-700 dark:text-indigo-300">
          Socialito
        </Link>
        <div className="flex-1">
          <UserSearch />
        </div>
        <nav className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-200">
          <Link
            to="/feed"
            className={`px-3 py-2 rounded-lg ${location.pathname === "/feed" ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            Feed
          </Link>
          <Link
            to="/chat"
            className={`px-3 py-2 rounded-lg ${location.pathname === "/chat" ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            Chat
          </Link>
          <Link
            to={`/profile/${user.username}`}
            className={`px-3 py-2 rounded-lg ${location.pathname.startsWith("/profile/") && location.pathname !== "/profile/edit" ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            Perfil
          </Link>
          <Link
            to="/profile/edit"
            className={`px-3 py-2 rounded-lg ${location.pathname === "/profile/edit" ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            Editar
          </Link>
          <Link
            to="/settings"
            className={`px-3 py-2 rounded-lg ${location.pathname === "/settings" ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            Personaliza
          </Link>
          <FriendRequests />
          <NotificationBell />
          <ThemeToggle />
          <button
            onClick={logout}
            className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Salir
          </button>
          <Link to={`/profile/${user.username}`} className="flex items-center gap-2">
            <Avatar user={user} size={36} />
            <div className="leading-tight">
              <div className="text-slate-900 dark:text-slate-100">{user.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</div>
            </div>
          </Link>
        </nav>
      </div>
    </header>
  );
}
