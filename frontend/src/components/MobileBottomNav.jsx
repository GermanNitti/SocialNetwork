import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function MobileBottomNav({ activeTab, onChange }) {
  const location = useLocation();
  const current = activeTab || "home";
  const btnRefs = useRef({});

  const handleClick = (id) => (e) => {
    onChange?.(id);
    const btn = e.currentTarget;
    btn.classList.remove("animate-ripple");
    void btn.offsetWidth;
    btn.classList.add("animate-ripple");
    setTimeout(() => btn.classList.remove("animate-ripple"), 700);
  };

  const navItems = [
    {
      id: "home",
      title: "Inicio",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
      ),
    },
    {
      id: "search",
      title: "Explorar",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      ),
    },
    {
      id: "create",
      title: "Crear",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      id: "squads",
      title: "Squads",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: "profile",
      title: "Perfil",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @keyframes rippleEffect {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.6); transform: translate(-50%, -50%) scale(0); }
          100% { box-shadow: 0 0 0 20px rgba(139, 92, 246, 0); transform: translate(-50%, -50%) scale(2); }
        }
        @keyframes iconBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .nav-button {
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .nav-button.animate-ripple::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          animation: rippleEffect 0.8s ease-out;
          pointer-events: none;
        }
        .nav-button.animate-ripple .icon-container {
          animation: iconBounce 0.7s ease-out;
        }
        .mobile-nav {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-50 h-[70px] md:hidden flex items-center justify-around px-2 safe-area-inset-bottom glass bg-gradient-to-t from-white/95 to-white/90 dark:from-slate-950/95 dark:to-slate-950/90 backdrop-blur-xl border-t border-slate-200/40 dark:border-slate-800/40 shadow-2xl">
        {navItems.map((item) => {
          const active = current === item.id;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.85 }}
              whileHover={{ y: -2 }}
              ref={(el) => (btnRefs.current[item.id] = el)}
              onClick={handleClick(item.id)}
              className={`nav-button relative flex flex-col items-center justify-center gap-1 px-3 py-2 w-full h-full rounded-2xl text-xs font-medium transition-all duration-200 ${
                active
                  ? "text-violet-600 dark:text-violet-400 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 shadow-lg scale-105"
                  : "text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className={`icon-container transition-all duration-200 ${active ? "text-violet-600 dark:text-violet-400" : "text-current"}`}>
                {item.icon}
              </span>
              <span className={`whitespace-nowrap text-[11px] font-semibold tracking-tight ${active ? "text-violet-700 dark:text-violet-300" : "text-current"}`}>
                {item.title}
              </span>
            </motion.button>
          );
        })}
      </nav>
    </>
  );
}
