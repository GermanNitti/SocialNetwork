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
      className={`overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        showHelpHighlight || post.type === "HELP_REQUEST" ? "ring-2 ring-amber-300/60" : ""
      }`}
      style={style}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Avatar user={post.author} size={48} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                  {post.author?.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">@{post.author?.username}</div>
              </div>
              {post.type === "HELP_REQUEST" && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100 px-3 py-1 text-[11px] font-semibold">
                  ⚡ Ayuda
                </span>
              )}
              {post.squad && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] text-slate-700 dark:text-slate-200">
                  🛡️ {post.squad.name}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">{new Date(post.createdAt).toLocaleString()}</div>
          </div>
        </div>

        <div className="text-slate-800 dark:text-slate-100 text-sm whitespace-pre-line leading-relaxed">
          {formatTextWithHashtags(post.content)}
        </div>

        {post.image && (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <img
              src={`${mediaBase}/${post.image}`}
              alt="Post"
              className="w-full object-cover max-h-96 cursor-pointer"
              onClick={() => open(`${mediaBase}/${post.image}`, "Imagen")}
            />
          </div>
        )}

        {(post.hashtags?.length || post.tags?.length) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {post.hashtags?.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800"
              >
                #{tag}
              </span>
            ))}
            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {REACTION_ORDER.map((key) => (
            <button
              key={key}
              onClick={() => setReaction(key)}
              disabled={reacting}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm transition border ${
                currentReaction === key
                  ? "bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>{REACTIONS[key].icon}</span>
              <span className="hidden sm:inline">{REACTIONS[key].label}</span>
              <span className="font-semibold">{post.reactions?.[key] ?? 0}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
            💬 {post._count?.comments ?? 0}
          </div>
        </div>

        <div className="space-y-3">
          {post.comments?.slice(0, 3).map((c) => (
            <div key={c.id} className="flex gap-2 items-start text-sm">
              <Avatar user={c.author} size={32} />
              <div className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-3 py-2">
                <div className="font-semibold text-slate-800 dark:text-slate-100">{c.author?.name}</div>
                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line">
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
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:border-indigo-400 focus:outline-none"
              placeholder="Escribe un comentario..."
            />
            <button
              onClick={() => sendComment(comment)}
              disabled={!comment.trim() || commenting}
              className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
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
      </div>
    </article>
  );
}
