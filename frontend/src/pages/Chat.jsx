import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [active, setActive] = useState(null);
  const [text, setText] = useState("");

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await api.get("/chat/conversations");
      return data || [];
    },
    refetchInterval: 15000,
  });

  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const { data } = await api.get("/friends");
      return data || [];
    },
  });

  const { data: messages } = useQuery({
    enabled: !!active,
    queryKey: ["messages", active],
    queryFn: async () => {
      const { data } = await api.get(`/chat/${active}/messages`);
      return data || [];
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!active && conversations && conversations.length > 0) {
      setActive(conversations[0].id);
    }
  }, [conversations, active]);

  const startConversation = useMutation({
    mutationFn: async (username) => {
      const { data } = await api.post(`/chat/start/${username}`);
      return data;
    },
    onSuccess: ({ id }) => {
      setActive(id);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      const convo = conversations?.find((c) => c.id === active);
      const other = convo?.participants?.find((p) => p.id !== user.id);
      const targetUsername = other?.username;
      if (!targetUsername) return;
      await api.post(`/chat/to/${targetUsername}`, { content: text });
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["messages", active] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return (
    <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Amigos</h2>
        {friends
          ?.filter((f) => f.status === "ACCEPTED")
          ?.map((f) => (
            <button
              key={f.user.id}
              onClick={() => startConversation.mutate(f.user.username)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="font-semibold">{f.user.name}</div>
              <div className="text-xs text-slate-500">@{f.user.username}</div>
            </button>
          ))}
        {friends?.filter((f) => f.status === "ACCEPTED")?.length === 0 && (
          <div className="text-xs text-slate-500">No tienes amigos aceptados aún.</div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chats</h2>
        {conversations?.map((c) => {
          const other = c.participants?.find((p) => p.id !== user.id) || c.participants?.[0];
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg ${active === c.id ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <div className="font-semibold">{other?.name || "Chat"}</div>
              <div className="text-xs text-slate-500">@{other?.username}</div>
              {c.lastMessage && (
                <div className="text-xs text-slate-500 truncate">
                  {c.lastMessage.sender?.username === user.username ? "Tú: " : ""}
                  {c.lastMessage.content}
                </div>
              )}
            </button>
          );
        })}
        {(!conversations || conversations.length === 0) && (
          <div className="text-xs text-slate-500">Aún no hay chats. Elige un amigo para empezar.</div>
        )}
      </div>

      <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 min-h-[400px]">
        <div className="flex-1 space-y-2 overflow-y-auto pr-2">
          {messages?.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.sender?.id === user.id ? "ml-auto bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"}`}
            >
              <div className="text-[11px] opacity-70">@{m.sender?.username}</div>
              <div>{m.content}</div>
            </div>
          ))}
          {!active && <div className="text-sm text-slate-500">Selecciona un chat o un amigo para empezar.</div>}
        </div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:border-indigo-400 focus:outline-none"
            placeholder="Escribe un mensaje..."
          />
          <button
            onClick={() => send.mutate()}
            disabled={!text.trim() || !active}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
