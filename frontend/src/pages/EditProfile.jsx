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
  const [profileVideoFile, setProfileVideoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverVideoFile, setCoverVideoFile] = useState(null);
  const [coverVideoStart, setCoverVideoStart] = useState(0);
  const [coverVideoDuration, setCoverVideoDuration] = useState(0);
  const [coverClipLength, setCoverClipLength] = useState(3);
  const [videoStart, setVideoStart] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoClipLength, setVideoClipLength] = useState(3);
  const [useVideoAvatar, setUseVideoAvatar] = useState(false);
  const [message, setMessage] = useState(null);
  const mediaBase = API_BASE_URL.replace(/\/api$/, "");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        username: user.username || "",
        bio: user.bio || "",
      });
      setUseVideoAvatar(!!user.useVideoAvatar);
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

  const videoMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("profileVideo", file);
      fd.append("start", videoStart);
      fd.append("length", videoClipLength);
      fd.append("end", Math.min(videoStart + videoClipLength, videoDuration || videoStart + videoClipLength));
      const { data } = await api.put("/users/me/profile-video", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: ({ user: updated }) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["profile", updated.username] });
      setMessage("Video de perfil actualizado");
      setProfileVideoFile(null);
      setVideoDuration(0);
      setVideoStart(0);
    },
  });

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

  const coverVideoMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("coverVideo", file);
      fd.append("start", coverVideoStart);
      fd.append("length", coverClipLength);
      fd.append("end", Math.min(coverVideoStart + coverClipLength, coverVideoDuration || coverVideoStart + coverClipLength));
      const { data } = await api.put("/users/me/cover-video", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: ({ user: updated }) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["profile", updated.username] });
      setMessage("Portada en video actualizada");
      setCoverVideoFile(null);
      setCoverVideoDuration(0);
      setCoverVideoStart(0);
    },
  });

  const avatarModeMutation = useMutation({
    mutationFn: async (mode) => api.put("/users/me/avatar-mode", { useVideoAvatar: mode }),
    onSuccess: ({ user: updated }) => {
      setUser(updated);
      setUseVideoAvatar(updated.useVideoAvatar);
      queryClient.invalidateQueries({ queryKey: ["profile", updated.username] });
      setMessage("Modo de avatar actualizado");
    },
  });

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Editar perfil</h1>
      {message && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{message}</div>}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Portada</h2>
          <div className="w-full h-32 rounded-xl overflow-hidden bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700">
            {coverPreview ? (
              <img src={coverPreview} alt="Portada" className="w-full h-full object-cover" />
            ) : user?.coverImageUrl ? (
              <img src={`${mediaBase}/${user.coverImageUrl}`} alt="Portada" className="w-full h-full object-cover" />
            ) : user?.coverVideoUrl ? (
              <video
                src={`${mediaBase}/${user.coverVideoUrl}`}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
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
            Cambiar portada
          </label>
          {coverFile && (
            <button
              type="button"
              onClick={() => coverMutation.mutate(coverFile)}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
              disabled={coverMutation.isPending}
            >
              {coverMutation.isPending ? "Guardando..." : "Guardar portada"}
            </button>
          )}
          <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.size > 20 * 1024 * 1024) {
                    alert("El video no puede superar 20MB");
                    return;
                  }
                  setCoverVideoFile(file);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    const vid = document.createElement("video");
                    vid.src = url;
                    vid.onloadedmetadata = () => {
                      const dur = vid.duration;
                      setCoverVideoDuration(dur);
                      setCoverVideoStart(0);
                    };
                  }
                }}
              />
              Subir video de portada (max. 20MB, clip de 3 o 5s)
            </label>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span>Duracion:</span>
              {[3, 5].map((len) => (
                <button
                  type="button"
                  key={len}
                  onClick={() => {
                    setCoverClipLength(len);
                    setCoverVideoStart((prev) =>
                      Math.min(prev, Math.max(0, (coverVideoDuration || len) - len))
                    );
                  }}
                  className={`px-2 py-1 rounded-full border ${
                    coverClipLength === len
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {len}s
                </button>
              ))}
            </div>
            {coverVideoDuration > 0 && (
              <div className="text-xs text-slate-500">
                Selecciona inicio (clip {coverClipLength}s):{" "}
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, coverVideoDuration - coverClipLength)}
                  step="0.1"
                  value={coverVideoStart}
                  onChange={(e) => setCoverVideoStart(Number(e.target.value))}
                />
                <span className="ml-2">
                  {coverVideoStart.toFixed(1)}s - {(coverVideoStart + coverClipLength).toFixed(1)}s
                </span>
              </div>
            )}
            {coverVideoFile && (
              <button
                type="button"
                onClick={() => coverVideoMutation.mutate(coverVideoFile)}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
                disabled={coverVideoMutation.isPending}
              >
                {coverVideoMutation.isPending ? "Guardando..." : "Guardar video de portada"}
              </button>
            )}
          </div>
        </div>
          <div className="flex items-center gap-4">
            <Avatar user={user} size={72} />
            <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarChange(e.target.files?.[0])}
              />
              Cambiar avatar
            </label>
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="Preview avatar"
                className="w-24 h-24 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            )}
            {avatarFile && (
              <button
                type="button"
                onClick={() => avatarMutation.mutate(avatarFile)}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
                disabled={avatarMutation.isPending}
              >
                {avatarMutation.isPending ? "Guardando..." : "Guardar avatar"}
              </button>
            )}
            <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 20 * 1024 * 1024) {
                      alert("El video no puede superar 20MB");
                      return;
                    }
                    setProfileVideoFile(file);
                    if (file) {
                      const url = URL.createObjectURL(file);
                      const vid = document.createElement("video");
                      vid.src = url;
                      vid.onloadedmetadata = () => {
                        const dur = vid.duration;
                        setVideoDuration(dur);
                        setVideoStart(0);
                      };
                    }
                  }}
                />
                Subir video de perfil (max. 20 MB, clip de 3 o 5s)
              </label>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span>Duracion:</span>
                {[3, 5].map((len) => (
                  <button
                    type="button"
                    key={len}
                    onClick={() => {
                      setVideoClipLength(len);
                      setVideoStart((prev) => Math.min(prev, Math.max(0, (videoDuration || len) - len)));
                    }}
                    className={`px-2 py-1 rounded-full border ${
                      videoClipLength === len
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {len}s
                  </button>
                ))}
              </div>
              {profileVideoFile && (
                <button
                  type="button"
                  onClick={() => videoMutation.mutate(profileVideoFile)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
                  disabled={videoMutation.isPending}
                >
                  {videoMutation.isPending ? "Guardando..." : "Guardar video"}
                </button>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={useVideoAvatar}
                  onChange={(e) => avatarModeMutation.mutate(e.target.checked)}
                />
                Usar video como foto de perfil (recomendado: 3-5s, sin audio)
              </label>
              {videoDuration > 0 && (
                <div className="text-xs text-slate-500">
                  Selecciona el inicio (clip {videoClipLength}s):{" "}
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, videoDuration - videoClipLength)}
                    step="0.1"
                    value={videoStart}
                    onChange={(e) => setVideoStart(Number(e.target.value))}
                  />
                  <span className="ml-2">
                    {videoStart.toFixed(1)}s - {(videoStart + videoClipLength).toFixed(1)}s
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">@username</label>
            <input
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              required
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            placeholder="Cuéntanos sobre ti"
          />
        </div>
        <button
          type="submit"
          disabled={profileMutation.isPending}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          {profileMutation.isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
      {user?.avatar && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Ruta de avatar actual: {`${mediaBase}/${user.avatar}`}
        </p>
      )}
    </div>
  );
}







