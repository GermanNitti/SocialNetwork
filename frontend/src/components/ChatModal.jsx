import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatModal({ targetUsername, targetName, targetAvatar, onClose }) {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const { data: messages = [] } = useQuery({
    enabled: !!targetUsername,
    queryKey: ['messages', targetUsername],
    queryFn: async () => {
      const { data } = await api.get(`/chat/with/${targetUsername}/messages`);
      return data || [];
    },
    refetchInterval: 3000,
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      await api.post(`/chat/to/${targetUsername}`, { content: text });
      setText('');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', targetUsername] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    send.mutate();
  };

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          className="h-full bg-cover bg-center bg-no-repeat flex flex-col relative"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}background-black.jpg)` }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none" />
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {targetAvatar ? (
                <img
                  src={targetAvatar}
                  alt={targetName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white text-lg font-bold">
                  {targetName?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-base">{targetName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">@{targetUsername}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                <div className="text-center">
                  <div className="w-20 h-20 mb-4 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg className="w-10 h-10 text-indigo-400 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm">Inicia el chat...</p>
                  <p className="text-xs text-slate-400 mt-1">¡Saluda a {targetName}!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender?.id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[75%]">
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm ${
                        message.sender?.id === user?.id
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'
                      }`}
                    >
                      {message.content}
                    </div>
                    <div
                      className={`text-[10px] text-slate-400 dark:text-slate-500 mt-1 ${
                        message.sender?.id === user?.id ? 'text-right' : 'text-left'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 min-w-0 px-4 py-3 rounded-full bg-slate-50 dark:bg-slate-950 dark:text-white border border-slate-200 dark:border-slate-700 text-base focus:border-indigo-400 dark:focus:border-indigo-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!text.trim() || send.isPending}
                className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {send.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
