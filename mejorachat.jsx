import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

const mockUser = { id: 1, username: "tu_usuario" };
const mockActiveUser = { id: 2, username: "amigo", name: "Amigo" };

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

export default function ChatDemo() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
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

  const uid = () => `${Date.now()}-${Math.random()}`;

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
  }, [messages]);

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
      const messageIds = messages.map(m => m.id);
      const sortedVisible = visibleArray.sort((a, b) => {
        return messageIds.indexOf(b) - messageIds.indexOf(a);
      });
      setActiveBubbles(new Set(sortedVisible.slice(0, 7)));
    }
  }, [visibleBubbles, messages]);

  /* =========================
     ESCRITURA FANTASMA DEL OTRO USUARIO
     ========================= */
  useEffect(() => {
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
  }, []);

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
  }, [messages]);

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

  const send = () => {
    if (!text.trim()) return;

    const id = uid();
    const floating = typingParticles;
    const msgEmotion = activeEmotion ? activeEmotion.emotion : null;
    
    // Generar partículas estáticas para esta burbuja (solo 15 partículas)
    const bubbleParticles = generateBubbleParticles(15);

    setMessages((m) => [
      ...m,
      {
        id,
        text,
        sender: mockUser.id,
        animating: true,
        floating,
        emotion: msgEmotion,
        bubbleParticles, // Partículas estáticas de la burbuja
      },
    ]);

    setText("");
    setTypingParticles([]);

    // Limpiar la explosión después de la animación
    setTimeout(() => {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === id ? { ...msg, animating: false, floating: [] } : msg
        )
      );
    }, 1100);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-zinc-900 to-neutral-950 text-white relative overflow-hidden">
      {/* CAPA DE FONDO CON ESCRITURA FANTASMA */}
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


      </div>

      {/* HEADER */}
      <div className="p-4 border-b border-white/5 backdrop-blur-xl relative z-10 bg-black/20">
        <h3 className="font-semibold text-slate-100">{mockActiveUser.name}</h3>
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

      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative scrollbar-hide z-10" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <AnimatePresence>
          {messages.map((msg) => {
            const msgEmotion =
              msg.emotion && emotionColors[msg.emotion]
                ? emotionColors[msg.emotion]
                : baseEmotion;

            return (
              <motion.div key={msg.id} className="flex justify-end">
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
                        {msg.bubbleParticles.map((p) => (
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
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribí algo…"
          className="flex-1 bg-white/5 rounded-3xl px-5 py-3 outline-none placeholder:text-slate-500 text-slate-100 focus:bg-white/8 transition-colors"
        />
        <button
          onClick={send}
          className="px-5 py-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20"
        >
          ➤
        </button>
      </div>
    </div>
  );
}