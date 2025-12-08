import React from "react";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/60 backdrop-blur-md">
      {/* Izquierda: logo / brand */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center border border-emerald-400/40">
          <span className="text-sm font-bold text-emerald-300">M</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-white">Macanudo</span>
          <span className="text-[11px] text-white/40">Red social de buena vibra</span>
        </div>
      </div>

      {/* Centro: buscador */}
      <div className="hidden md:flex flex-1 justify-center px-4">
        <input
          placeholder="Buscar gente, temas, squads..."
          className="w-full max-w-md rounded-full bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
        />
      </div>

      {/* Derecha: acciones */}
      <div className="flex items-center gap-3">
        <button className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-300 transition">
          <span>+</span>
          <span>Crear post</span>
        </button>

        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition">
          🔔
        </button>

        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 overflow-hidden" />
      </div>
    </header>
  );
}
