export const baseThemes = {
  nature: {
    gradient: "from-emerald-100 via-emerald-200 to-green-100",
    accent: "text-emerald-700",
  },
  racing: {
    gradient: "from-slate-900 via-red-900 to-slate-800",
    accent: "text-red-400",
  },
  space: {
    gradient: "from-indigo-900 via-slate-900 to-indigo-800",
    accent: "text-indigo-300",
  },
  tech: {
    gradient: "from-slate-900 via-cyan-900 to-slate-800",
    accent: "text-cyan-300",
  },
};

export function getThemeGradient(theme) {
  const key = theme?.key || "nature";
  const conf = baseThemes[key] || baseThemes.nature;
  return conf.gradient;
}
