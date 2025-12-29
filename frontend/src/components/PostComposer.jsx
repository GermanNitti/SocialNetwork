import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/client";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import useCardStyle from "../hooks/useCardStyle";
import { useToast } from "../context/ToastContext";

export default function PostComposer({ onCreated }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
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
      toast.success("Post publicado");
    },
    onError: () => {
      toast.error("Error al publicar post");
    },
  });

  const handleFile = (file) => {
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-700/60 p-4 shadow-lg backdrop-blur-xl"
      style={style}
    >
      <div className="flex gap-3">
        <Avatar user={user} />
        <div className="flex-1">
          <motion.textarea
            whileFocus={{ scale: 1.01 }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none transition-all duration-200"
            placeholder="¿Qué estás pensando?"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (content.trim() && !isPending) {
                  mutateAsync();
                }
              }
            }}
          />
          <AnimatePresence>
            {preview && (
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                src={preview}
                alt="Previsualización"
                className="mt-2 h-48 w-full object-cover rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-md"
              />
            )}
          </AnimatePresence>
          <div className="mt-3 flex items-center justify-between">
            <motion.label
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className="text-sm text-indigo-700 dark:text-indigo-300 font-medium cursor-pointer hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors duration-200"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              Subir imagen
            </motion.label>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => mutateAsync()}
              disabled={!content.trim() || isPending}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 shadow-md transition-all duration-200"
            >
              {isPending ? "Publicando..." : "Publicar"}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
