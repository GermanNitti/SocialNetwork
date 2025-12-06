import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../api/client";

export default function FeedbackPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sort, setSort] = useState("latest"); // latest | top
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["feedback", sort],
    queryFn: async () => {
      const params = sort === "top" ? { sort: "top" } : {};
      const { data } = await api.get("/feedback", { params });
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => api.post("/feedback", { title, description }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });

  const vote = useMutation({
    mutationFn: async (id) => api.post(`/feedback/${id}/vote`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feedback"] }),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Muro del creador</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Acá podés dejar ideas, quejas o sueños para mejorar esta red. Todo se lee.
        </p>
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            placeholder="Título de tu idea"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            rows={3}
            placeholder="Describe qué te gustaría ver, mejorar o arreglar"
          />
          <button
            onClick={() => create.mutate()}
            disabled={!title.trim() || !description.trim() || create.isPending}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            {create.isPending ? "Enviando..." : "Enviar idea"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-300">Ordenar:</span>
        <button
          onClick={() => setSort("latest")}
          className={`px-3 py-1 rounded-full text-sm border ${
            sort === "latest"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          }`}
        >
          Últimas
        </button>
        <button
          onClick={() => setSort("top")}
          className={`px-3 py-1 rounded-full text-sm border ${
            sort === "top"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          }`}
        >
          Más votadas
        </button>
      </div>

      {isLoading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
          Cargando ideas...
        </div>
      )}

      <div className="space-y-3">
        {data?.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">{item.title}</div>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                {item.status}
              </span>
              <span className="text-xs text-slate-500 ml-auto">
                Votos: {item.votes}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">{item.description}</p>
            <div className="flex gap-2">
              <button
                onClick={() => vote.mutate(item.id)}
                className="px-3 py-2 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 text-sm font-semibold disabled:opacity-50"
                disabled={vote.isPending}
              >
                Votar
              </button>
            </div>
          </div>
        ))}
        {!isLoading && (!data || data.length === 0) && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
            No hay ideas aún. Sé el primero en proponer algo.
          </div>
        )}
      </div>
    </div>
  );
}
