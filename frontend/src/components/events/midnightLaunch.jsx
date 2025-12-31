import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Iconos SVG inline para evitar problemas de build
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 0-3.59 0l-6.173 2.656a2 2 0 0 0 .886-2.725l1.638 6.639a2 2 0 0 0 .886 2.725l1.2 5.323a2 2 0 0 0 .886-2.725l1.2-5.323a2 2 0 0 0 .886 2.725l1.638-6.639a2 2 0 0 0-3.59 0L12 3Z" />
  </svg>
);

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 14" />
    <polygon points="13 2 3 14 12 14 14" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 16 17.5 12 15.09 6.91 16 5.5 8.91 12 2" />
  </svg>
);

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l-1.06 1.06a5.5 5.5 0 0 0-7.78-7.78l1.06-1.06a5.5 5.5 0 0 0 7.78-7.78l-1.06 1.06a5.5 5.5 0 0 0 7.78 7.78l1.06-1.06a5.5 5.5 0 0 0 7.78-7.78l-1.06 1.06a5.5 5.5 0 0 0-7.78 7.78l-1.06 1.06a5.5 5.5 0 0 0 .5-3.74 2.5-2.5s.5-3.74 2.5-2.5.77 4.5-5.5 5.5-5.5 2.5s.5-3.74 2.5-2.5.77-4.5-5.5 5.5-5.5Z" />
  </svg>
);

const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2.5-2.5-5.5s4.77-5.5-5.5c0 0 3.74-5.77 4.5-5.5c0 0 .5-3.74 2.5-2.5s-.5-3.74-2.5-2.5c0 0 .5-3.74 2.5-2.5s-.5-3.74-2.5-2.5-7.78 4.5-5.5 5.5-5.5c0 0 3.74-5.77 4.5-5.5 0 0 .5-3.74 2.5-2.5s-.5-3.74 2.5-2.5Z" />
    <path d="M12 7-8.5 2.75" />
    <path d="M5 22c-1.5-1.5-1.5-3.2.5-2.5s.5-3.5 5.5-5.5.5-3.5 5.5-5.5" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-2 1-2-1v10" />
  </svg>
);

const CrownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 0-3.59 0l-6.173 2.656a2 2 0 0 0 .886-2.725l1.638 6.639a2 2 0 0 0 .886 2.725l1.2 5.323a2 2 0 0 0 .886-2.725l1.2-5.323a2 2 0 0 0 .886 2.725l1.638-6.639a2 2 0 0 0-3.59 0L12 3Z" />
  </svg>
);

export default function MidnightLaunch({ onComplete }) {
  const [countdown, setCountdown] = useState(10);
  const [phase, setPhase] = useState('countdown');

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'countdown' && countdown === 0) {
      setPhase('explosion');
      setTimeout(() => setPhase('welcome'), 2500);
      setTimeout(() => {
        setPhase('app');
        onComplete?.();
      }, 6000);
    }
  }, [countdown, phase, onComplete]);

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
            <div className="absolute inset-0 opacity-20">
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
                    filter: `drop-shadow(0 0 ${countdown <= 3 ? '40px' : '0px'} rgba(168, 85, 247, 0.4))`
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
                  Sincronizando Motores de Año Nuevo
                </p>

                <div className="flex gap-3">
                  {[SparklesIcon, ZapIcon, StarIcon, HeartIcon, RocketIcon].map((Icon, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w-8 h-8 rounded-full bg-purple-500"
                    >
                      <Icon />
                    </motion.div>
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
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-white"
            />
          </motion.div>
        )}

        {/* --- FASE 3: BIENVENIDA FOUNDING MEMBER --- */}
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
                <CrownIcon className="w-20 h-20 text-yellow-500" />
              </motion.div>
              
              <h2 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight">
                Acceso Concedido
              </h2>
              
              <div className="flex items-center justify-center gap-3 mb-8">
                <ShieldCheckIcon className="text-cyan-400 w-6 h-6" />
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
}
