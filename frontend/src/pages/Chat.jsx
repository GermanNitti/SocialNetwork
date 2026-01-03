import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";


export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState("list");
  const [active, setActive] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  if (!user) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white/60">Cargando...</div>
      </div>
    );
  }

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/chat/conversations");
        return data || [];
      } catch (error) {
        console.error("Error fetching conversations:", error);
        return [];
      }
    },
    refetchInterval: 15000,
  });

  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/friends");
        return data || [];
      } catch (error) {
        console.error("Error fetching friends:", error);
        return [];
      }
    },
  });

  const { data: messages } = useQuery({
    enabled: !!active,
    queryKey: ["messages", active],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/chat/${active}/messages`);
        return data || [];
      } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
      }
    },
    refetchInterval: 5000,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startConversation = useMutation({
    mutationFn: async (username) => {
      const { data } = await api.post(`/chat/start/${username}`);
      return data;
    },
    onSuccess: ({ id }) => {
      setActive(id);
      const friend = friends?.find((f) => f.user.username === username);
      if (friend) setActiveUser(friend.user);
      setView("chat");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const openChat = (conversation) => {
    const other = conversation.participants?.find((p) => p.id !== user.id) || conversation.participants?.[0];
    setActive(conversation.id);
    setActiveUser(other);
    setView("chat");
  };

  const goBack = () => {
    setView("list");
    setActive(null);
    setActiveUser(null);
  };

  const combinedList = (() => {
    const acceptedFriends = friends?.filter((f) => f.status === "ACCEPTED") || [];
    const friendUsernames = new Set(acceptedFriends.map((f) => f.user.username));
    const conversationsList = conversations || [];
    
    const conversationsWithoutFriends = conversationsList.filter(
      (c) => {
        const other = c.participants?.find((p) => p.id !== user.id) || c.participants?.[0];
        return other && !friendUsernames.has(other.username);
      }
    ) || [];

    return [
      ...conversationsList.map((c) => ({ type: "conversation", data: c })),
      ...acceptedFriends.filter((f) => !conversationsList.some((c) => {
        const other = c.participants?.find((p) => p.id !== user.id) || c.participants?.[0];
        return other?.username === f.user.username;
      })).map((f) => ({ type: "friend", data: f })),
      ...conversationsWithoutFriends.map((c) => ({ type: "conversation", data: c }))
    ].sort((a, b) => {
      const aTime = a.type === "conversation" && a.data.lastMessage?.createdAt 
        ? new Date(a.data.lastMessage.createdAt) 
        : new Date(0);
      const bTime = b.type === "conversation" && b.data.lastMessage?.createdAt 
        ? new Date(b.data.lastMessage.createdAt) 
        : new Date(0);
      return bTime - aTime;
    });
  })();

  const emotionColors = {
    excitement: { from: '#FF6B9D', to: '#C44569', glow: 'rgba(255, 107, 157, 0.3)' },
    joy: { from: '#FFA500', to: '#FF6B35', glow: 'rgba(255, 165, 0, 0.3)' },
    amazement: { from: '#4ECDC4', to: '#44A08D', glow: 'rgba(78, 205, 196, 0.3)' },
    pride: { from: '#F7DC6F', to: '#F39C12', glow: 'rgba(247, 220, 111, 0.3)' },
    neutral: { from: '#667EEA', to: '#764BA2', glow: 'rgba(102, 126, 234, 0.3)' }
  };

  const uid = () => `${Date.now()}-${Math.random()}`;

  const generateTextParticles = (text) => {
    const particles = [];
    const charsPerLine = 30;
    const lineHeight = 20;
    const charWidth = 8;
    
    for (let i = 0; i < text.length; i++) {
      const line = Math.floor(i / charsPerLine);
      const col = i % charsPerLine;
      
      const finalX = col * charWidth;
      const finalY = line * lineHeight;
      
      particles.push({
        id: uid(),
        char: text[i],
        startX: finalX + (Math.random() - 0.5) * 120,
        startY: 300 + Math.random() * 200,
        finalX,
        finalY,
        delay: Math.random() * 0.3
      });
    }
    
    return particles;
  };

  const generateBubbleParticles = (width, height) => {
    const particles = [];
    const spacing = 6;

    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 100;

        particles.push({
          id: uid(),
          finalX: x,
          finalY: y,
          startX: x + Math.cos(angle) * distance,
          startY: y + Math.sin(angle) * distance,
          delay: Math.random() * 0.4
        });
      }
    }

    return particles;
  };

  const [localMessages, setLocalMessages] = useState([]);

  useEffect(() => {
    if (messages) {
      setLocalMessages(messages.map(m => ({ ...m, isFormed: true, particles: null, bubbleParticles: null })));
    }
  }, [messages]);

  const send = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      const targetUsername = activeUser?.username;
      if (!targetUsername) return;
      await api.post(`/chat/to/${targetUsername}`, { content: text });
    },
    onSuccess: () => {
      const tempId = Date.now();
      const messageText = text;
      
      // Medir dimensiones de la burbuja
      const tempDiv = document.createElement("div");
      tempDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        max-width: 20rem;
        padding: 1rem;
        font-size: 1rem;
        line-height: 1.625;
        font-family: system-ui;
        white-space: pre-wrap;
      `;
      tempDiv.textContent = messageText;
      document.body.appendChild(tempDiv);

      const width = tempDiv.offsetWidth;
      const height = tempDiv.offsetHeight;

      document.body.removeChild(tempDiv);
      
      const newMessage = {
        id: tempId,
        content: messageText,
        sender: { id: user.id, username: user.username },
        createdAt: new Date(),
        isFormed: false,
        particles: generateTextParticles(messageText),
        bubbleParticles: generateBubbleParticles(width, height),
        bubbleWidth: width,
        bubbleHeight: height,
        reactions: [],
        read: false
      };
      
      setLocalMessages(prev => [...prev, newMessage]);
      setText("");
      
      setTimeout(() => {
        setLocalMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, isFormed: true } : msg
        ));
      }, 1500);
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["messages", active] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }, 1600);
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    send.mutate();
  };

  const addReaction = (messageId, emoji) => {
    setLocalMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          return {
            ...msg,
            reactions: msg.reactions.map(r => 
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            )
          };
        } else {
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { emoji, count: 1 }]
          };
        }
      }
      return msg;
    }));
  };

  return (
    <div className="w-full h-[100dvh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <AnimatePresence mode="wait">
        {view === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full flex flex-col"
          >
            <motion.div 
              className="relative backdrop-blur-2xl bg-white/10 border-b border-white/10 p-4"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl" />
              <h2 className="relative text-xl font-semibold text-white">Chats</h2>
            </motion.div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {combinedList.length === 0 ? (
                <motion.div 
                  className="flex flex-col items-center justify-center h-full text-white/60"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-20 h-20 mb-4 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm">No tienes chats aún</p>
                  <p className="text-xs mt-1">Añade amigos para empezar</p>
                </motion.div>
              ) : (
                combinedList.map((item, idx) => {
                  const isConversation = item.type === "conversation";
                  const userData = isConversation 
                    ? (item.data.participants?.find((p) => p.id !== user.id) || item.data.participants?.[0])
                    : item.data.user;
                  const lastMessage = isConversation ? item.data.lastMessage : null;

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => isConversation ? openChat(item.data) : startConversation.mutate(userData.username)}
                      className="w-full text-left relative backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className="relative"
                          animate={{ 
                            boxShadow: [
                              '0 0 20px rgba(168, 85, 247, 0.3)',
                              '0 0 30px rgba(168, 85, 247, 0.5)',
                              '0 0 20px rgba(168, 85, 247, 0.3)'
                            ]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Avatar user={userData} size={48} />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-white truncate">{userData?.name}</div>
                            {lastMessage && (
                              <div className="text-xs text-white/50">
                                {new Date(lastMessage.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-xs text-white/60">@{userData?.username}</div>
                            {lastMessage && (
                              <div className="text-xs text-white/70 truncate max-w-[60%]">
                                {lastMessage.sender?.username === user.username ? "Tú: " : ""}
                                {lastMessage.content}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {view === "chat" && activeUser && (
          <motion.div
            key="chat"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full flex flex-col"
          >
            <motion.div 
              className="relative backdrop-blur-2xl bg-white/10 border-b border-white/10 p-4"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl" />
              <div className="relative flex items-center gap-4">
                <motion.button
                  onClick={goBack}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <motion.div 
                  className="relative"
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(219, 39, 119, 0.4)',
                      '0 0 40px rgba(219, 39, 119, 0.6)',
                      '0 0 20px rgba(219, 39, 119, 0.4)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-0.5">
                    <Avatar user={activeUser} size={46} />
                  </div>
                  <motion.div 
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-slate-900"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">{activeUser.name}</h3>
                  <motion.p 
                    className="text-xs text-green-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ● En línea
                  </motion.p>
                </div>
                <motion.button 
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </motion.button>
                <motion.button 
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </motion.button>
                <motion.button 
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
              <div className="absolute inset-0 opacity-30">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0.2, 0.8, 0.2],
                      scale: [1, 1.5, 1]
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  />
                ))}
              </div>

              <AnimatePresence>
                {localMessages.map((message) => {
                  const isMe = message.sender?.id === user.id;
                  const emotion = emotionColors.neutral;
                  const isFormed = message.isFormed !== undefined ? message.isFormed : true;

                  return (
                    <motion.div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative z-10`}
                      initial={{ x: isMe ? 100 : -100, opacity: 0, scale: 0.8 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    >
                      <motion.div 
                        className={`group relative max-w-xs ${isMe ? 'ml-12' : 'mr-12'}`}
                        whileHover={{ scale: isFormed ? 1.02 : 1 }}
                      >
                        {isFormed && (
                          <motion.div
                            className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity"
                            style={{
                              background: `linear-gradient(135deg, ${emotion.from}, ${emotion.to})`
                            }}
                          />
                        )}

                        <div
                          style={{
                            width: !isFormed && message.bubbleWidth ? message.bubbleWidth : 'auto',
                            height: !isFormed && message.bubbleHeight ? message.bubbleHeight : 'auto'
                          }}
                          className="relative"
                        >
                          {/* Partículas de burbuja */}
                          {!isFormed && message.bubbleParticles && (
                            <div className="absolute inset-0">
                              {message.bubbleParticles.map((p) => (
                                <motion.div
                                  key={p.id}
                                  className="absolute w-1 h-1 rounded-sm"
                                  style={{
                                    background: `linear-gradient(135deg, ${emotion.from}, ${emotion.to})`,
                                    boxShadow: `0 0 4px ${emotion.glow}`,
                                    left: p.finalX,
                                    top: p.finalY
                                  }}
                                  initial={{
                                    x: p.startX - p.finalX,
                                    y: p.startY - p.finalY,
                                    opacity: 0,
                                    scale: 0
                                  }}
                                  animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                  transition={{
                                    duration: 1.2,
                                    delay: p.delay,
                                    ease: [0.4, 0.0, 0.2, 1]
                                  }}
                                />
                              ))}
                            </div>
                          )}

                          {/* Partículas de texto */}
                          {!isFormed && message.particles && (
                            <div className="absolute inset-0 p-4">
                              {message.particles.map((p) => (
                                <motion.span
                                  key={p.id}
                                  className="absolute text-base text-white leading-relaxed"
                                  style={{
                                    textShadow: `0 0 10px ${emotion.from}`
                                  }}
                                  initial={{
                                    x: p.startX,
                                    y: p.startY,
                                    opacity: 0,
                                    scale: 0,
                                    filter: "blur(10px)"
                                  }}
                                  animate={{
                                    x: p.finalX,
                                    y: p.finalY,
                                    opacity: 1,
                                    scale: 1,
                                    filter: "blur(0px)"
                                  }}
                                  transition={{
                                    duration: 1,
                                    delay: p.delay,
                                    ease: [0.4, 0.0, 0.2, 1]
                                  }}
                                >
                                  {p.char}
                                </motion.span>
                              ))}
                            </div>
                          )}

                          {/* Mensaje formado */}
                          {isFormed && (
                            <motion.div
                              className={`relative backdrop-blur-xl rounded-3xl p-4 border ${
                                isMe 
                                  ? 'bg-gradient-to-br text-white border-white/20' 
                                  : 'bg-white/10 text-white border-white/10'
                              }`}
                              style={{
                                background: isMe 
                                  ? `linear-gradient(135deg, ${emotion.from}, ${emotion.to})`
                                  : 'rgba(255, 255, 255, 0.05)',
                                boxShadow: `0 8px 32px ${emotion.glow}`
                              }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <p className="text-base leading-relaxed">{message.content}</p>
                              
                              <div className="flex items-center justify-end gap-2 mt-2">
                                <span className="text-xs opacity-70">
                                  {new Date(message.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                  >
                                    {message.read ? (
                                      <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </motion.div>
                                )}
                              </div>

                              {message.reactions?.length > 0 && (
                                <motion.div 
                                  className="absolute -bottom-3 right-4 flex gap-1"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 300 }}
                                >
                                  {message.reactions.map((reaction, idx) => (
                                    <motion.div
                                      key={idx}
                                      className="bg-slate-800/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 border border-white/20"
                                      whileHover={{ scale: 1.2 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <span className="text-sm">{reaction.emoji}</span>
                                      <span className="text-xs text-white/80">{reaction.count}</span>
                                    </motion.div>
                                  ))}
                                </motion.div>
                              )}

                              <motion.div
                                className={`absolute ${isMe ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity`}
                              >
                                <div className="flex gap-1 bg-slate-800/90 backdrop-blur-xl rounded-full p-2 border border-white/20 shadow-xl">
                                  {['❤️', '👍', '😂', '🔥', '👑'].map((emoji, idx) => (
                                    <motion.button
                                      key={idx}
                                      className="text-lg hover:scale-125 transition-transform"
                                      whileHover={{ scale: 1.3 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => addReaction(message.id, emoji)}
                                    >
                                      {emoji}
                                    </motion.button>
                                  ))}
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-4 border border-white/10">
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-white rounded-full"
                            animate={{
                              y: [0, -10, 0],
                              opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            <motion.div 
              className="relative backdrop-blur-2xl bg-white/10 border-t border-white/10 p-4"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-xl" />
              <div className="relative flex items-end gap-3">
                <motion.button
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors mb-2"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </motion.button>
                <motion.button
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors mb-2"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </motion.button>
                <div className="flex-1 relative">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-lg"
                    animate={{
                      opacity: text ? [0.3, 0.6, 0.3] : 0.3
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <form onSubmit={handleSend}>
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="relative w-full bg-white/10 backdrop-blur-xl text-white placeholder-white/50 rounded-3xl px-6 py-3 border border-white/20 focus:outline-none focus:border-purple-400/50 transition-all"
                    />
                  </form>
                  <motion.button
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.button>
                </div>
                <AnimatePresence mode="wait">
                  {text ? (
                    <motion.button
                      key="send"
                      onClick={handleSend}
                      className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-2"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)'
                      }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </motion.button>
                  ) : (
                    <motion.button
                      key="mic"
                      className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 mb-2"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
                      }}
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}