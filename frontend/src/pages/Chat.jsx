import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";

const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

/* =========================
   EMOCIONES
   ========================= */
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

// Generar partículas estáticas para burbujas (solo una vez por burbuja)
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

// Generar posiciones siguiendo el contorno de una burbuja redondeada (rounded-3xl)
const generateBubbleContourPositions = (count = 80, width = 200, height = 80, borderRadius = 24) => {
  const positions = [];
  
  // Calcular el perímetro aproximado considerando las esquinas redondeadas
  const straightWidth = width - 2 * borderRadius;
  const straightHeight = height - 2 * borderRadius;
  const cornerArcLength = (Math.PI / 2) * borderRadius; // Cuarto de círculo
  const perimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArcLength;
  
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const pos = t * perimeter;
    
    let x, y;
    let currentPos = 0;
    
    // Lado superior (sin esquinas)
    if (pos < straightWidth) {
      x = pos - width / 2 + borderRadius;
      y = -height / 2;
    }
    // Esquina superior derecha (arco)
    else if (pos < straightWidth + cornerArcLength) {
      currentPos = pos - straightWidth;
      const angle = (currentPos / cornerArcLength) * (Math.PI / 2);
      x = width / 2 - borderRadius + Math.sin(angle) * borderRadius;
      y = -height / 2 + borderRadius - Math.cos(angle) * borderRadius;
    }
    // Lado derecho (sin esquinas)
    else if (pos < straightWidth + cornerArcLength + straightHeight) {
      currentPos = pos - straightWidth - cornerArcLength;
      x = width / 2;
      y = -height / 2 + borderRadius + currentPos;
    }
    // Esquina inferior derecha (arco)
    else if (pos < straightWidth + 2 * cornerArcLength + straightHeight) {
      currentPos = pos - straightWidth - cornerArcLength - straightHeight;
      const angle = (currentPos / cornerArcLength) * (Math.PI / 2);
      x = width / 2 - borderRadius + Math.cos(angle) * borderRadius;
      y = height / 2 - borderRadius + Math.sin(angle) * borderRadius;
    }
    // Lado inferior (sin esquinas)
    else if (pos < 2 * straightWidth + 2 * cornerArcLength + straightHeight) {
      currentPos = pos - straightWidth - 2 * cornerArcLength - straightHeight;
      x = width / 2 - borderRadius - currentPos;
      y = height / 2;
    }
    // Esquina inferior izquierda (arco)
    else if (pos < 2 * straightWidth + 3 * cornerArcLength + straightHeight) {
      currentPos = pos - 2 * straightWidth - 2 * cornerArcLength - straightHeight;
      const angle = (currentPos / cornerArcLength) * (Math.PI / 2);
      x = -width / 2 + borderRadius - Math.sin(angle) * borderRadius;
      y = height / 2 - borderRadius + Math.cos(angle) * borderRadius;
    }
    // Lado izquierdo (sin esquinas)
    else if (pos < 2 * straightWidth + 3 * cornerArcLength + 2 * straightHeight) {
      currentPos = pos - 2 * straightWidth - 3 * cornerArcLength - straightHeight;
      x = -width / 2;
      y = height / 2 - borderRadius - currentPos;
    }
    // Esquina superior izquierda (arco)
    else {
      currentPos = pos - 2 * straightWidth - 3 * cornerArcLength - 2 * straightHeight;
      const angle = (currentPos / cornerArcLength) * (Math.PI / 2);
      x = -width / 2 + borderRadius - Math.cos(angle) * borderRadius;
      y = -height / 2 + borderRadius - Math.sin(angle) * borderRadius;
    }
    
    // Agregar noise para distribución más natural
    const noise = (Math.random() - 0.5) * 12;
    
    positions.push({
      x: x + noise,
      y: y + noise,
    });
  }
  
  return positions;
};

const uid = () => `${Date.now()}-${Math.random()}`;

export default function ChatDemo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState("list");
  const [active, setActive] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [text, setText] = useState("");
  const [localMessages, setLocalMessages] = useState([]);
  const [typingParticles, setTypingParticles] = useState([]);
  const [smallParticles, setSmallParticles] = useState([]);
  
  // Estados para escritura fantasma
  const [ghostTyping, setGhostTyping] = useState(false);
  const [ghostPulse, setGhostPulse] = useState(0);
  const [ghostParticles, setGhostParticles] = useState([]);
  
  // Estados para visibilidad de burbujas
  const [visibleBubbles, setVisibleBubbles] = useState(new Set());
  const [activeBubbles, setActiveBubbles] = useState(new Set());
  const visibilityTimers = useRef({});
  
  const messagesEndRef = useRef(null);
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
    onSuccess: (data, username) => {
      setActive(data.id);
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
      setLocalMessages(messages.map(m => ({ 
        ...m, 
        id: m.id,
        text: m.content,
        sender: m.sender?.id,
        isFormed: true, 
        particles: null, 
        bubbleParticles: generateBubbleParticles(15), 
        animating: false, 
        floating: [] 
      })));
    }
  }, [messages]);

  /* =========================
     INTERSECTION OBSERVER PARA BURBUJAS VISIBLES
     ========================= */
  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        const bubbleId = entry.target.dataset.bubbleId;
        
        if (entry.isIntersecting) {
          // Agregar a visibles con debounce de 250ms
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
          // Remover inmediatamente cuando sale del viewport
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

    // Observar todos los mensajes
    const bubbleElements = document.querySelectorAll("[data-bubble-id]");
    bubbleElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      Object.values(visibilityTimers.current).forEach(clearTimeout);
    };
  }, [localMessages]);

  /* =========================
     GESTIÓN DE BURBUJAS ACTIVAS (MÁXIMO 7)
     ========================= */
  useEffect(() => {
    const visibleArray = Array.from(visibleBubbles);
    
    if (visibleArray.length <= 7) {
      // Si hay 7 o menos, activar todas
      setActiveBubbles(new Set(visibleArray));
    } else {
      // Si hay más de 7, priorizar las más recientes
      const messageIds = localMessages.map(m => m.id);
      const sortedVisible = visibleArray.sort((a, b) => {
        return messageIds.indexOf(b) - messageIds.indexOf(a);
      });
      setActiveBubbles(new Set(sortedVisible.slice(0, 7)));
    }
  }, [visibleBubbles, localMessages]);

  /* =========================
     ESCRITURA FANTASMA DEL OTRO USUARIO
     ========================= */
  useEffect(() => {
    if (view !== "chat") return;
    
    const startGhostTyping = () => {
      setGhostTyping(true);
      const duration = 3000 + Math.random() * 5000;
      
      setTimeout(() => {
        setGhostTyping(false);
        setGhostParticles([]);
        const pause = 5000 + Math.random() * 10000;
        setTimeout(startGhostTyping, pause);
      }, duration);
    };

    const initialTimer = setTimeout(startGhostTyping, 2000);
    return () => clearTimeout(initialTimer);
  }, [view]);

  useEffect(() => {
    if (!ghostTyping) {
      setGhostPulse(0);
      return;
    }

    const interval = setInterval(() => {
      setGhostPulse((p) => {
        const newPulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
        return newPulse;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [ghostTyping]);

  useEffect(() => {
    if (!ghostTyping) return;

    const interval = setInterval(() => {
      const newParticles = Array.from({ length: 2 }).map(() => {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 30;
        
        return {
          id: uid(),
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          size: Math.random() * 1.5 + 0.8,
        };
      });

      setGhostParticles((prev) => [...prev.slice(-20), ...newParticles]);
    }, 150);

    return () => clearInterval(interval);
  }, [ghostTyping]);

  /* =========================
     SCROLL AUTOMÁTICO
     ========================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  /* =========================
     VELOCIDAD DE TIPEO
     ========================= */
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

  /* =========================
     PARTÍCULAS DE ESCRITURA - Ahora con forma de burbuja
     ========================= */
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
      
      // Generar posiciones siguiendo el contorno de la burbuja
      const contourPositions = generateBubbleContourPositions(80, bubbleWidth, bubbleHeight, borderRadius);

      contourPositions.forEach((pos, i) => {
        // Calcular dirección de explosión desde el contorno
        const explosionDistance = 80 + Math.random() * 40;
        const angle = Math.atan2(pos.y, pos.x);
        
        // Posición final de explosión
        const explosionX = pos.x + Math.cos(angle) * explosionDistance;
        const explosionY = pos.y + Math.sin(angle) * explosionDistance;
        
        const noiseAmount = 20;
        const noiseX = (Math.random() - 0.5) * noiseAmount;
        const noiseY = (Math.random() - 0.5) * noiseAmount;
        
        add.push({
          id: uid(),
          // Posición inicial en el contorno de la burbuja
          fromX: pos.x,
          fromY: pos.y,
          // Posición orbital (más cerca del contorno)
          orbitX: pos.x * 0.85 + noiseX * 0.3,
          orbitY: pos.y * 0.85 + noiseY * 0.3,
          // Posición de explosión
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
          text: messageText,
          content: messageText,
          sender: user.id,
          createdAt: new Date().toISOString(),
          isFormed: true,
          animating: true,
          floating,
          emotion: msgEmotion,
          bubbleParticles,
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
    },
  });

  const handleSend = () => {
    if (text.trim()) {
      send.mutate();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-zinc-900 to-neutral-950 text-white relative overflow-hidden">
      {/* CAPA DE FONDO CON ESCRITURA FANTASMA */}
      {view === "chat" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Textura sutil de fondo */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                               radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
          
          <motion.div
            className="absolute inset-0"
            animate={{
              opacity: ghostTyping ? 0.08 + ghostPulse * 0.05 : 0,
            }}
            transition={{ duration: 0.3 }}
            style={{
              background: `radial-gradient(circle at 30% 50%, ${baseEmotion.glow}, transparent 60%)`,
            }}
          />
          
          {ghostTyping && (
            <div className="absolute left-[15%] top-[45%]">
              {ghostParticles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    background: `linear-gradient(135deg, ${baseEmotion.from}, ${baseEmotion.to})`,
                    boxShadow: `0 0 ${8 + ghostPulse * 6}px ${baseEmotion.glow}`,
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 0.6,
                    scale: 0.8,
                  }}
                  animate={{
                    x: p.x,
                    y: p.y,
                    opacity: 0,
                    scale: 0.3,
                  }}
                  transition={{
                    duration: 1.2,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}

          {ghostTyping && (
            <motion.div
              className="absolute left-[15%] top-[45%] rounded-full border-2"
              style={{
                width: 60,
                height: 60,
                borderColor: baseEmotion.glow,
                transform: "translate(-50%, -50%)",
              }}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </div>
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
            <div className="p-4 border-b border-white/5 backdrop-blur-xl relative z-10 bg-black/20">
              <h2 className="text-xl font-semibold text-white">Chats</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {combinedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/60">
                  <div className="w-20 h-20 mb-4 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm">No tienes chats aún</p>
                  <p className="text-xs mt-1">Añade amigos para empezar</p>
                </div>
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
                        <Avatar user={userData} size={48} />
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
            {/* HEADER */}
            <div className="p-4 border-b border-white/5 backdrop-blur-xl relative z-10 bg-black/20">
              <div className="flex items-center gap-4">
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
                <Avatar user={activeUser} size={48} />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-100">{activeUser.name}</h3>
                  <motion.span 
                    className="text-xs flex items-center gap-1.5"
                    animate={{
                      opacity: ghostTyping ? [0.7, 1, 0.7] : 1,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: ghostTyping ? Infinity : 0,
                    }}
                  >
                    <span className="text-emerald-400">●</span>
                    <span className="text-slate-400">{ghostTyping ? "escribiendo..." : "En línea"}</span>
                  </motion.span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative scrollbar-hide z-10" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <AnimatePresence>
                {localMessages.map((msg) => {
                  const isMe = msg.sender === user.id;
                  const msgEmotion =
                    msg.emotion && emotionColors[msg.emotion]
                      ? emotionColors[msg.emotion]
                      : baseEmotion;

                  return (
                    <motion.div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="relative max-w-xs"
                        style={{ minHeight: msg.animating ? 90 : "auto" }}
                        data-bubble-id={msg.id}
                      >
                        {/* EXPLOSIÓN DESDE EL CONTORNO */}
                        {msg.animating &&
                          msg.floating.map((p) => {
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

                        {/* BURBUJA CON GRADIENTE TRANSPARENTE Y PARTÍCULAS */}
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
                          className="relative z-10 p-4 rounded-3xl backdrop-blur-xl border overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, 
                              ${msgEmotion.from}18, 
                              ${msgEmotion.to}28)`,
                            borderColor: `${msgEmotion.from}50`,
                            boxShadow: `0 10px 36px ${msgEmotion.glow}, inset 0 1px 2px ${msgEmotion.from}30`,
                          }}
                        >
                          {/* PARTÍCULAS DE FONDO DE LA BURBUJA - Solo si está activa */}
                          {activeBubbles.has(msg.id) && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                              {msg.bubbleParticles && msg.bubbleParticles.map((p) => (
                                <motion.div
                                  key={p.id}
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

                          {/* TEXTO */}
                          <span className="relative z-10 text-slate-50 drop-shadow-sm">
                            {msg.text}
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* REFERENCIA PARA SCROLL */}
              <div ref={messagesEndRef} />

              {/* PARTÍCULAS DE ESCRITURA - Ahora en forma de burbuja */}
              {typingParticles.length > 0 && (
                <div className="flex justify-end pointer-events-none">
                  <div className="relative" style={{ width: 200, height: 80 }}>
                    {/* Contenedor con forma de burbuja */}
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

            {/* INPUT */}
            <div className="p-4 border-t border-white/5 backdrop-blur-xl flex gap-3 relative z-10 bg-black/20">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Escribí algo…"
                className="flex-1 bg-white/5 rounded-3xl px-5 py-3 outline-none placeholder:text-slate-500 text-slate-100 focus:bg-white/8 transition-colors"
              />
              <button
                onClick={handleSend}
                className="px-5 py-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20"
              >
                ➤
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}