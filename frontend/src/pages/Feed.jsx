import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import PostComposer from "../components/PostComposer";
import PostCard from "../components/PostCard";
import SuggestedUsers from "../components/SuggestedUsers";
import TrendingHashtags from "../components/TrendingHashtags";

export default function Feed() {
  const [mode, setMode] = useState("global"); // global | personal | help

  const { data, isLoading } = useQuery({
    queryKey: ["posts", mode],
    queryFn: async () => {
      const endpoint =
        mode === "personal" ? "/feed/personal" : mode === "help" ? "/posts/feed/help" : "/posts";
      const { data } = await api.get(endpoint);
      return data;
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <PostComposer />

      <div className="flex gap-2">
        {["global", "personal", "help"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              mode === m
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {m === "global" ? "Global" : m === "personal" ? "Para vos" : "Ayuda"}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <div className="space-y-4">
          {isLoading && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
              Cargando publicaciones...
            </div>
          )}
          {!isLoading && (!data || data.length === 0) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
              Aún no hay publicaciones. ¡Crea la primera!
            </div>
          )}
          {!isLoading &&
            data?.map((post) => (
              <PostCard key={post.id} post={post} showHelpHighlight={mode === "help"} />
            ))}
        </div>
        <div className="space-y-4">
          <SuggestedUsers limit={6} />
          <TrendingHashtags />
        </div>
      </div>
    </div>
  );
}
