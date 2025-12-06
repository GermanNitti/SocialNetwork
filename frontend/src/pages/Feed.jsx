import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import PostComposer from "../components/PostComposer";
import PostCard from "../components/PostCard";

export default function Feed() {
  const [mode, setMode] = useState("global"); // "global" | "personal"

  const { data, isLoading } = useQuery({
    queryKey: ["posts", mode],
    queryFn: async () => {
      const endpoint = mode === "personal" ? "/feed/personal" : "/posts";
      const { data } = await api.get(endpoint);
      return data;
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PostComposer />

      <div className="flex gap-2">
        <button
          onClick={() => setMode("global")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
            mode === "global"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setMode("personal")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
            mode === "personal"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Para vos
        </button>
      </div>

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
          <PostCard key={post.id} post={post} />
        ))}
    </div>
  );
}
