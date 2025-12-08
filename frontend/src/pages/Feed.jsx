import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import PostComposer from "../components/PostComposer";
import PostCard from "../components/PostCard";
import { FeedTabs } from "../components/feed/FeedTabs";
import { RightSidebar } from "../components/layout/RightSidebar";

export default function Feed() {
  const [mode, setMode] = useState("forYou"); // forYou | squads | help | explore

  const { data, isLoading } = useQuery({
    queryKey: ["posts", mode],
    queryFn: async () => {
      const endpoint =
        mode === "forYou"
          ? "/posts/feed/personal"
          : mode === "help"
            ? "/posts/feed/help"
            : mode === "squads"
              ? "/posts"
              : "/posts";
      const { data } = await api.get(endpoint);
      return data;
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-4">
      <div id="composer" className="pt-2">
        <PostComposer />
      </div>

      <div className="grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 pb-16">
        <section className="space-y-4">
          <FeedTabs active={mode} onChange={setMode} />

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
        </section>

        <aside className="hidden md:block">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
}
