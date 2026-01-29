import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api, { API_BASE_URL } from "../api/client";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", username: "", bio: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [message, setMessage] = useState(null);
  const mediaBase = API_BASE_URL.replace(/\/api$/, "");

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `${mediaBase}/${imagePath}`;
  };

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        username: user.username || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put("/users/me", form);
      return data;
    },
    onSuccess: ({ user: updated }) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["profile", updated.username] });
      setMessage("Perfil actualizado");
      navigate(`/profile/${updated.username}`);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("avatar", file);
      const { data } = await api.put("/users/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: ({ user: updated }) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["profile", updated.username] });
      setMessage("Avatar actualizado");
      setAvatarFile(null);
      setAvatarPreview(null);
    },
  });

  const handleAvatarChange = (file) => {
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    profileMutation.mutate();
  };

  const coverMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("coverImage", file);
      const { data } = await api.put("/users/me/cover", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: ({ user: updated }) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["profile", updated.username] });
      setMessage("Portada actualizada");
      setCoverFile(null);
      setCoverPreview(null);
    },
  });

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-6">Editar perfil</h1>
      {message && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{message}</div>}
      
      {/* Sección de imágenes */}
      <div className="mb-8 space-y-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Imágenes del perfil</h2>
        
        {/* Portada */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Portada del perfil
          </label>
          <div className="relative group">
            <div className="w-full h-32 rounded-xl overflow-hidden bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 border-2 border-slate-200 dark:border-slate-700 transition-all group-hover:border-indigo-300">
              {coverPreview ? (
                <img src={coverPreview} alt="Portada" className="w-full h-full object-cover" />
              ) : user?.coverImageUrl ? (
                <img src={getImageUrl(user.coverImageUrl)} alt="Portada" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium">
                {coverPreview || user?.coverImageUrl ? "Cambiar portada" : "Subir portada"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCoverFile(file);
                    setCoverPreview(URL.createObjectURL(file));
                  }
                }}
              />
            </label>
          </div>
          {coverFile && (
            <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <span className="text-sm text-indigo-700 dark:text-indigo-300">Lista para guardar:</span>
              <button
                type="button"
                onClick={() => coverMutation.mutate(coverFile)}
                className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
                disabled={coverMutation.isPending}
              >
                {coverMutation.isPending ? "Guardando..." : "Guardar portada"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCoverFile(null);
                  setCoverPreview(null);
                }}
                className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Foto de perfil
          </label>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar user={user} size={80} />
              <label className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarChange(e.target.files?.[0])}
              />
            </div>
            
            <div className="flex-1 space-y-3">
              {avatarPreview && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <img
                    src={avatarPreview}
                    alt="Preview avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-green-300 dark:border-green-700"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">Nueva foto lista</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Pulsa "Guardar avatar" para confirmar</p>
                  </div>
                </div>
              )}
              {avatarFile && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => avatarMutation.mutate(avatarFile)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
                    disabled={avatarMutation.isPending}
                  >
                    {avatarMutation.isPending ? "Guardando..." : "Guardar avatar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {!avatarFile && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Haz clic en la foto para cambiarla
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de información básica */}
      <div className="mb-8 space-y-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Información básica</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                @username
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                required
                pattern="[a-zA-Z0-9_]+"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
                placeholder="nombre_de_usuario"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Solo letras, números y guiones bajos</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Biografía
            </label>
            <textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              rows={4}
              maxLength={500}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all resize-none"
              placeholder="Cuéntanos sobre ti, tus intereses, lo que te apasiona..."
            />
            <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
              {form.bio.length}/500 caracteres
            </div>
          </div>
      <form id="profile-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              @username
            </label>
            <input
              id="username"
              type="text"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              required
              pattern="[a-zA-Z0-9_]+"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
              placeholder="nombre_de_usuario"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Solo letras, números y guiones bajos</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Biografía
          </label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            rows={4}
            maxLength={500}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all resize-none"
            placeholder="Cuéntanos sobre ti, tus intereses, lo que te apasiona..."
          />
          <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
            {form.bio.length}/500 caracteres
          </div>
        </div>
      </form>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          form="profile-form"
          type="submit"
          disabled={profileMutation.isPending}
          className="px-6 py-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {profileMutation.isPending ? "Guardando cambios..." : "Guardar información"}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/profile/${user.username}`)}
          className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          Cancelar
        </button>
      </div>
    </div>
      {user?.avatar && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Avatar actual: {getImageUrl(user.avatar)}
        </p>
      )}
    </div>
  );
}







