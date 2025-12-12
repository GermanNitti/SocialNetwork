import React from "react";
import { useLocation } from "react-router-dom";

export default function MobileBottomNav({ activeTab, onChange }) {
  const location = useLocation();
  const current = activeTab || "home";

  const navItems = [
    {
      id: "home",
      title: "Inicio",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "chat",
      title: "Chat",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: "shop",
      title: "Tienda",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18l-1 7H4L3 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10h14l-1 10H6L5 10z" />
        </svg>
      ),
    },
    {
      id: "squads",
      title: "Squads",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5V4h-5M7 20H2V4h5m1 4h6m-6 4h6" />
        </svg>
      ),
    },
    {
      id: "ideas",
      title: "Ideas",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m7-9h2M3 12H1m15.364-6.364l1.414 1.414M6.343 17.657l-1.414 1.414m0-12.728l1.414 1.414m12.728 12.728l-1.414-1.414" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h8l-1 5H9l-1-5zM9 9h6v5H9z" />
        </svg>
      ),
    },
    {
      id: "search",
      title: "Buscar",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-800 bg-slate-950/95 px-2 backdrop-blur md:hidden">
      {navItems.map((item) => {
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange?.(item.id)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              active
                ? "text-indigo-300"
                : "text-slate-400 hover:text-indigo-200"
            }`}
          >
            <span className="h-6 w-6">{item.icon}</span>
            <span className="whitespace-nowrap">{item.title}</span>
          </button>
        );
      })}
    </nav>
  );
}
