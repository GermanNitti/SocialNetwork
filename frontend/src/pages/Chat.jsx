import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";

const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

const emotionKeywords = {
  love: ["amor", "te amo", "te quiero", "❤️", "😍", "beso"],
  sadness: ["triste", "mal", "llorar", "depre", "😢", "😭"],
  joy: ["jaja", "jaj", "jeje", "feliz", "bien", "genial", "buenisimo", "😂", "😄"],
  anger: ["odio", "mierda", "puta", "carajo", "concha", "enojo", "🤬", "😡"],
};

const emotionColors = {
  love: { from: "#FF77B7", to: "#D81B60", glow: "rgba(255,120,180,.45)" },
  sadness: { from: "#4FC3F7", to: "#1976D2", glow: "rgba(80,160,255,.45)" },
  joy: { from: "#FFD54A", to: "#FFB300", glow: "rgba(255,200,80,.45)" },
  anger: { from: "#FF4D4D", to: "#C62828", glow: "rgba(255,80,80,.45)" },
};

const emotionPriority = ["love", "sadness", "joy", "anger"];

function detectEmotion(text) {
  const t = text.toLowerCase();
  const emotionCounts = {};

  for (const [emotion, keys] of Object.entries(emotionKeywords)) {
    emotionCounts[emotion] = keys.reduce((acc, k) => {
      const matches = (t.match(new RegExp(k, 'g')) || []).length;
      return acc + matches;
    }, 0);
  }

  let maxCount = 0;
  let dominantEmotion = null;

  for (const emotion of emotionPriority) {
    if (emotionCounts[emotion] > maxCount) {
      maxCount = emotionCounts[emotion];
      dominantEmotion = emotion;
    }
  }

  return dominantEmotion ? { emotion: dominantEmotion, intensity: Math.min(maxCount / 3, 1) } : null;
}

const generateBubbleParticles = (count = 15) => {
  return Array.from({ length: count }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 50;
    
    return {
      id: i,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.4 + 0.3,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
    };
  });
};

const generateBubbleContourPositions = (count = 80, width = 200, height = 80, borderRadius = 24) => {
  const positions = [];
  
  const straightWidth = width - 2 * borderRadius;
  const straightHeight = height - 2 * borderRadius;
  const cornerArcLength = (Math.PI / 2) * borderRadius;
  const perimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArcLength;
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const pos = t * perimeter;
    
    let x, y;
    let currentPos = 0;
    
    if (pos < straightWidth) {
      x = pos - width / 2 + borderRadius;
      y = -height / 2;
    }
    else if (pos < straightWidth + cornerArcLength) {
      currentPos = pos - straightWidth;
      const angle = (currentPos / cornerArcLength) * (Math.PI / 2);
      x = width / 2 - borderRadius + Math.sin(angle) * borderRadius;
      y = -height / 2 + borderRadius - Math.cos(angle) * borderRadius;
    }
    else if (pos < straightWidth + cornerArcLength + straightHeight) {
      currentPos = pos - straightWidth - cornerArcLength;
      x = width / 2;
      y = -height / 2 + borderRadius + currentPos;
    }
    else if (pos < straightWidth + 2 * cornerArcLength + straightHeight) {
      currentPos = pos - straightWidth - cornerArcLength - straightHeight;
      const angle = (currentPos / cornerArcLength) * (Math.PI / 2);
      x = width / 2 - borderRadius + Math.cos(angle) * borderRadius;
      y = height / 2 - borderRadius + Math.sin(angle) * borderRadius;
    }
    else if (pos < 2 * straightWidth + 2 * cornerArcLength + straightHeight) {
      currentPos = pos - straightWidth - 2 * cornerArcLength - straightHeight;
      x = width / 2 - borderRadius - currentPos;
      y = height / 2;
    }
    else if (pos < 2 * straightWidth + 3 * cornerArcLength + straightHeight) {
      currentPos = pos - 2 * straightWidth - 2 * cornerArcLength - straightHeight;
      const angle = (currentPos / cornerArcLength) * (Math.PI / 2);
      x = -width / 2 + borderRadius - Math.sin(angle) * borderRadius;
      y = height / 2 - borderRadius + Math.cos(angle) * borderRadius;
    }
    else if (pos < 2 * straightWidth + 3 * cornerArcLength + 2 * straightHeight) {
      currentPos = pos - 2 * straightWidth - 3 * cornerArcLength - straightHeight;
      x = -width / 2;
      y = height / 2 - borderRadius - currentPos;
    }
    else {
      currentPos = pos - 2 * straightWidth - 3 * cornerArcLength - 2 * straightHeight;
      const angle = (currentPos / cornerArcLength) * (Math.PI / 2);
      x = -width / 2 + borderRadius - Math.cos(angle) * borderRadius;
      y = -height / 2 + borderRadius - Math.sin(angle) * borderRadius;
    }
    
    const noise = (Math.random() - 0.5) * 12;
    
    positions.push({
      x: x + noise,
      y: y + noise,
    });
  }
  
  return positions;
};

const uid = () => `${Date.now()}-${Math.random()}`;


export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState("list");
  const [active, setActive] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatTheme, setChatTheme] = useState("black");
  const [typingParticles, setTypingParticles] = useState([]);
  const [smallParticles, setSmallParticles] = useState([]);
  const [visibleBubbles, setVisibleBubbles] = useState(new Set());
  const [activeBubbles, setActiveBubbles] = useState(new Set());
  const visibilityTimers = useRef({});
  const lastTypeTime = useRef(Date.now());
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [pulse, setPulse] = useState(0);

  const baseEmotion = {
    from: "#667EEA",
    to: "#764BA2",
    glow: "rgba(102,126,234,.35)",
  };

  const activeEmotion = detectEmotion(text);
  const emotion =
    activeEmotion && emotionColors[activeEmotion.emotion]
      ? emotionColors[activeEmotion.emotion]
      : baseEmotion;
  const emotionIntensity = activeEmotion ? activeEmotion.intensity : 0;

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

  const [localMessages, setLocalMessages] = useState([]);

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

  useEffect(() => {
    if (messages) {
      setLocalMessages(messages.map(m => ({ ...m, isFormed: true, particles: null, bubbleParticles: null, animating: false, floating: [] })));
    }
  }, [messages]);

  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        const bubbleId = entry.target.dataset.bubbleId;
        
        if (entry.isIntersecting) {
          if (visibilityTimers.current[bubbleId]) {
            clearTimeout(visibilityTimers.current[bubbleId]);
          }
          
          visibilityTimers.current[bubbleId] = setTimeout(() => {
            setVisibleBubbles((prev) => {
              const newSet = new Set(prev);
              newSet.add(bubbleId);
              return newSet;
            });
          }, 250);
        } else {
          if (visibilityTimers.current[bubbleId]) {
            clearTimeout(visibilityTimers.current[bubbleId]);
            delete visibilityTimers.current[bubbleId];
          }
          
          setVisibleBubbles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(bubbleId);
            return newSet;
          });
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: "50px",
    });

    const bubbleElements = document.querySelectorAll("[data-bubble-id]");
    bubbleElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      Object.values(visibilityTimers.current).forEach(clearTimeout);
    };
  }, [localMessages]);

  useEffect(() => {
    const visibleArray = Array.from(visibleBubbles);
    
    if (visibleArray.length <= 7) {
      setActiveBubbles(new Set(visibleArray));
    } else {
      const messageIds = localMessages.map(m => m.id);
      const sortedVisible = visibleArray.sort((a, b) => {
        return messageIds.indexOf(b) - messageIds.indexOf(a);
      });
      setActiveBubbles(new Set(sortedVisible.slice(0, 7)));
    }
  }, [visibleBubbles, localMessages]);

  useEffect(() => {
    if (!text) return;

    const now = Date.now();
    const delta = now - lastTypeTime.current;
    lastTypeTime.current = now;

    const speed = clamp(1000 / delta, 0, 6);
    setTypingSpeed(speed);
    setPulse((p) => clamp(p + 0.35, 0, 1));
  }, [text]);

  useEffect(() => {
    if (pulse <= 0) return;
    const t = setTimeout(() => {
      setPulse((p) => clamp(p - 0.04, 0, 1));
    }, 16);
    return () => clearTimeout(t);
  }, [pulse]);

  const textFactor = clamp(text.length / 200, 0, 1);
  const intensity = clamp(
    typingSpeed * 0.6 + textFactor * 0.4,
    0,
    1
  );

  useEffect(() => {
    if (!text) {
      setTypingParticles([]);
      setSmallParticles([]);
      return;
    }

    setTypingParticles((prev) => {
      if (prev.length > 0) return prev;

      const add = [];
      const bubbleWidth = 200;
      const bubbleHeight = 80;
      const borderRadius = 24;
      
      const contourPositions = generateBubbleContourPositions(80, bubbleWidth, bubbleHeight, borderRadius);

      contourPositions.forEach((pos, i) => {
        const explosionDistance = 80 + Math.random() * 40;
        const angle = Math.atan2(pos.y, pos.x);
        
        const explosionX = pos.x + Math.cos(angle) * explosionDistance;
        const explosionY = pos.y + Math.sin(angle) * explosionDistance;
        
        const noiseAmount = 20;
        const noiseX = (Math.random() - 0.5) * noiseAmount;
        const noiseY = (Math.random() - 0.5) * noiseAmount;
        
        add.push({
          id: uid(),
          fromX: pos.x,
          fromY: pos.y,
          orbitX: pos.x * 0.85 + noiseX * 0.3,
          orbitY: pos.y * 0.85 + noiseY * 0.3,
          explosionX: explosionX + noiseX,
          explosionY: explosionY + noiseY,
          noiseX: (Math.random() - 0.5) * 12,
          noiseY: (Math.random() - 0.5) * 12,
          size: Math.random() * 2.5 + 1.5,
          delay: Math.random() * 1.5,
          speed: 2.5 + Math.random() * 1,
          emotional: Math.random() < emotionIntensity && activeEmotion,
        });
      });

      return add;
    });
  }, [text]);

  useEffect(() => {
    if (!text) return;

    const newSmall = Array.from({ length: 3 }).map(() => ({
      id: uid(),
      x: (Math.random() - 0.5) * 35,
      y: (Math.random() - 0.5) * 30,
      size: Math.random() * 1 + 0.5,
      emotional: Math.random() < emotionIntensity && activeEmotion,
    }));

    setSmallParticles((prev) => [...prev.slice(-30), ...newSmall]);
  }, [text.length]);

  useEffect(() => {
    if (!text || typingParticles.length === 0) return;

    setTypingParticles((prev) =>
      prev.map((p) => ({
        ...p,
        emotional: Math.random() < emotionIntensity && activeEmotion,
      }))
    );
    
    setSmallParticles((prev) =>
      prev.map((p) => ({
        ...p,
        emotional: Math.random() < emotionIntensity && activeEmotion,
      }))
    );
  }, [activeEmotion, emotionIntensity]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const send = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      const targetUsername = activeUser?.username;
      if (!targetUsername) return;
      await api.post(`/chat/to/${targetUsername}`, { content: text });
    },
    onSuccess: () => {
  const id = uid();
  const messageText = text;
  const floating = typingParticles;
  const msgEmotion = activeEmotion ? activeEmotion.emotion : null;
  const bubbleParticles = generateBubbleParticles(15);

  setLocalMessages((prev) => [
    ...prev,
    {
      id,
      content: messageText,
      sender: { id: user.id, username: user.username },
      createdAt: new Date().toISOString(),
      isFormed: true,
      animating: true,
      floating,
      emotion: msgEmotion,
      bubbleParticles,
      reactions: [],
      read: false,
    },
  ]);

  setText("");
  setTypingParticles([]);

  setTimeout(() => {
    setLocalMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? { ...msg, animating: false, floating: [] }
          : msg
      )
    );
  }, 1100);

  setTimeout(() => {
    queryClient.invalidateQueries({ queryKey: ["messages", active] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, 1200);
}

  });

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim()) {
      send.mutate();
    }
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
    <div 
      className="w-full h-[100dvh] flex flex-col relative overflow-hidden"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundImage: chatTheme === "black" 
          ? `url(/background%20black.jpg)` 
          : `url(/background%20white.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {chatTheme === "black" && (
        <div className="absolute inset-0 bg-black/30" />
      )}
      {chatTheme === "white" && (
        <div className="absolute inset-0 bg-white/30" />
      )}
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
              className={`relative backdrop-blur-2xl border-b p-4 ${chatTheme === 'black' ? 'bg-white/10 border-white/10' : 'bg-black/5 border-black/10'}`}
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <div className={`absolute inset-0 blur-xl ${chatTheme === 'black' ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20' : 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10'}`} />
              <div className="relative flex items-center gap-4">
                <motion.button
                  onClick={goBack}
                  className={`p-2 rounded-full transition-colors ${chatTheme === 'black' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
                  whileHover={{ scale:1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className={`w-5 h-5 ${chatTheme === 'black' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <motion.button
                  onClick={() => setChatTheme(chatTheme === "black" ? "white" : "black")}
                  className={`p-2 rounded-full transition-colors ${chatTheme === 'black' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
                  whileHover={{ scale:1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className={`w-5 h-5 ${chatTheme === 'black' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
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
                  <h3 className={`font-semibold text-lg ${chatTheme === 'black' ? 'text-white' : 'text-black'}`}>{activeUser.name}</h3>
                  <motion.p 
                    className={`text-xs ${chatTheme === 'black' ? 'text-green-400' : 'text-green-600'}`}
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
                  <svg className={`w-5 h-5 ${chatTheme === 'black' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </motion.button>
                <motion.button 
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className={`w-5 h-5 ${chatTheme === 'black' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </motion.button>
                <motion.button 
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className={`w-5 h-5 ${chatTheme === 'black' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                 </motion.button>
               </div>
             </motion.div>

             <div className="flex-1 overflow-y-auto p-6 space-y-4 relative scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
               <AnimatePresence>
                 {localMessages.map((message) => {
                   const isMe = message.sender?.id === user.id;
                   const msgEmotion =
                     message.emotion && emotionColors[message.emotion]
                       ? emotionColors[message.emotion]
                       : baseEmotion;

                   return (
                     <motion.div 
                       key={message.id}
                       className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                       data-bubble-id={message.id}
                     >
                       <div
                         className="relative max-w-xs"
                         style={{ minHeight: message.animating ? 90 : "auto" }}
                       >
                         {message.animating &&
                           message.floating.map((p) => {
                             const c = p.emotional ? msgEmotion : baseEmotion;
                             return (
                               <motion.div
                                 key={p.id}
                                 className="absolute rounded-full pointer-events-none"
                                 style={{
                                   width: p.size,
                                   height: p.size,
                                   background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                                   boxShadow: `0 0 ${18 + pulse * 10}px ${c.glow}`,
                                   left: "50%",
                                   top: "50%",
                                 }}
                                 initial={{
                                   x: p.fromX,
                                   y: p.fromY,
                                   opacity: 1,
                                   scale: 0.8,
                                 }}
                                 animate={{
                                   x: [p.fromX, p.explosionX, p.explosionX],
                                   y: [p.fromY, p.explosionY, p.explosionY],
                                   opacity: [1, 0.6, 0],
                                   scale: [0.8, 1.6 + pulse * 0.5, 0.2],
                                 }}
                                 transition={{
                                   duration: 1.1 - intensity * 0.3,
                                   ease: [0.4, 0, 0.2, 1],
                                 }}
                               />
                             );
                           })}

                         <motion.div
                           initial={{
                             opacity: 0,
                             scale: 0.92,
                             filter: "blur(14px)",
                           }}
                           animate={{
                             opacity: 1,
                             scale: 1,
                             filter: "blur(0px)",
                           }}
                           transition={{ duration: 0.45 }}
                           className={`relative z-10 p-4 rounded-3xl backdrop-blur-xl border overflow-hidden ${isMe ? 'text-white' : 'text-gray-900'}`}
                           style={{
                             background: isMe
                               ? `linear-gradient(135deg, ${msgEmotion.from}18, ${msgEmotion.to}28)`
                               : `linear-gradient(135deg, ${msgEmotion.from}28, ${msgEmotion.to}38)`,
                             borderColor: `${msgEmotion.from}50`,
                             boxShadow: `0 10px 36px ${msgEmotion.glow}, inset 0 1px 2px ${msgEmotion.from}30`,
                           }}
                         >
                           {activeBubbles.has(message.id) && (
                             <div className="absolute inset-0 pointer-events-none overflow-hidden">
                               {message.bubbleParticles && message.bubbleParticles.map((p) => (
                                 <motion.div
                                   key={`static-${p.id}`}
                                   className="absolute rounded-full"
                                   style={{
                                     width: p.size,
                                     height: p.size,
                                     background: `linear-gradient(135deg, ${msgEmotion.from}, ${msgEmotion.to})`,
                                     left: "50%",
                                     top: "50%",
                                     opacity: p.opacity,
                                   }}
                                   animate={{
                                     x: [p.x, p.x + 5, p.x],
                                     y: [p.y, p.y - 8, p.y],
                                   }}
                                   transition={{
                                     duration: p.duration,
                                     delay: p.delay,
                                     repeat: Infinity,
                                     repeatType: "reverse",
                                     ease: "easeInOut",
                                   }}
                                 />
                               ))}
                             </div>
                           )}

                           <span className="relative z-10 drop-shadow-sm">
                             {message.content}
                           </span>

                           <div className="flex items-center justify-end gap-2 mt-2">
                             <span className={`text-xs opacity-70 ${isMe ? 'text-white' : 'text-gray-600'}`}>
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
                                   <span className={`text-xs ${chatTheme === 'black' ? 'text-white/80' : 'text-black/80'}`}>{reaction.count}</span>
                                 </motion.div>
                               ))}
                             </motion.div>
                           )}
                         </motion.div>
                       </div>
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

               {typingParticles.length > 0 && (
                 <div className="flex justify-end pointer-events-none">
                   <div className="relative" style={{ width: 200, height: 80 }}>
                     <div 
                       className="absolute rounded-3xl"
                       style={{
                         width: '100%',
                         height: '100%',
                         left: '50%',
                         top: '50%',
                         transform: 'translate(-50%, -50%)',
                       }}
                     >
                       {typingParticles.map((p) => {
                         const c = p.emotional ? emotion : baseEmotion;

                         return (
                           <motion.div
                             key={p.id}
                             className="absolute rounded-full"
                             style={{
                               width: p.size,
                               height: p.size,
                               background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                               boxShadow: `0 0 ${14 + intensity * 12}px ${c.glow}`,
                               left: "50%",
                               top: "50%",
                               willChange: "transform",
                             }}
                             initial={{
                               x: p.fromX,
                               y: p.fromY,
                               opacity: 0,
                               scale: 0.3,
                             }}
                             animate={{
                               x: [p.orbitX + p.noiseX, p.orbitX - p.noiseX],
                               y: [p.orbitY - p.noiseY, p.orbitY + p.noiseY],
                               opacity: 1,
                               scale: 1.2,
                             }}
                             transition={{
                               duration: p.speed,
                               delay: p.delay,
                               ease: "easeInOut",
                               repeat: Infinity,
                               repeatType: "reverse",
                             }}
                           />
                         );
                       })}
                      
                      {smallParticles.map((p) => {
                        const c = p.emotional ? emotion : baseEmotion;

                        return (
                          <motion.div
                            key={p.id}
                            className="absolute rounded-full"
                            style={{
                              width: p.size,
                              height: p.size,
                              background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                              left: "50%",
                              top: "50%",
                              willChange: "transform",
                            }}
                            initial={{
                              x: 0,
                              y: 0,
                              opacity: 1,
                              scale: 1,
                            }}
                            animate={{
                              x: p.x,
                              y: p.y,
                              opacity: 0,
                              scale: 0.3,
                            }}
                            transition={{
                              duration: 0.6,
                              ease: "easeOut",
                            }}
                          />
                        );
                      })}
                     </div>
                   </div>
                 </div>
               )}
             </div>

             <motion.div 
               className={`relative backdrop-blur-2xl border-t p-4 ${chatTheme === 'black' ? 'bg-white/10 border-white/10' : 'bg-black/5 border-black/10'}`}
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
             >
               <div className={`absolute inset-0 blur-xl ${chatTheme === 'black' ? 'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10' : 'bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5'}`} />
               <div className="relative flex items-end gap-3">
                 <motion.button
                   className={`p-2 rounded-full transition-colors mb-2 ${chatTheme === 'black' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
                   whileHover={{ scale: 1.1, rotate: 15 }}
                   whileTap={{ scale: 0.9 }}
                 >
                   <svg className={`w-5 h-5 ${chatTheme === 'black' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                   </svg>
                 </motion.button>
                 <motion.button
                   className={`p-2 rounded-full transition-colors mb-2 ${chatTheme === 'black' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                 >
                   <svg className={`w-5 h-5 ${chatTheme === 'black' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                 </motion.button>
                 <div className="flex-1 relative">
                   <motion.div
                     className={`absolute inset-0 rounded-3xl blur-lg ${chatTheme === 'black' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20' : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10'}`}
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
                       className={`relative w-full backdrop-blur-xl rounded-3xl px-6 py-3 border focus:outline-none transition-all ${chatTheme === 'black' ? 'bg-white/10 text-white placeholder-white/50 border-white/20 focus:border-purple-400/50' : 'bg-white/60 text-black placeholder-black/50 border-black/20 focus:border-purple-400/50'}`}
                     />
                   </form>
                   <motion.button
                     className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${chatTheme === 'black' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.9 }}
                   >
                     <svg className={`w-5 h-5 ${chatTheme === 'black' ? 'text-white' : 'text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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