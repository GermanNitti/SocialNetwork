import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function TrendingHashtags() {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/hashtags/trending?limit=10");
        setTags(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    }
    load();
  }, []);

  if (!tags.length) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tendencias</h3>
      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
        {tags.map((tag) => (
          <li key={tag.id} className="flex items-center justify-between">
            <Link
              to={`/tag/${encodeURIComponent((tag.display || "").replace("#", ""))}`}
              className="text-indigo-600 dark:text-indigo-300 hover:underline"
            >
              {tag.display || `#${tag.canonical}`}
            </Link>
            <span className="text-xs text-slate-500 dark:text-slate-400">{tag.useCount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
