import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import useCardStyle from "../hooks/useCardStyle";

export default function PostComposer({ onCreated }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const { style } = useCardStyle();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("content", content);
      if (image) formData.append("image", image);
      const { data } = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data) => {
      setContent("");
      setImage(null);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (onCreated) onCreated(data);
    },
  });

  const handleFile = (file) => {
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
      style={style}
    >
      <div className="flex gap-3">
        <Avatar user={user} />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            placeholder="¿Qué estás pensando?"
          />
          {preview && (
            <img
              src={preview}
              alt="Previsualización"
              className="mt-2 h-48 w-full object-cover rounded-xl border border-slate-200 dark:border-slate-700"
            />
          )}
          <div className="mt-3 flex items-center justify-between">
            <label className="text-sm text-indigo-700 dark:text-indigo-300 font-medium cursor-pointer hover:text-indigo-800 dark:hover:text-indigo-200">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              Subir imagen
            </label>
            <button
              onClick={() => mutateAsync()}
              disabled={!content.trim() || isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
