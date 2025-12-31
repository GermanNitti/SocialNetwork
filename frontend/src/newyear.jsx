import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Rocket, ShieldCheck, Crown } from 'lucide-react';

const MidnightLaunch = () => {
  const [countdown, setCountdown] = useState(10);
  const [phase, setPhase] = useState('countdown'); // countdown, explosion, welcome, app

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && phase === 'countdown') {
      setPhase('explosion');
      setTimeout(() => setPhase('welcome'), 2500);
    }
  }, [countdown, phase]);

  // Variantes de animación para suavidad profesional
  const containerVariants = {
    exit: { opacity: 0, scale: 1.1, filter: "blur(10px)", transition: { duration: 0.8 } }
  };

  const numberVariants = {
    initial: { scale: 0.5, opacity: 0, filter: "blur(10px)" },
    animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
    exit: { scale: 2, opacity: 0, filter: "blur(20px)" }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans selection:bg-purple-500">
      <AnimatePresence mode="wait">
        
        {/* --- FASE 1: COUNTDOWN --- */}
        {phase === 'countdown' && (
          <motion.div
            key="countdown-screen"
            variants={containerVariants}
            exit="exit"
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]"
          >
            {/* Fondo dinámico sutil */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
              <div className="absolute h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
            </div>

            <motion.div className="relative z-10 flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={countdown}
                  variants={numberVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="text-[18rem] md:text-[25rem] font-black tracking-tighter leading-none"
                  style={{
                    background: 'linear-gradient(to bottom, #fff 30%, #555 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: `drop-shadow(0 0 ${countdown <= 3 ? '40px' : '0px'} rgba(168,85,247,0.4))`
                  }}
                >
                  {countdown}
                </motion.h1>
              </AnimatePresence>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 -mt-10"
              >
                <p className="text-white/40 tracking-[0.5em] text-sm font-light uppercase">
                  Sincronizando Motores de Nexo
                </p>
                <div className="flex gap-3">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-purple-500"
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* --- FASE 2: EXPLOSIÓN CINEMÁTICA --- */}
        {phase === 'explosion' && (
          <motion.div
            key="explosion-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 50], opacity: [1, 0] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="w-10 h-10 bg-black rounded-full"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-white"
            />
          </motion.div>
        )}

        {/* --- FASE 3: BIENVENIDA FOUNDER --- */}
        {phase === 'welcome' && (
          <motion.div
            key="welcome-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white p-6"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />
            
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              className="relative z-10 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="mb-8 inline-block"
              >
                <Crown className="w-20 h-20 text-yellow-500 filter drop-shadow(0 0 20px rgba(234,179,8,0.5))" />
              </motion.div>
              
              <h2 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
                Acceso Concedido
              </h2>
              <div className="flex items-center justify-center gap-3 mb-8">
                <ShieldCheck className="text-cyan-400 w-6 h-6" />
                <span className="text-cyan-400 tracking-widest font-mono text-xl">STATUS: FOUNDING MEMBER #001</span>
              </div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="max-w-md text-white/60 text-lg font-light leading-relaxed mx-auto"
              >
                Has desbloqueado el origen de la red. Tu identidad ha sido grabada en el bloque génesis.
              </motion.p>
            </motion.div>

            {/* Partículas de luz de fondo */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: window.innerHeight + 10,
                  opacity: 0 
                }}
                animate={{ 
                  y: -100, 
                  opacity: [0, 0.5, 0] 
                }}
                transition={{ 
                  duration: Math.random() * 5 + 5, 
                  repeat: Infinity, 
                  delay: Math.random() * 5 
                }}
                className="absolute w-[1px] h-20 bg-gradient-to-t from-transparent via-white/20 to-transparent"
              />
            ))}
          </motion.div>
        )}

      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          background: black;
        }
      `}</style>
    </div>
  );
};

export default MidnightLaunch;