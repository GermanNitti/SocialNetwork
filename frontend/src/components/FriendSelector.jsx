import { useState, useEffect } from "react";
import api from "../api/client";
import Avatar from "./Avatar";
import { useMutation } from "@tanstack/react-query";

export default function FriendSelector({ onSelect, onClose, reelId }) {
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const { mutateAsync: shareReel, isPending: sharingReel } = useMutation({
    mutationFn: async (friendId) => {
      // This endpoint will be implemented in the backend tasks
      const { data } = await api.post(`/reels/${reelId}/share`, { friendId });
      return data;
    },
    onSuccess: () => {
      onClose(); // Close the modal on successful share
      // Potentially show a success message
    },
    onError: (error) => {
      console.error("Error sharing reel:", error);
      // Potentially show an error message
    },
  });

  useEffect(() => {
    async function fetchFriends() {
      try {
        setLoading(true);
        const { data } = await api.get("/friends");
        // The API returns an array of objects like { status, relationCategory, user, direction }
        // We only care about accepted friends, and their user object
        const acceptedFriends = data.filter(f => f.status === "ACCEPTED").map(f => f.user);
        setFriends(acceptedFriends);
      } catch (error) {
        console.error("Error fetching friends:", error);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFriends();
  }, []);

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
    // Optionally call onSelect immediately, or wait for a confirm button
    // For now, let's assume direct share on click
    if (reelId) {
      shareReel(friend.id);
    } else {
      // If no reelId, just select the friend and close for other potential uses
      onSelect(friend);
      onClose();
    }
  };

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Buscar amigos..."
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">Cargando amigos...</div>
      ) : filteredFriends.length === 0 ? (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">No se encontraron amigos.</div>
      ) : (
        <ul className="max-h-60 overflow-y-auto custom-scrollbar">
          {filteredFriends.map((friend) => (
            <li
              key={friend.id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition ${selectedFriend?.id === friend.id ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''}`}
              onClick={() => handleSelectFriend(friend)}
            >
              <Avatar user={friend} size={36} />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{friend.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">@{friend.username}</div>
              </div>
              {sharingReel && selectedFriend?.id === friend.id && (
                <span className="ml-auto text-xs text-indigo-600 dark:text-indigo-400">Enviando...</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
