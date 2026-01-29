import { Link } from "react-router-dom";
import MacanudosLogo from "./MacanudosAnimatedLogo";
import NotificationBell from "./NotificationBell";
import MessageNotifications from "./MessageNotifications";
import FriendRequests from "./FriendRequests";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { motion } from "framer-motion";
import { useState } from "react";
import { getActiveEvent, getTestModeEvent, getTestableEvent } from "./events/EventManager";
import { EVENT_CONFIG } from "./events/EventConfig";

// Icono Play SVG
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export default function MobileHeader() {
  const { user, logout } = useAuth();
  const [testEvent, setTestEvent] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const activeEvent = getActiveEvent();
  const testModeEvent = getTestModeEvent();
  const testableEvent = getTestableEvent();
  const eventToTest = testModeEvent || testableEvent || activeEvent;
  const EventComponent = testEvent ? eventToTest?.component : null;

  const handleTestEvent = () => {
    if (eventToTest && EVENT_CONFIG.allowTestMode) {
      setTestEvent(true);
    }
  };

  const showTestButton = false;

  if (!user) return null;

  return (
    <>
      {testEvent && EventComponent && <EventComponent onComplete={() => setTestEvent(false)} />}

      <header className="sticky top-0 z-40 flex items-center justify-between glass border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/95 px-3 py-2 md:hidden backdrop-blur-md shadow-sm text-slate-900 dark:text-slate-50">
        {/* Overlay para cerrar menú */}
        {showUserMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
        )}
        <div className="flex items-center gap-2">
          {showTestButton && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={handleTestEvent}
              className="p-1.5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all"
              title={`Probar: ${eventToTest?.name || 'evento'}`}
            >
              <PlayIcon />
            </motion.button>
          )}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to="/feed" className="flex items-center gap-2">
              <MacanudosLogo size={60} />
            </Link>
          </motion.div>
        </div>
        <div className="flex items-center gap-2">
          <MessageNotifications />
          <FriendRequests iconOnly />
          <NotificationBell iconOnly />
          <ThemeToggle iconOnly />
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative"
              >
                <Avatar user={user} size={32} />
              </button>
            </motion.div>
            
            {/* Menú desplegable */}
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <Link
                  to={`/profile/${user.username}`}
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Ver mi perfil
                </Link>
                <Link
                  to="/profile/edit"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  Editar perfil
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  Configuración
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                  Cerrar sesión
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
