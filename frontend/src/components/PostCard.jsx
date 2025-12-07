import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../api/client";
import api from "../api/client";
import Avatar from "./Avatar";
import { formatTextWithHashtags } from "../utils/formatTextWithHashtags";
import { useAuth } from "../context/AuthContext";
import { REACTIONS, REACTION_ORDER } from "../constants/reactions";
import useCardStyle from "../hooks/useCardStyle";
import { useLightbox } from "../context/LightboxContext";

export default function PostCard({ post, showHelpHighlight = false }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const commentInputRef = useRef(null);
  const mediaBase = API_BASE_URL.replace(/\/api$/, "");
  const currentReaction = post.userReaction;
  const { style } = useCardStyle();
  const { open } = useLightbox();

  const { mutateAsync: setReaction, isPending: reacting } = useMutation({
    mutationFn: async (type) => {
      const { data } = await api.post(`/posts/${post.id}/reactions`, { type });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const { mutateAsync: sendComment, isPending: commenting } = useMutation({
    mutationFn: async (content) => {
      const { data } = await api.post(`/posts/${post.id}/comments`, { content });
      return data;
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return (
    <article
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3 ${
        showHelpHighlight || post.type === "HELP_REQUEST" ? "ring-2 ring-amber-400/60" : ""
      }`}
      style={style}
    >
      <div className="flex gap-3 items-center">
        <Avatar user={post.author} size={44} />
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-50">{post.author?.name}</div>
          <div className="text-xs text-slate-500">@{post.author?.username}</div>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          {new Date(post.createdAt).toLocaleString()}
        </div>
      </div>
      {post.type === "HELP_REQUEST" && (
        <span className="inline-block text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-200 px-2 py-1 rounded-full">
          {showHelpHighlight ? "Pidiendo una mano" : "AYUDA"}
        </span>
      )}
      <p className="text-slate-800 dark:text-slate-100 text-sm whitespace-pre-line">
        {formatTextWithHashtags(post.content)}
      </p>
      {post.image && (
        <img
          src={`${mediaBase}/${post.image}`}
          alt="Post"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 object-contain max-h-96 bg-slate-50 dark:bg-slate-800 cursor-pointer"
          onClick={() => open(`${mediaBase}/${post.image}`, "Imagen")}
        />
      )}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      {post.squad && (
        <div className="text-xs text-slate-500">Publicado en: {post.squad.name}</div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        {REACTION_ORDER.map((key) => (
          <button
            key={key}
            onClick={() => setReaction(key)}
            disabled={reacting}
            className={`flex items-center gap-1 px-3 py-1 rounded-full border transition ${
              currentReaction === key
                ? "bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>{REACTIONS[key].icon}</span>
            <span className="hidden sm:inline">{REACTIONS[key].label}</span>
            <span className="font-semibold">{post.reactions?.[key] ?? 0}</span>
          </button>
        ))}
        <div className="flex items-center gap-1 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          💬 {post._count?.comments ?? 0}
        </div>
      </div>
      <div className="space-y-2">
        {post.comments?.slice(0, 3).map((c) => (
          <div key={c.id} className="flex gap-2 items-start text-sm text-slate-700 dark:text-slate-200">
            <Avatar user={c.author} size={32} />
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 flex-1">
              <div className="font-semibold text-slate-800 dark:text-slate-100">{c.author?.name}</div>
              <p className="text-slate-700 dark:text-slate-200">
                {formatTextWithHashtags(c.content)}
              </p>
            </div>
          </div>
        ))}
        <div className="flex gap-2 items-start">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            ref={commentInputRef}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:border-indigo-400 focus:outline-none"
            placeholder="Escribe un comentario..."
          />
          <button
            onClick={() => sendComment(comment)}
            disabled={!comment.trim() || commenting}
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {commenting ? "Enviando..." : "Comentar"}
          </button>
        </div>
        {showHelpHighlight && (
          <div className="flex justify-end">
            <button
              onClick={() => commentInputRef.current?.focus()}
              className="px-3 py-2 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 text-xs font-semibold"
            >
              Comentar y dar una mano
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
