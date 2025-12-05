import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api/client";

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    api
      .get("/users/search", { params: { q: query.trim() } })
      .then(({ data }) => {
        if (active) setResults(data || []);
      })
      .catch(() => {
        if (active) setResults([]);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-sm focus-within:border-indigo-400">
        <span className="text-slate-400">🔎</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar personas..."
          className="w-full bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>
      <AnimatePresence>
        {query && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-30 mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 shadow-xl backdrop-blur"
          >
            {loading && <div className="px-4 py-3 text-sm text-slate-500">Buscando...</div>}
            {!loading &&
              results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    navigate(`/profile/${u.username}`);
                    setQuery("");
                    setResults([]);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-indigo-50/70 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-slate-500">@{u.username}</div>
                    </div>
                    <span className="text-xs text-slate-400">Ver perfil</span>
                  </div>
                </button>
              ))}
            {!loading && results.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-500">Sin resultados</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
