import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import api from "../api/client";
import PostCard from "../components/PostCard";

export default function SquadDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const squadId = Number(id);

  const { data: squad, isLoading } = useQuery({
    queryKey: ["squad", squadId],
    queryFn: async () => {
      const { data } = await api.get(`/squads/${squadId}`);
      return data;
    },
    enabled: !Number.isNaN(squadId),
  });

  const { data: posts } = useQuery({
    queryKey: ["squad-posts", squadId],
    queryFn: async () => {
      const { data } = await api.get(`/squads/${squadId}/posts`);
      return data;
    },
    enabled: !Number.isNaN(squadId),
  });

  const join = useMutation({
    mutationFn: async () => api.post(`/squads/${squadId}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squad", squadId] });
      queryClient.invalidateQueries({ queryKey: ["squads"] });
    },
  });
  const leave = useMutation({
    mutationFn: async () => api.post(`/squads/${squadId}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squad", squadId] });
      queryClient.invalidateQueries({ queryKey: ["squads"] });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
        Cargando squad...
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
        Squad no encontrado.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{squad.name}</h1>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            {squad.type}
          </span>
          <span className="ml-auto text-xs text-slate-500">{squad.membersCount} miembros</span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300">{squad.description}</p>
        {squad.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {squad.tags.map((t) => (
              <span key={t} className="px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          {squad.joined ? (
            <button
              onClick={() => leave.mutate()}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              disabled={leave.isPending}
            >
              Salir
            </button>
          ) : (
            <button
              onClick={() => join.mutate()}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
              disabled={join.isPending}
            >
              Unirme
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts && posts.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
            No hay publicaciones en este squad.
          </div>
        )}
      </div>
    </div>
  );
}
