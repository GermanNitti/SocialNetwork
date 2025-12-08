export default function FeedTabs({ mode, onChange }) {
  const tabs = [
    { key: "personal", label: "Para vos" },
    { key: "squads", label: "Squads" },
    { key: "help", label: "Ayuda" },
    { key: "global", label: "Explorar" },
  ];

  return (
    <div className="inline-flex items-center bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm overflow-hidden">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 text-sm font-semibold transition ${
            mode === tab.key
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
