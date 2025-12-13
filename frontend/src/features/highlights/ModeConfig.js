export const MODES = {
  CERCA: { label: "Cerca", accent: "#3B82F6", gradient: "from-blue-500 to-blue-700", autoplay: true },
  DESCUBRIR: { label: "Descubrir", accent: "#8B5CF6", gradient: "from-purple-500 to-indigo-500", autoplay: true },
  AHORA: { label: "Ahora", accent: "#F59E0B", gradient: "from-amber-400 to-orange-500", autoplay: true },
  PROFUNDO: { label: "Profundo", accent: "#0EA5E9", gradient: "from-cyan-500 to-blue-500", autoplay: false },
  CALMA: { label: "Calma", accent: "#10B981", gradient: "from-emerald-500 to-teal-500", autoplay: false },
  HUMOR: { label: "Humor", accent: "#F472B6", gradient: "from-pink-500 to-rose-500", autoplay: true },
  APRENDER: { label: "Aprender", accent: "#22D3EE", gradient: "from-sky-500 to-cyan-500", autoplay: false },
  CAOS: { label: "CAOS", accent: "#EF4444", gradient: "from-red-500 to-fuchsia-600", autoplay: true },
};

export const MODE_ORDER = ["CERCA", "DESCUBRIR", "AHORA", "PROFUNDO", "CALMA", "HUMOR", "APRENDER", "CAOS"];

export const CHAOS_DURATION_MS = 10 * 60 * 1000;
