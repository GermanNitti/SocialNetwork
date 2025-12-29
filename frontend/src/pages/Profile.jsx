import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api, { API_BASE_URL } from "../api/client";
import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [relationForm, setRelationForm] = useState({ category: "", detail: "" });
  const [editingRelation, setEditingRelation] = useState(false);
  const [interestsDraft, setInterestsDraft] = useState([]);
  const [newInterest, setNewInterest] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    category: "OTRO",
    targetDate: "",
    visibility: "PUBLIC",
    needsHelp: false,
  });
  const [editingProject, setEditingProject] = useState(null);
  const [showProjectPosts, setShowProjectPosts] = useState(false);
  const [projectPosts, setProjectPosts] = useState([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data } = await api.get(`/users/${username}`);
      return data;
    },
  });
  const { data: myProjects } = useQuery({
    queryKey: ["my-projects"],
    queryFn: async () => {
      const { data } = await api.get("/users/me/projects");
      return data;
    },
    enabled: currentUser?.username === username,
  });
  const { data: myProjectsOverview } = useQuery({
    queryKey: ["my-projects-overview"],
    queryFn: async () => {
      const { data } = await api.get("/users/me/projects/overview");
      return data;
    },
    enabled: currentUser?.username === username,
  });
  const { data: mySquads } = useQuery({
    queryKey: ["my-squads"],
    queryFn: async () => {
      const { data } = await api.get("/squads");
      return data;
    },
    enabled: currentUser?.username === username,
  });

  const profile = data?.user;
  const posts = data?.posts || [];
  const mediaBase = API_BASE_URL.replace(/\/api$/, "");

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `${mediaBase}/${imagePath}`;
  };

  useEffect(() => {
    if (data?.user) {
      setRelationForm({
        category: data.user.relationCategory || "",
        detail: data.user.relationDetail || "",
      });
      setInterestsDraft(data.user.interests || []);
      setLocationDraft(data.user.location || "");
    }
  }, [data]);

  const sendRequest = useMutation({
    mutationFn: async () => {
      await api.post(`/friends/${username}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", username] }),
  });

  const acceptRequest = useMutation({
    mutationFn: async () => {
      await api.post(`/friends/${username}/accept`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", username] }),
  });

  const removeFriend = useMutation({
    mutationFn: async () => {
      await api.delete(`/friends/${username}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", username] }),
  });

  const setRelation = useMutation({
    mutationFn: async () => {
      await api.post(`/friends/${username}/relation`, relationForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      setEditingRelation(false);
    },
  });
  const updateInterests = useMutation({
    mutationFn: async (interests) => api.put("/users/me/interests", { interests }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", username] }),
  });
  const updateLocation = useMutation({
    mutationFn: async (location) => api.put("/users/me/location", { location }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", username] }),
  });
  const createProject = useMutation({
    mutationFn: async (payload) => api.post("/users/me/projects", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      setProjectForm({
        title: "",
        description: "",
        category: "OTRO",
        targetDate: "",
        visibility: "PUBLIC",
        needsHelp: false,
      });
    },
  });
  const updateProject = useMutation({
    mutationFn: async ({ id, ...rest }) => api.put(`/users/me/projects/${id}`, rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      setEditingProject(null);
      setProjectForm({
        title: "",
        description: "",
        category: "OTRO",
        targetDate: "",
        visibility: "PUBLIC",
        needsHelp: false,
      });
    },
  });
  const deleteProject = useMutation({
    mutationFn: async (id) => api.delete(`/users/me/projects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-projects"] }),
  });
  const updateProjectProgress = useMutation({
    mutationFn: async ({ id, progress }) => api.put(`/users/me/projects/${id}/progress`, { progress }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-projects-overview"] }),
  });
  const helpPost = useMutation({
    mutationFn: async (project) => {
      const tagsMap = {
        SALUD: ["salud"],
        CREATIVO: ["creativo"],
        PERSONAL: ["personal"],
        ESTUDIO: ["estudio"],
        OTRO: ["ayuda"],
      };
      const tags = tagsMap[project.category] || ["ayuda"];
      const content = `Estoy buscando ayuda para este proyecto: ${project.title}${project.description ? `\\n${project.description}` : ""}`;
      const { data } = await api.post("/posts", {
        content,
        type: "HELP_REQUEST",
        projectId: project.id,
        tags,
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
        Cargando perfil...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-red-600">
        No pudimos cargar este perfil.
      </div>
    );
  }

  const relationCategory = profile.relationCategory || "";
  const relationDetail = profile.relationDetail || "";
  const isOwnProfile = currentUser?.username === profile.username;
  const isOwner = isOwnProfile;
  const projectCategories = ["PERSONAL", "CREATIVO", "SALUD", "ESTUDIO", "OTRO"];
  const projectVisibilities = ["PUBLIC", "FRIENDS", "PRIVATE"];
  const formatDate = (val) => (val ? new Date(val).toLocaleDateString() : "");

  const friendStatus = profile.friendshipStatus;
  const renderFriendAction = () => {
    if (currentUser?.username === profile.username) {
      return (
        <Link
          to="/profile/edit"
          className="text-sm px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Editar perfil
        </Link>
      );
    }
    if (friendStatus === "FRIENDS") {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const confirmed = window.confirm("¿Seguro que quieres quitar a esta persona de tus amigos?");
              if (confirmed) removeFriend.mutate();
            }}
            className="text-sm px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Amigos ✓ (quitar)
          </button>
          {!editingRelation && (
            <button
              onClick={() => setEditingRelation(true)}
              className="text-sm px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Editar relación
            </button>
          )}
          {editingRelation && (
            <>
              <select
                value={relationForm.category}
                onChange={(e) => setRelationForm((prev) => ({ ...prev, category: e.target.value }))}
                className="text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1"
              >
                <option value="">Categoría</option>
                <option value="amigo">Amigo/Amiga</option>
                <option value="familia">Familia</option>
                <option value="trabajo">Trabajo</option>
                <option value="deporte">Deporte</option>
                <option value="pareja">Pareja</option>
                <option value="conocido">Conocido/a</option>
                <option value="otro">Otro</option>
              </select>
              {relationForm.category === "familia" && (
                <input
                  value={relationForm.detail}
                  onChange={(e) => setRelationForm((prev) => ({ ...prev, detail: e.target.value }))}
                  placeholder="Primo, madre, etc."
                  className="text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1"
                />
              )}
              {relationForm.category && (
                <button
                  onClick={() => setRelation.mutate()}
                  className="text-sm px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Guardar relación
                </button>
              )}
              <button
                onClick={() => {
                  setEditingRelation(false);
                  setRelationForm({
                    category: profile.relationCategory || "",
                    detail: profile.relationDetail || "",
                  });
                }}
                className="text-sm px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      );
    }
    if (friendStatus === "OUTGOING") {
      return (
        <button
          onClick={() => {
            const confirmed = window.confirm("¿Cancelar solicitud de amistad?");
            if (confirmed) removeFriend.mutate();
          }}
          className="text-sm px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Solicitud enviada (cancelar)
        </button>
      );
    }
    if (friendStatus === "INCOMING") {
      return (
        <button
          onClick={() => acceptRequest.mutate()}
          className="text-sm px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
        >
          Aceptar solicitud
        </button>
      );
    }
    return (
      <button
        onClick={() => sendRequest.mutate()}
        className="text-sm px-3 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
      >
        Agregar amigo
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="h-32 w-full rounded-t-2xl overflow-hidden bg-gradient-to-r from-indigo-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
          {profile.coverImageUrl ? (
            <img src={getImageUrl(profile.coverImageUrl)} alt="Portada" className="w-full h-full object-cover" />
          ) : null}
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <Avatar
              user={profile}
              size={72}
              className="border border-slate-200 dark:border-slate-700 -mt-10 bg-white"
              emotionColor={profile?.currentEmotionColor || null}
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{profile.name}</h1>
                {renderFriendAction()}
              </div>
              <div className="text-sm text-slate-500">@{profile.username}</div>
              {isOwner && (
                <div className="mt-1">
                  <Link
                    to="/feedback"
                    className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800"
                  >
                    Ir al muro del creador
                  </Link>
                </div>
              )}
              {profile.badges && profile.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.badges.map((b) => (
                    <span
                      key={b.code}
                      className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                    >
                      {b.name}
                    </span>
                  ))}
                </div>
              )}
              {profile.email && <div className="text-sm text-slate-500">{profile.email}</div>}
              {profile.bio && <p className="text-slate-700 dark:text-slate-200 text-sm mt-2">{profile.bio}</p>}
              <div className="text-xs text-slate-500 mt-2">
                {profile._count?.posts ?? 0} publicaciones · {profile.friendsCount ?? 0} amigos
              </div>
              {profile.relationCategory && (
                <div className="text-xs text-slate-500">
                  Relación: {profile.relationCategory} {profile.relationDetail ? `(${profile.relationDetail})` : ""}
                </div>
              )}
              {isOwner && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Intereses</h2>
                    <button
                      onClick={() => updateInterests.mutateAsync(interestsDraft)}
                      className="text-xs px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                      disabled={updateInterests.isPending}
                    >
                      {updateInterests.isPending ? "Guardando..." : "Guardar intereses"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interestsDraft.map((tag, idx) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
                      >
                        #{tag}
                        <button
                          onClick={() => setInterestsDraft((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-500"
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newInterest.trim()) {
                            setInterestsDraft((prev) => [...prev, newInterest.trim()]);
                            setNewInterest("");
                          }
                        }
                      }}
                      className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200"
                      placeholder="Agregar interés y Enter"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={locationDraft}
                      onChange={(e) => setLocationDraft(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm flex-1 text-slate-800 dark:text-slate-100"
                      placeholder="Ciudad / zona"
                    />
                    <button
                      onClick={() => updateLocation.mutateAsync(locationDraft)}
                      className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                      disabled={updateLocation.isPending}
                    >
                      {updateLocation.isPending ? "Guardando..." : "Guardar ubicación"}
                    </button>
                  </div>
                </div>
              )}
              {!isOwner && profile.interests?.length > 0 && (
                <div className="mt-3">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Intereses</h2>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.interests.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {profile.location && (
                    <div className="text-xs text-slate-500 mt-2">Ubicación: {profile.location}</div>
                  )}
                </div>
              )}
              {isOwner && mySquads && (
                <div className="mt-4">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Mis squads</h2>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {mySquads.filter((s) => s.joined).map((s) => (
                      <Link
                        key={s.id}
                        to={`/squads/${s.id}`}
                        className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        {s.name}
                      </Link>
                    ))}
                    {mySquads.filter((s) => s.joined).length === 0 && (
                      <div className="text-xs text-slate-500">Aún no te uniste a squads.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isOwner && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Proyectos y metas</h2>
            <button
              onClick={() => {
                setEditingProject(null);
                setProjectForm({
                  title: "",
                  description: "",
                  category: "OTRO",
                  targetDate: "",
                  visibility: "PUBLIC",
                  needsHelp: false,
                });
              }}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
            >
              Agregar proyecto
            </button>
          </div>
          <div className="grid gap-3">
            {myProjects?.map((p) => (
              <div
                key={p.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{p.title}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {p.category}
                  </span>
                  {p.needsHelp && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">
                      Pide ayuda
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                    {p.targetDate && <span>Objetivo: {formatDate(p.targetDate)}</span>}
                    <span>Visibilidad: {p.visibility}</span>
                  </div>
                </div>
                {p.description && (
                  <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{p.description}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setEditingProject(p.id);
                      setProjectForm({
                        title: p.title,
                        description: p.description || "",
                        category: p.category,
                        targetDate: p.targetDate ? p.targetDate.split("T")[0] : "",
                        visibility: p.visibility,
                        needsHelp: p.needsHelp,
                      });
                    }}
                    className="text-xs px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteProject.mutate(p.id)}
                    className="text-xs px-3 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => helpPost.mutate(p)}
                    className="text-xs px-3 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                  >
                    Pedir ayuda a la comunidad
                  </button>
                </div>
              </div>
            ))}
            {(!myProjects || myProjects.length === 0) && (
              <div className="text-sm text-slate-500">Aún no tienes proyectos. ¡Crea el primero!</div>
            )}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Título *</label>
                <input
                  value={projectForm.title}
                  onChange={(e) => setProjectForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  placeholder="Nuevo proyecto"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Categoría</label>
                <select
                  value={projectForm.category}
                  onChange={(e) => setProjectForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  {projectCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Descripción</label>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                rows={3}
                placeholder="Detalles adicionales"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Fecha objetivo</label>
                <input
                  type="date"
                  value={projectForm.targetDate}
                  onChange={(e) => setProjectForm((p) => ({ ...p, targetDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Visibilidad</label>
                <select
                  value={projectForm.visibility}
                  onChange={(e) => setProjectForm((p) => ({ ...p, visibility: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  {projectVisibilities.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 mt-6">
                <input
                  type="checkbox"
                  checked={projectForm.needsHelp}
                  onChange={(e) => setProjectForm((p) => ({ ...p, needsHelp: e.target.checked }))}
                />
                Necesito ayuda de la comunidad
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  editingProject
                    ? updateProject.mutate({ id: editingProject, ...projectForm })
                    : createProject.mutate(projectForm)
                }
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                disabled={!projectForm.title}
              >
                {editingProject ? "Actualizar proyecto" : "Crear proyecto"}
              </button>
              {editingProject && (
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setProjectForm({
                      title: "",
                      description: "",
                      category: "OTRO",
                      targetDate: "",
                      visibility: "PUBLIC",
                      needsHelp: false,
                    });
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {isOwner && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Mis proyectos (resumen)</h2>
          <div className="space-y-3">
            {myProjectsOverview?.map((p) => (
              <div key={p.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{p.title}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    {p.category}
                  </span>
                  <div className="ml-auto text-xs text-slate-500">Progreso: {p.progress}%</div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
                  />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Actualizaciones: {p.updatesCount} · Pedidos de ayuda: {p.helpRequestsCount} · Último movimiento:{" "}
                  {p.lastUpdateAt ? new Date(p.lastUpdateAt).toLocaleDateString() : "sin actividad"}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={p.progress}
                    onChange={(e) =>
                      updateProjectProgress.mutate({ id: p.id, progress: Number(e.target.value) })
                    }
                    className="flex-1"
                  />
                  <button
                    onClick={async () => {
                      const { data } = await api.get(`/posts/project/${p.id}`);
                      setProjectPosts(data);
                      setShowProjectPosts(true);
                    }}
                    className="text-xs px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Ver posts relacionados
                  </button>
                </div>
              </div>
            ))}
            {(!myProjectsOverview || myProjectsOverview.length === 0) && (
              <div className="text-sm text-slate-500">Sin proyectos todavía.</div>
            )}
          </div>
        </div>
      )}
      {showProjectPosts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 max-w-4xl w-full max-h-[80vh] overflow-auto space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Posts del proyecto</h3>
              <button
                onClick={() => setShowProjectPosts(false)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
              >
                Cerrar
              </button>
            </div>
            {projectPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={() => queryClient.invalidateQueries({ queryKey: ["profile", username] })}
              />
            ))}
            {projectPosts.length === 0 && (
              <div className="text-sm text-slate-500">Sin posts para este proyecto.</div>
            )}
          </div>
        </div>
      )}
      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
            Sin publicaciones todavía.
          </div>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPostUpdated={() => queryClient.invalidateQueries({ queryKey: ["profile", username] })}
          />
        ))}
      </div>
    </div>
  );
}
