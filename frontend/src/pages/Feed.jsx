import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import PostComposer from "../components/PostComposer";
import PostCard from "../components/PostCard";
import { FeedTabs } from "../components/feed/FeedTabs";
import { RightSidebar } from "../components/layout/RightSidebar";
import MobileHighlightsSection from "../features/highlights/MobileHighlightsSection";
import { FeedSkeleton } from "../components/Skeleton";

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
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.posts)
          ? data.posts
          : [];
      if (!Array.isArray(list)) {
        console.warn("[Feed] Respuesta inesperada en", endpoint, data);
      }
      return list;
    },
  });
  const posts = Array.isArray(data) ? data : [];

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-4">
      {import.meta.env.VITE_ENABLE_HIGHLIGHTS === "1" && <MobileHighlightsSection />}

      <div id="composer" className="pt-2">
        <PostComposer />
      </div>

      <div className="grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 pb-16">
        <section className="space-y-4">
          <FeedTabs active={mode} onChange={setMode} />

          {isLoading && <FeedSkeleton count={3} />}
          {!isLoading && posts.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
              Aún no hay publicaciones. ¡Crea la primera!
            </div>
          )}
          {!isLoading &&
            posts.map((post) => (
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
