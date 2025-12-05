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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data } = await api.get(`/users/${username}`);
      return data;
    },
  });

  useEffect(() => {
    if (data?.user) {
      setRelationForm({
        category: data.user.relationCategory || "",
        detail: data.user.relationDetail || "",
      });
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", username] }),
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

  const profile = data.user;
  const posts = data.posts || [];
  const mediaBase = API_BASE_URL.replace(/\/api$/, "");
  const relationCategory = profile.relationCategory || "";
  const relationDetail = profile.relationDetail || "";

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
            onClick={() => removeFriend.mutate()}
            className="text-sm px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Amigos ✓ (quitar)
          </button>
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
        </div>
      );
    }
    if (friendStatus === "OUTGOING") {
      return (
        <button
          onClick={() => removeFriend.mutate()}
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar user={profile} size={72} className="border border-slate-200 dark:border-slate-700" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{profile.name}</h1>
              {renderFriendAction()}
            </div>
            <div className="text-sm text-slate-500">@{profile.username}</div>
            {profile.email && <div className="text-sm text-slate-500">{profile.email}</div>}
            {profile.bio && <p className="text-slate-700 dark:text-slate-200 text-sm mt-2">{profile.bio}</p>}
            <div className="text-xs text-slate-500 mt-2">
              {profile._count?.posts ?? 0} publicaciones • {profile.friendsCount ?? 0} amigos
            </div>
            {profile.relationCategory && (
              <div className="text-xs text-slate-500">
                Relación: {profile.relationCategory} {profile.relationDetail ? `(${profile.relationDetail})` : ""}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500">
            Sin publicaciones todavía.
          </div>
        )}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
