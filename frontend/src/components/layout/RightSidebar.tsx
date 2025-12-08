import React from "react";

const CardBase: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-sm shadow-black/30">
    <h2 className="text-sm font-semibold mb-2 flex items-center justify-between">
      <span>{title}</span>
    </h2>
    {children}
  </div>
);

const HoyEnMacanudoCard: React.FC = () => (
  <CardBase title="Hoy en Macanudo">
    <p className="text-xs text-white/70">
      Estás en modo <span className="text-emerald-300">creativo</span>. Compartiste proyectos y mates con la comunidad.
      ✨
    </p>
  </CardBase>
);

const TusProyectosCard: React.FC = () => (
  <CardBase title="Tus proyectos">
    <ul className="text-xs text-white/80 space-y-2">
      <li className="flex flex-col">
        <span className="font-medium">Aprender React</span>
        <span className="text-white/40">Progreso: 40% · 3 posts</span>
      </li>
      <li className="flex flex-col">
        <span className="font-medium">Bajar 10kg caminando</span>
        <span className="text-white/40">Progreso: 10% · 1 post</span>
      </li>
    </ul>
  </CardBase>
);

const GenteComoVosCard: React.FC = () => (
  <CardBase title="Gente como vos">
    <ul className="text-xs text-white/80 space-y-2">
      <li className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="flex justify-between">
            <span className="font-medium">@f1ycode</span>
          </div>
          <span className="text-white/40">F1 · Programación</span>
        </div>
      </li>
      <li className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-white/10" />
        <div className="flex-1">
          <span className="font-medium">@mateanddev</span>
          <div className="text-white/40">Mate · Proyectos locos</div>
        </div>
      </li>
    </ul>
  </CardBase>
);

const TrendingHoyCard: React.FC = () => (
  <CardBase title="Trending hoy">
    <ul className="text-xs text-white/80 space-y-1.5">
      <li className="flex justify-between">
        <span>#F1</span>
        <span className="text-white/40">+128 posts</span>
      </li>
      <li className="flex justify-between">
        <span>#mate</span>
        <span className="text-white/40">+76 posts</span>
      </li>
      <li className="flex justify-between">
        <span>#proyectos</span>
        <span className="text-white/40">+33 posts</span>
      </li>
    </ul>
  </CardBase>
);

export const RightSidebar: React.FC = () => {
  return (
    <aside className="space-y-4">
      <HoyEnMacanudoCard />
      <TusProyectosCard />
      <GenteComoVosCard />
      <TrendingHoyCard />
    </aside>
  );
};
