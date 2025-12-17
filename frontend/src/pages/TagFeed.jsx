import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function TagFeed() {
  const { tagName } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, refreshUser } = useAuth();
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get(`/posts?tag=${encodeURIComponent(tagName)}`);
        setPosts(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tagName]);

  async function handleFollowTag() {
    try {
      const currentInterests = user?.interests || [];
      const canonical = tagName.toLowerCase();
      if (currentInterests.includes(canonical)) return;
      setFollowing(true);
      const updated = [...currentInterests, canonical];
      await api.put("/users/me/interests", { interests: updated });
      await refreshUser?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setFollowing(false);
    }
  }

  if (loading) return <div className="p-4 text-slate-600 dark:text-slate-200">Cargando posts con #{tagName}...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">#{tagName}</h1>
        <p className="text-slate-600 dark:text-slate-300">Publicaciones relacionadas con este tema.</p>
        {user && (
          <button
            onClick={handleFollowTag}
            disabled={following || (user.interests || []).includes(tagName.toLowerCase())}
            className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            {(user.interests || []).includes(tagName.toLowerCase()) ? "Ya sigues este tema" : `Seguir tema #${tagName}`}
          </button>
        )}
      </div>
      {posts.length === 0 && <p className="text-slate-600 dark:text-slate-300">No hay publicaciones con este hashtag todavía.</p>}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
