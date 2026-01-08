import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FounderWelcome = () => {
  const [founderNumber] = useState(Math.floor(Math.random() * 100) + 1);
  const [currentNumber, setCurrentNumber] = useState(0);
  const [step, setStep] = useState(0);
  const [particles, setParticles] = useState([]);
  const [stars, setStars] = useState([]);
  const [explosionParticles, setExplosionParticles] = useState([]);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const newParticles = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 0.5,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3,
      opacity: Math.random() * 0.4 + 0.1
    }));
    setParticles(newParticles);

    const newStars = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * 2 + 1
    }));
    setStars(newStars);
  }, []);

  useEffect(() => {
    if (step === 1 && currentNumber < founderNumber) {
      const timeout = setTimeout(() => {
        setCurrentNumber(prev => prev + 1);
      }, 35);
      return () => clearTimeout(timeout);
    } else if (step === 1 && currentNumber === founderNumber && !showExplosion) {
      setShowExplosion(true);
      const newExplosionParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        angle: (i / 40) * 360,
        distance: Math.random() * 150 + 100,
        size: Math.random() * 8 + 4,
        color: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 4)]
      }));
      setExplosionParticles(newExplosionParticles);
      
      setTimeout(() => {
        setShowButton(true);
      }, 1500);
    }
  }, [currentNumber, founderNumber, step, showExplosion]);

  useEffect(() => {
    if (step === 0) {
      setTimeout(() => setShowButton(true), 2000);
    }
  }, [step]);

  const handleContinue = () => {
    setShowButton(false);
    setStep(step + 1);
    if (step === 1) {
      setTimeout(() => setShowButton(true), 1500);
    } else if (step === 2) {
      setTimeout(() => setShowButton(true), 1000);
    } else if (step === 3) {
      setTimeout(() => setShowButton(true), 1000);
    }
  };

  const letterVariants = {
    initial: { y: 0, rotate: 0 },
    animate: (i) => ({
      y: [0, -8, 0, 6, 0],
      rotate: [0, -2, 2, -1, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        delay: i * 0.1,
        ease: "easeInOut"
      }
    })
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center p-4">
      <motion.div 
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, #1a0b2e 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, #0f172a 0%, transparent 50%)',
            'radial-gradient(circle at 0% 100%, #1a0b2e 0%, transparent 50%)',
            'radial-gradient(circle at 100% 0%, #0f172a 0%, transparent 50%)',
            'radial-gradient(circle at 0% 0%, #1a0b2e 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {stars.map(star => (
        <motion.div
          key={`star-${star.id}`}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 0.3, star.opacity],
            scale: [1, 0.8, 1]
          }}
          transition={{
            duration: star.twinkle,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      {particles.map(particle => (
        <motion.div
          key={`particle-${particle.id}`}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(59, 130, 246, 0.8))',
            filter: 'blur(1px)'
          }}
          animate={{
            y: [0, -60, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [particle.opacity, particle.opacity * 0.3, particle.opacity],
            scale: [1, 1.4, 1]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `
          linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }} />

      <div className="relative z-10 max-w-md w-full">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -100, scale: 0.8 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.19, 1, 0.22, 1]
              }}
              className="text-center"
            >
              <motion.div className="relative inline-block">
                <motion.div
                  className="absolute inset-0 blur-3xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
                  }}
                />
                
                <h1 className="relative text-6xl font-black mb-3 tracking-tight flex justify-center flex-wrap">
                  {['B', 'I', 'E', 'N', 'V', 'E', 'N', 'I', 'D', 'O'].map((letter, i) => (
                    <motion.span
                      key={i}
                      custom={i}
                      variants={letterVariants}
                      initial="initial"
                      animate="animate"
                      className="inline-block bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 text-transparent bg-clip-text drop-shadow-2xl"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </h1>
                
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                  className="h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full"
                />
              </motion.div>

              <AnimatePresence>
                {showButton && (
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleContinue}
                    className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl border border-purple-400/30 flex items-center gap-3 mx-auto"
                  >
                    <span>Continuar</span>
                    <motion.svg
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
              className="text-center flex flex-col items-center justify-center"
            >
              <motion.p 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                className="text-zinc-400 text-sm uppercase tracking-widest mb-8 font-semibold"
              >
                Calculando tu posición...
              </motion.p>

              <div className="relative inline-flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-3xl blur-3xl"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)'
                  }}
                />
                
                <motion.div
                  className="relative bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 rounded-3xl border-2 border-cyan-400/30 shadow-2xl overflow-hidden"
                  style={{ 
                    width: '240px', 
                    height: '160px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 40px rgba(6, 182, 212, 0.5)',
                      '0 0 80px rgba(6, 182, 212, 1)',
                      '0 0 40px rgba(6, 182, 212, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <motion.div
                      key={currentNumber}
                      initial={{ y: 60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ 
                        duration: 0.15,
                        ease: [0.19, 1, 0.22, 1]
                      }}
                      className="text-8xl font-black text-white drop-shadow-2xl tabular-nums"
                      style={{ lineHeight: 1 }}
                    >
                      {String(currentNumber).padStart(2, '0')}
                    </motion.div>
                  </div>
                </motion.div>

                {showExplosion && explosionParticles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: particle.size,
                      height: particle.size,
                      backgroundColor: particle.color,
                      boxShadow: `0 0 20px ${particle.color}`
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                      x: Math.cos(particle.angle * Math.PI / 180) * particle.distance,
                      y: Math.sin(particle.angle * Math.PI / 180) * particle.distance,
                      opacity: 0,
                      scale: [0, 1.5, 0]
                    }}
                    transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
                  />
                ))}
              </div>

              <AnimatePresence>
                {showButton && (
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleContinue}
                    className="mt-12 bg-gradient-to-r from-cyan-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl border border-cyan-400/30 flex items-center gap-3 mx-auto"
                  >
                    <span>Ver resultado</span>
                    <motion.svg
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
              >
                <h1 className="text-4xl sm:text-5xl font-black mb-4 flex flex-wrap justify-center gap-1">
                  {['¡', 'F', 'E', 'L', 'I', 'C', 'I', 'T', 'A', 'C', 'I', 'O', 'N', 'E', 'S', '!'].map((letter, i) => (
                    <motion.span
                      key={i}
                      custom={i}
                      initial={{ opacity: 0, y: 30, rotateX: -45 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ 
                        delay: i * 0.03,
                        duration: 0.4,
                        ease: [0.19, 1, 0.22, 1]
                      }}
                      className="inline-block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 text-transparent bg-clip-text drop-shadow-2xl"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                className="text-zinc-300 text-lg sm:text-xl mb-6"
              >
                Sos el fundador número
              </motion.p>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                className="relative inline-block mb-8"
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl blur-3xl"
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)'
                  }}
                />
                
                <div className="relative bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 rounded-2xl px-10 py-6 border-2 border-cyan-400/50">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="text-6xl sm:text-7xl font-black text-white drop-shadow-2xl flex items-baseline gap-2 tabular-nums">
                      {String(founderNumber).padStart(2, '0')}
                      <span className="text-3xl text-white/80">/100</span>
                    </span>
                  </motion.div>
                </div>

                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-3xl sm:text-4xl pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos(i * 18 * Math.PI / 180) * 120,
                      y: Math.sin(i * 18 * Math.PI / 180) * 120,
                      opacity: 0,
                      rotate: Math.random() * 360
                    }}
                    transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                  >
                    {['🎉', '✨', '⭐', '💫'][i % 4]}
                  </motion.div>
                ))}
              </motion.div>

              <AnimatePresence>
                {showButton && (
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleContinue}
                    className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl border border-cyan-400/30 flex items-center gap-3 mx-auto"
                  >
                    <span>Ver beneficios</span>
                    <motion.svg
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              className="relative bg-gradient-to-br from-zinc-900/60 via-zinc-800/60 to-zinc-900/60 backdrop-blur-2xl rounded-3xl p-6 mb-8 border border-zinc-700/30 overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 rounded-3xl"
                animate={{
                  background: [
                    'linear-gradient(0deg, transparent, rgba(139, 92, 246, 0.2), transparent)',
                    'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.2), transparent)',
                    'linear-gradient(180deg, transparent, rgba(139, 92, 246, 0.2), transparent)',
                    'linear-gradient(270deg, transparent, rgba(139, 92, 246, 0.2), transparent)',
                    'linear-gradient(360deg, transparent, rgba(139, 92, 246, 0.2), transparent)',
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              <div className="relative">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                  className="text-zinc-300 text-base sm:text-lg mb-6 leading-relaxed font-light"
                >
                  Como fundador, queremos darte algo especial:
                </motion.p>

                <motion.h2
                  className="text-2xl sm:text-3xl font-black mb-8 flex flex-wrap gap-1"
                >
                  {['B', 'E', 'N', 'E', 'F', 'I', 'C', 'I', 'O', 'S'].map((letter, i) => (
                    <motion.span
                      key={i}
                      custom={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      variants={letterVariants}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                      className="inline-block bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </motion.h2>
                
                {[
                  { 
                    icon: (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ), 
                    text: "Marco especial permanente en tu foto de perfil",
                    color: "from-cyan-500 to-blue-500"
                  },
                  { 
                    icon: (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                      </svg>
                    ), 
                    text: "Acceso prioritario a todas las funciones beta",
                    color: "from-purple-500 to-indigo-500"
                  },
                  { 
                    icon: (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                      </svg>
                    ), 
                    text: "Beneficios vitalicios en toda nuestra plataforma",
                    color: "from-blue-500 to-cyan-500"
                  },
                  { 
                    icon: (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                    ), 
                    text: "Ventajas exclusivas en todos nuestros proyectos futuros",
                    color: "from-violet-500 to-purple-500"
                  }
                ].map((benefit, i) => {
                  const baseDelay = 1.2;
                  const itemDelay = baseDelay + (i * 1.2); // Cada item espera 1.2s después del anterior
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ 
                        delay: baseDelay + (i * 0.1),
                        duration: 0.4,
                        ease: [0.19, 1, 0.22, 1]
                      }}
                      className="relative flex items-center gap-4 mb-4 p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/20 overflow-hidden"
                    >
                      {/* Icono con rotación secuencial */}
                      <motion.div 
                        className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center text-white shadow-lg`}
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ 
                          delay: itemDelay,
                          duration: 0.8,
                          ease: [0.19, 1, 0.22, 1]
                        }}
                      >
                        {benefit.icon}
                      </motion.div>

                      {/* Texto que aparece después de la rotación del icono */}
                      <motion.p 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: itemDelay + 0.5, // Aparece 0.5s después de que empiece a girar el icono
                          duration: 0.6,
                          ease: [0.19, 1, 0.22, 1]
                        }}
                        className="text-zinc-300 text-sm font-medium leading-relaxed"
                      >
                        {benefit.text}
                      </motion.p>
                    </motion.div>
                  );
                })}
              </div>

              <AnimatePresence>
                {showButton && (
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleContinue}
                    className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl border border-purple-400/30 flex items-center gap-3 mx-auto"
                  >
                    <span>Finalizar</span>
                    <motion.svg
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 1.2,
                ease: [0.19, 1, 0.22, 1],
                type: "spring"
              }}
              className="text-center relative"
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-purple-500/20"
                  initial={{ width: 0, height: 0, opacity: 0 }}
                  animate={{ 
                    width: 200 + i * 50, 
                    height: 200 + i * 50,
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4
                  }}
                />
              ))}

              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="relative inline-block"
              >
                <motion.div
                  className="absolute inset-0 blur-3xl opacity-60"
                  animate={{
                    background: [
                      'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, transparent 70%)',
                      'radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, transparent 70%)',
                      'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%)',
                      'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, transparent 70%)'
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                
                <h2 className="relative text-4xl sm:text-5xl font-black mb-6 flex flex-wrap justify-center gap-1 sm:gap-2">
                  {['¡', 'M', 'U', 'C', 'H', 'A', 'S', '\u00A0', 'G', 'R', 'A', 'C', 'I', 'A', 'S', '!'].map((letter, i) => (
                    <motion.span
                      key={i}
                      custom={i}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      variants={letterVariants}
                      transition={{ delay: i * 0.05 }}
                      className="inline-block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 text-transparent bg-clip-text"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </h2>
              </motion.div>
              
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.5, 
                  type: "spring",
                  stiffness: 200,
                  damping: 10
                }}
                className="relative inline-block"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    y: [0, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl sm:text-7xl filter drop-shadow-2xl"
                >
                  🎉
                </motion.div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-zinc-400 text-sm font-light"
              >
                Bienvenido a la élite
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)'
      }} />
    </div>
  );
};

export default FounderWelcome;