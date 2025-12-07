import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const SUGGESTED = ["F1", "anime", "fotografía", "comedia", "tech", "gaming", "viajes", "salud", "música"];
const CATEGORY_TAGS = {
  SALUD: ["salud"],
  CREATIVO: ["creativo"],
  PERSONAL: ["personal"],
  ESTUDIO: ["estudio"],
  OTRO: ["ayuda"],
};

export default function OnboardingWizard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState("");
  const [query, setQuery] = useState("");
  const [project, setProject] = useState({
    title: "",
    description: "",
    category: "OTRO",
    targetDate: "",
    visibility: "PUBLIC",
    needsHelp: false,
  });

  useEffect(() => {
    if (user?.interests?.length) setInterests(user.interests);
  }, [user]);

  const { data: squads } = useQuery({
    queryKey: ["onboarding-squads", query],
    queryFn: async () => {
      const { data } = await api.get("/squads", { params: query ? { q: query } : {} });
      return data;
    },
    enabled: step === 2,
  });

  const saveInterests = useMutation({
    mutationFn: async () => api.put("/users/me/interests", { interests }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.username] });
      setStep(2);
    },
  });

  const joinSquad = useMutation({
    mutationFn: async (id) => api.post(`/squads/${id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding-squads"] }),
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/users/me/projects", {
        title: project.title,
        description: project.description,
        category: project.category,
        targetDate: project.targetDate || undefined,
        visibility: project.visibility,
        needsHelp: project.needsHelp,
      });
      return data;
    },
    onSuccess: async (proj) => {
      if (project.needsHelp) {
        const tags = CATEGORY_TAGS[project.category] || ["ayuda"];
        await api.post("/posts", {
          content: `Estoy buscando ayuda para este proyecto: ${project.title}${project.description ? `\n${project.description}` : ""}`,
          type: "HELP_REQUEST",
          projectId: proj.id,
          tags,
        });
      }
      await api.put("/users/me/onboarding");
      setUser({ ...user, hasCompletedOnboarding: true });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      navigate("/feed");
    },
  });

  const suggestedFiltered = useMemo(
    () => SUGGESTED.filter((s) => !interests.includes(s)),
    [interests]
  );

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Bienvenido/a, {user.name}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Completa estos pasos para personalizar tu experiencia.
      </p>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Paso 1: Intereses</h2>
          <div className="flex flex-wrap gap-2">
            {interests.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
              >
                #{tag}
                <button
                  onClick={() => setInterests((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-slate-500 hover:text-red-500"
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedFiltered.map((s) => (
              <button
                key={s}
                onClick={() => setInterests((prev) => [...prev, s])}
                className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
              >
                {s}
              </button>
            ))}
          </div>
          <input
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (newInterest.trim()) {
                  setInterests((prev) => [...prev, newInterest.trim()]);
                  setNewInterest("");
                }
              }
            }}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            placeholder="Agregar interés y presiona Enter"
          />
          <button
            onClick={() => saveInterests.mutate()}
            disabled={saveInterests.isPending}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            {saveInterests.isPending ? "Guardando..." : "Guardar y seguir"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Paso 2: Squads sugeridos</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            placeholder="Buscar squads por tu interés principal"
          />
          <div className="space-y-2 max-h-64 overflow-auto">
            {squads?.map((s) => (
              <div
                key={s.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-2"
              >
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.description}</div>
                  <div className="text-[11px] text-slate-500">Miembros: {s.membersCount}</div>
                </div>
                {s.joined ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Te uniste</span>
                ) : (
                  <button
                    onClick={() => joinSquad.mutate(s.id)}
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                  >
                    Unirme
                  </button>
                )}
              </div>
            ))}
            {squads && squads.length === 0 && (
              <div className="text-sm text-slate-500">No se encontraron squads para tu búsqueda.</div>
            )}
          </div>
          <button
            onClick={() => setStep(3)}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            Continuar
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Paso 3: Primer proyecto</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Título *</label>
            <input
              value={project.title}
              onChange={(e) => setProject((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              placeholder="Mi gran meta"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Descripción</label>
            <textarea
              value={project.description}
              onChange={(e) => setProject((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Categoría</label>
              <select
                value={project.category}
                onChange={(e) => setProject((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                {["PERSONAL", "CREATIVO", "SALUD", "ESTUDIO", "OTRO"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Fecha objetivo</label>
              <input
                type="date"
                value={project.targetDate}
                onChange={(e) => setProject((p) => ({ ...p, targetDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Visibilidad</label>
            <select
              value={project.visibility}
              onChange={(e) => setProject((p) => ({ ...p, visibility: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              {["PUBLIC", "FRIENDS", "PRIVATE"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={project.needsHelp}
              onChange={(e) => setProject((p) => ({ ...p, needsHelp: e.target.checked }))}
            />
            Necesito ayuda de la comunidad
          </label>
          <button
            onClick={() => createProject.mutate()}
            disabled={!project.title || createProject.isPending}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            {createProject.isPending ? "Guardando..." : "Finalizar onboarding"}
          </button>
        </div>
      )}
    </div>
  );
}
