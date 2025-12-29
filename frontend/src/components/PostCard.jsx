import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../api/client";
import api from "../api/client";
import Avatar from "./Avatar";
import { formatTextWithHashtags } from "../utils/formatTextWithHashtags";
import { useAuth } from "../context/AuthContext";
import { REACTIONS, REACTION_ORDER } from "../constants/reactions";
import useCardStyle from "../hooks/useCardStyle";
import { useLightbox } from "../context/LightboxContext";
import { useToast } from "../context/ToastContext";

export default function PostCard({ post, showHelpHighlight = false, onCommentAdded, onPostUpdated }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [editingPost, setEditingPost] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [allComments, setAllComments] = useState(post.comments || []);
  const [visibleComments, setVisibleComments] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const commentsFetchedRef = useRef(false);
  const commentInputRef = useRef(null);
  const [reactionHint, setReactionHint] = useState("");
  const reactionHintTimeout = useRef(null);
  const mediaBase = API_BASE_URL.replace(/\/api$/, "");
  const currentReaction = post.userReaction;
  const { style } = useCardStyle();
  const { open } = useLightbox();
  const toast = useToast();

  const getImageUrl = useCallback((imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `${mediaBase}/${imagePath}`;
  }, [mediaBase]);

  const safeHashtags = useMemo(() =>
    Array.isArray(post.hashtags)
      ? post.hashtags.filter((h) => typeof h === "string" && h.trim())
      : []
  , [post.hashtags]);

  const safeTags = useMemo(() =>
    Array.isArray(post.tags) ? post.tags.filter((t) => typeof t === "string" && t.trim()) : []
  , [post.tags]);

  const commentCount = post._count?.comments ?? allComments.length ?? 0;

  useEffect(() => {
    setEditContent(post.content || "");
  }, [post.content]);

  const fetchComments = async () => {
    if (commentsFetchedRef.current) {
      // Ya se cargaron; solo aseguro visibles = total
      setVisibleComments((v) => (allComments.length ? allComments.length : v));
      return;
    }
    try {
      setLoadingComments(true);
      const { data } = await api.get(`/posts/${post.id}/comments`);
      const list = Array.isArray(data) ? data : [];
      setAllComments(list);
      setVisibleComments(list.length);
      commentsFetchedRef.current = true;
    } catch (err) {
      console.error("Error cargando comentarios", err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Cuando se abre el panel de comentarios, traemos todos y arrancamos con 10 visibles
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, post.id]);

  const { mutateAsync: setReaction, isPending: reacting } = useMutation({
    mutationFn: async (type) => {
      const { data } = await api.post(`/posts/${post.id}/reactions`, { type });
      return data;
    },
    onSuccess: () => {
      if (typeof onPostUpdated === "function") {
        onPostUpdated();
      } else {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    },
    onError: () => {
      toast.error("Error al guardar reacción");
    },
  });

  const { mutateAsync: sendComment, isPending: commenting } = useMutation({
    mutationFn: async (content) => {
      const { data } = await api.post(`/posts/${post.id}/comments`, { content });
      return data;
    },
    onSuccess: (data) => {
      setComment("");
      if (data && data.id) {
        setAllComments((prev) => {
          const merged = [...prev, data];
          setVisibleComments(merged.length);
          return merged;
        });
        commentsFetchedRef.current = true;
      }
      if (typeof onPostUpdated === "function") {
        onPostUpdated();
      } else if (typeof onCommentAdded === "function") {
        onCommentAdded();
      } else {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
      toast.success("Comentario agregado");
    },
    onError: () => {
      toast.error("Error al agregar comentario");
    },
  });

  const { mutateAsync: updatePost, isPending: savingPost } = useMutation({
    mutationFn: async (content) => {
      const { data } = await api.put(`/posts/${post.id}`, { content });
      return data;
    },
    onSuccess: () => {
      setEditingPost(false);
      if (typeof onPostUpdated === "function") {
        onPostUpdated();
      } else {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
      toast.success("Post actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar post");
    },
  });

  const { mutateAsync: updateComment, isPending: savingComment } = useMutation({
    mutationFn: async ({ commentId, content }) => {
      const { data } = await api.put(`/posts/${post.id}/comments/${commentId}`, { content });
      return data;
    },
    onSuccess: () => {
      setEditingCommentId(null);
      setEditCommentContent("");
      if (typeof onPostUpdated === "function") {
        onPostUpdated();
      } else {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
      toast.success("Comentario actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar comentario");
    },
  });

  const { mutateAsync: reactComment, isPending: reactingComment } = useMutation({
    mutationFn: async ({ commentId, type }) => {
      const { data } = await api.post(`/posts/${post.id}/comments/${commentId}/reactions`, { type });
      return data;
    },
    onSuccess: (data, variables) => {
      if (variables?.commentId && data?.reactions) {
        setAllComments((prev) =>
          prev.map((c) =>
            c.id === variables.commentId
              ? { ...c, reactions: data.reactions, userReaction: data.userReaction }
              : c
          )
        );
      }
      if (typeof onPostUpdated === "function") {
        onPostUpdated();
      } else {
        fetchComments();
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
    },
    onError: () => {
      toast.error("Error al reaccionar al comentario");
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
        {/* Área de hover: todo menos el input de comentario */}
        <div
          className="space-y-4"
          onMouseEnter={() => setShowComments(true)}
          onMouseLeave={() => setShowComments(false)}
        >
          <div className="flex items-start gap-3">
            <Avatar user={post.author} size={48} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/profile/${post.author?.username || ""}`} className="hover:opacity-90">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                      {post.author?.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">@{post.author?.username}</div>
                  </div>
                </Link>
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
            {editingPost ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:border-indigo-400 focus:outline-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updatePost(editContent)}
                    disabled={savingPost || !editContent.trim()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {savingPost ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingPost(false);
                      setEditContent(post.content || "");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              formatTextWithHashtags(post.content)
            )}
          </div>

          {post.image && (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={getImageUrl(post.image)}
                alt="Post"
                className="w-full object-cover max-h-96 cursor-pointer"
                onClick={() => open(getImageUrl(post.image), "Imagen")}
                loading="lazy"
              />
            </div>
          )}

          {(safeHashtags.length || safeTags.length) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {safeHashtags.map((tag) => (
                <Link
                  key={tag}
                  to={`/tag/${encodeURIComponent(tag)}`}
                  className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                >
                  #{tag}
                </Link>
              ))}
              {safeTags.map((tag) => (
                <Link
                  key={tag}
                  to={`/tag/${encodeURIComponent(tag)}`}
                  className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700/80"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Zona que controla el hover para desplegar comentarios (excluye el área del input) */}
          <div className="flex flex-wrap items-center gap-2">
            {REACTION_ORDER.map((key) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  setReaction(key);
                  if (reactionHintTimeout.current) clearTimeout(reactionHintTimeout.current);
                  setReactionHint(REACTIONS[key].label);
                  reactionHintTimeout.current = setTimeout(() => setReactionHint(""), 900);
                }}
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
              </motion.button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <motion.span
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-100 dark:border-indigo-700 text-xs font-semibold"
              >
                💬 {post._count?.comments ?? allComments.length ?? 0}
              </motion.span>
            </div>
            {post.author?.id === user?.id && !editingPost && (
              <button
                onClick={() => setEditingPost(true)}
                className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Editar post
              </button>
            )}
          </div>

          <div className="space-y-3">
            {reactionHint && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="md:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 text-slate-100 text-xs font-semibold shadow"
              >
                <span>{reactionHint}</span>
              </motion.div>
            )}
            {!showComments && (
              <div className="hidden md:block text-xs text-slate-500 dark:text-slate-300">
                Pasá el mouse para ver comentarios (#{commentCount})
              </div>
            )}
            <div
              className={`rounded-xl border border-slate-200 dark:border-slate-800 ${
                showComments ? "bg-slate-50 dark:bg-slate-900/60" : "bg-transparent"
              }`}
            >
              <AnimatePresence>
                {showComments && (
                  <motion.div
                    key="comments-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="max-h-64 overflow-y-auto px-3 py-2 space-y-3"
                    style={{ willChange: "transform, opacity" }}
                  >
                    {loadingComments && (
                      <div className="text-xs text-slate-500 dark:text-slate-300">Cargando comentarios...</div>
                    )}
                    {!loadingComments &&
                      allComments.slice(0, visibleComments).map((c) => {
                        const isAuthor = c.author?.id === user?.id;
                        const isEditingThis = editingCommentId === c.id;
                        return (
                          <motion.div
                            layout
                            key={c.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="flex gap-2 items-start text-sm"
                          >
                            <Avatar user={c.author} size={32} />
                            <div className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-3 py-2 space-y-1">
                                <div className="flex items-center justify-between">
                                <Link to={`/profile/${c.author?.username || ""}`} className="font-semibold text-slate-800 dark:text-slate-100 hover:underline">
                                  {c.author?.name}
                                </Link>
                                {isAuthor && !isEditingThis && (
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(c.id);
                                      setEditCommentContent(c.content);
                                    }}
                                    className="text-[11px] text-slate-500 hover:text-indigo-600"
                                    type="button"
                                  >
                                    Editar
                                  </button>
                                )}
                              </div>
                              {isEditingThis ? (
                                <div className="space-y-1">
                                  <textarea
                                    value={editCommentContent}
                                    onChange={(e) => setEditCommentContent(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-800 dark:text-slate-100 focus:border-indigo-400 focus:outline-none"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => updateComment({ commentId: c.id, content: editCommentContent })}
                                      disabled={savingComment || !editCommentContent.trim()}
                                      className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 disabled:opacity-60"
                                    >
                                      {savingComment ? "Guardando..." : "Guardar"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditCommentContent("");
                                      }}
                                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line">
                                  {formatTextWithHashtags(c.content)}
                                </p>
                              )}
                              {!isEditingThis && (
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300">
                                  {REACTION_ORDER.map((key) => (
                                    <button
                                      key={key}
                                      onClick={() => reactComment({ commentId: c.id, type: key })}
                                      disabled={reactingComment}
                                      className={`flex items-center gap-1 rounded-full px-2 py-1 border ${
                                        c.userReaction === key
                                          ? "bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200"
                                          : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      }`}
                                    >
                                      <span>{REACTIONS[key].icon}</span>
                                      <span className="font-semibold">{c.reactions?.[key] ?? 0}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    {!loadingComments && allComments.length === 0 && (
                      <div className="text-xs text-slate-500 dark:text-slate-300">No hay comentarios aún.</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Input y acciones adicionales (fuera del hover) */}
          <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-300 md:hidden">
            <button
              type="button"
              onClick={() => setShowComments((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 shadow-sm"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-9 8l4-3h8l4 3V4a1 1 0 00-1-1H4a1 1 0 00-1 1v16z" />
                </svg>
              </span>
              <span className="font-semibold text-sm">Comentarios</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-[12px] font-bold text-indigo-700 dark:text-indigo-200">
                {commentCount}
              </span>
              {commentCount > 0 && (
                <motion.span
                  animate={{ y: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                  className="text-indigo-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 15a.75.75 0 01-.53-.22l-5-5a.75.75 0 011.06-1.06L10 13.19l4.47-4.47a.75.75 0 111.06 1.06l-5 5A.75.75 0 0110 15z" clipRule="evenodd" />
                  </svg>
                </motion.span>
              )}
            </button>
          </div>
          <div className="flex gap-2 items-start">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              ref={commentInputRef}
              rows={2}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:border-indigo-400 focus:outline-none"
              placeholder="Escribe un comentario..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (comment.trim() && !commenting) {
                    sendComment(comment);
                  }
                }
              }}
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
