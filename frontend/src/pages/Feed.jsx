import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import PostComposer from "../components/PostComposer";
import PostCard from "../components/PostCard";

export default function Feed() {
  const { data, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data } = await api.get("/posts");
      return data;
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PostComposer />
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
