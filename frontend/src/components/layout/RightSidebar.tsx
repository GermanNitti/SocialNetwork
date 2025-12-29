import React from "react";
import { motion } from "framer-motion";

const CardBase: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 p-4 text-slate-900 dark:text-slate-50 shadow-lg backdrop-blur-xl"
  >
    <h2 className="text-sm font-semibold mb-3 flex items-center justify-between">
      <span>{title}</span>
    </h2>
    {children}
  </motion.div>
);

const HoyEnMacanudoCard: React.FC = () => (
  <CardBase title="Hoy en Macanudos">
    <p className="text-xs text-slate-600 dark:text-slate-400">
      Estás en modo <span className="text-emerald-600 dark:text-emerald-400 font-semibold">creativo</span>. Compartiste proyectos y mates con la comunidad.
      <span className="ml-1">✨</span>
    </p>
  </CardBase>
);

const TusProyectosCard: React.FC = () => (
  <CardBase title="Tus proyectos">
    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
      <li className="flex flex-col p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-slate-900 dark:text-slate-100">Aprender React</span>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
          <div className="h-full w-[40%] bg-indigo-500 rounded-full" />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Progreso: 40% · 3 posts</span>
      </li>
      <li className="flex flex-col p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-slate-900 dark:text-slate-100">Bajar 10kg caminando</span>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
          <div className="h-full w-[10%] bg-indigo-500 rounded-full" />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Progreso: 10% · 1 post</span>
      </li>
    </ul>
  </CardBase>
);

const GenteComoVosCard: React.FC = () => (
  <CardBase title="Gente como vos">
    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
      <li className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer hover:pl-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
        <div className="flex-1">
          <div className="flex justify-between">
            <span className="font-medium text-slate-900 dark:text-slate-100">@f1ycode</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-500">F1 · Programación</span>
        </div>
      </li>
      <li className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer hover:pl-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
        <div className="flex-1">
          <span className="font-medium text-slate-900 dark:text-slate-100">@mateanddev</span>
          <span className="text-xs text-slate-500 dark:text-slate-500">Mate · Proyectos locos</span>
        </div>
      </li>
    </ul>
  </CardBase>
);

const TrendingHoyCard: React.FC = () => (
  <CardBase title="Trending hoy">
    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
      <li className="flex justify-between p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-slate-900 dark:text-slate-100">#F1</span>
        <span className="text-xs text-indigo-600 dark:text-indigo-400">+128 posts</span>
      </li>
      <li className="flex justify-between p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-slate-900 dark:text-slate-100">#mate</span>
        <span className="text-xs text-indigo-600 dark:text-indigo-400">+76 posts</span>
      </li>
      <li className="flex justify-between p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200 cursor-pointer">
        <span className="font-medium text-slate-900 dark:text-slate-100">#proyectos</span>
        <span className="text-xs text-indigo-600 dark:text-indigo-400">+33 posts</span>
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
