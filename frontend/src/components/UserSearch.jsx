import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Avatar from "./Avatar";

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
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar personas..."
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
        aria-label="Buscar personas"
      />
      {query && (
        <div className="absolute z-30 mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
          {loading && <div className="px-3 py-2 text-sm text-slate-500">Buscando...</div>}
          {!loading &&
            results.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  navigate(`/profile/${u.username}`);
                  setQuery("");
                  setResults([]);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-slate-800 transition flex items-center gap-3"
              >
                <Avatar user={u} size={36} />
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-slate-500">@{u.username}</div>
                </div>
              </button>
            ))}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">Sin resultados</div>
          )}
        </div>
      )}
    </div>
  );
}
