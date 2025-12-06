import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function Squads() {
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["squads", q],
    queryFn: async () => {
      const { data } = await api.get("/squads", { params: { q: q || undefined } });
      return data;
    },
  });

  const join = useMutation({
    mutationFn: async (id) => api.post(`/squads/${id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["squads"] }),
  });
  const leave = useMutation({
    mutationFn: async (id) => api.post(`/squads/${id}/leave`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["squads"] }),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          placeholder="Buscar squads por nombre o tag"
        />
      </div>

      {isLoading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
          Cargando squads...
        </div>
      )}

      <div className="space-y-3">
        {data?.map((squad) => (
          <div
            key={squad.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <Link to={`/squads/${squad.id}`} className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                {squad.name}
              </Link>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                {squad.type}
              </span>
              <span className="text-xs text-slate-500 ml-auto">{squad.membersCount} miembros</span>
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
                  onClick={() => leave.mutate(squad.id)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  disabled={leave.isPending}
                >
                  Salir
                </button>
              ) : (
                <button
                  onClick={() => join.mutate(squad.id)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
                  disabled={join.isPending}
                >
                  Unirme
                </button>
              )}
            </div>
          </div>
        ))}
        {!isLoading && (!data || data.length === 0) && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
            No se encontraron squads.
          </div>
        )}
      </div>
    </div>
  );
}
