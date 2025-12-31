import React, { useState, useEffect } from 'react';

// Iconos SVG
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 0-3.59 0l-6.173 2.656a2 2 0 0 0-1.4 3.27l1.638 6.639a2 2 0 0 0 .886 2.725l1.2 5.323a2 2 0 0 0 1.937-1.313l5.263-2.631a2 2 0 0 0 2.003.795l1.2-5.323a2 2 0 0 0 .886-2.725l1.638-6.639a2 2 0 0 0-1.4-3.27L12 3Z" />
  </svg>
);

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14" />
    <polygon points="13 2 3 14 12 14" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 16 12.26 13.74 16.5 17.5 14.5 11.5 14.5 7.5 13.74 10.5 12.26 8.91 15.09 12 2Z" />
  </svg>
);

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0-7.78-7.78l-1.06 1.06a5.5 5.5 0 0 0-7.78 0Z" />
  </svg>
);

const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s4.77-5.77 4.5-5c0 0 3.74-5.77 4.5-5s.5-3.74 2-5c-1.5-1.26-2-5-2-5s.5-3.74-2-5 2-5.77 4.5-5 4.5c0 0-3.74-5.77-4.5-5s-.5-3.74-2-5c0 0 .5-3.74 2-5s2-5.77 4.5-5 4.5c0 0 3.74 5.77 4.5 5Z" />
    <path d="M12 15a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z" />
    <path d="m12 7-8.5 2.75" />
    <path d="M5 22c-1.5-1.5-1.5-3 2-3 2.5 2.5 5.5-3 5.5-3l-5.5-5.5" />
  </svg>
);

export default function MidnightLaunch({ onComplete }) {
  const [countdown, setCountdown] = useState(10);
  const [phase, setPhase] = useState('countdown');
  const [particles, setParticles] = useState([]);
  const [pulseIntensity, setPulseIntensity] = useState(0);

  useEffect(() => {
    if (countdown > 0 && phase === 'countdown') {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        setPulseIntensity(11 - countdown);

        const newParticles = Array.from({ length: 20 }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          duration: Math.random() * 2 + 1
        }));
        setParticles(prev => [...prev, ...newParticles]);

        if (countdown <= 5) {
          document.body.style.transform = `scale(${1 + (6 - countdown) * 0.01})`;
          setTimeout(() => {
            document.body.style.transform = 'scale(1)';
          }, 100);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && phase === 'countdown') {
      setPhase('explosion');
      setTimeout(() => setPhase('welcome'), 3000);
      setTimeout(() => {
        setPhase('app');
        onComplete?.();
      }, 6000);

      const explosionParticles = Array.from({ length: 200 }, (_, i) => ({
        id: Date.now() + i,
        x: 50,
        y: 50,
        targetX: Math.random() * 100,
        targetY: Math.random() * 100,
        size: Math.random() * 8 + 3,
        duration: Math.random() * 3 + 2,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F'][Math.floor(Math.random() * 5)]
      }));
      setParticles(explosionParticles);
    }
  }, [countdown, phase, onComplete]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setParticles(prev => prev.filter(p => Date.now() - p.id < p.duration * 1000));
    }, 100);
    return () => clearInterval(cleanup);
  }, []);

  const getCountdownColor = () => {
    if (countdown > 7) return 'from-purple-600 to-blue-600';
    if (countdown > 4) return 'from-blue-600 to-cyan-500';
    if (countdown > 2) return 'from-cyan-500 to-yellow-400';
    return 'from-yellow-400 to-red-500';
  };

  const getGlowIntensity = () => {
    return `0 0 ${20 + pulseIntensity * 10}px rgba(255,255,255, ${0.3 + pulseIntensity * 0.05})`;
  };

  if (phase === 'countdown') {
    return (
      <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex items-center justify-center">
        <div
          className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-80"
          style={{
            animation: 'pulse 2s ease-in-out infinite',
            transform: `scale(${1 + pulseIntensity * 0.02})`
          }}
        />

        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}
        />

        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `fadeOut ${particle.duration}s ease-out forwards`,
              boxShadow: '0 0 10px rgba(255,255,255,0.8)'
            }}
          />
        ))}

        {countdown <= 5 && (
          <>
            <div
              className="absolute rounded-full border-4 border-white"
              style={{
                width: '200px',
                height: '200px',
                animation: 'expandRing 2s ease-out infinite',
                opacity: 0
              }}
            />
            <div
              className="absolute rounded-full border-4 border-cyan-400"
              style={{
                width: '200px',
                height: '200px',
                animation: 'expandRing 2s ease-out infinite 0.5s',
                opacity: 0
              }}
            />
          </>
        )}

        <div className="relative z-10 text-center">
          <div
            className={`text-[20rem] font-black bg-gradient-to-r ${getCountdownColor()} bg-clip-text text-transparent`}
            style={{
              textShadow: getGlowIntensity(),
              animation: countdown <= 3 ? 'shake 0.5s ease-in-out infinite' : 'none',
              transform: `scale(${1 + (11 - countdown) * 0.05})`
            }}
          >
            {countdown}
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-white text-3xl font-light tracking-[0.3em] opacity-80"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
            >
              PREPARANDO EL LANZAMIENTO
            </p>

            <div className="flex justify-center gap-6 mt-8">
              {[SparklesIcon, ZapIcon, StarIcon, HeartIcon, RocketIcon].map((IconComponent, i) => (
                <IconComponent
                  key={i}
                  className="w-8 h-8 text-white"
                  style={{
                    animation: `float 2s ease-in-out infinite ${i * 0.2}s`,
                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-2/3">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"
              style={{
                width: `${((10 - countdown) / 10) * 100}%`,
                transition: 'width 1s ease-out',
                boxShadow: '0 0 20px rgba(255,255,255,0.5)'
              }}
            />
          </div>
        </div>

        <style>{`
          @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-100px); }
          }
          @keyframes expandRing {
            from { transform: scale(1); opacity: 0.8; }
            to { transform: scale(4); opacity: 0; }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0) scale(${1 + (11 - countdown) * 0.05}); }
            25% { transform: translateX(-10px) scale(${1 + (11 - countdown) * 0.05}); }
            75% { transform: translateX(10px) scale(${1 + (11 - countdown) * 0.05}); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes gridMove {
            0% { transform: translateY(0); }
            100% { transform: translateY(50px); }
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'explosion') {
    return (
      <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex items-center justify-center">
        <div
          className="absolute inset-0 bg-white"
          style={{ animation: 'flashOut 0.5s ease-out forwards' }}
        />

        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color || '#FFD700',
              animation: `explodeParticle ${particle.duration}s ease-out forwards`,
              transform: `translate(${(particle.targetX - particle.x) * 5}px, ${(particle.targetY - particle.y) * 5}px)`,
              boxShadow: `0 0 ${particle.size * 3}px ${particle.color || '#FFD700'}`
            }}
          />
        ))}

        <div
          className="relative z-10 text-[15rem] font-black text-transparent"
          style={{
            WebkitTextStroke: '3px white',
            animation: 'boom 1s ease-out forwards',
            textShadow: '0 0 100px rgba(255,255,255,1)'
          }}
        >
          ¡BOOM!
        </div>

        <style>{`
          @keyframes flashOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes explodeParticle {
            0% { opacity: 1; transform: translate(0, 0) scale(1); }
            100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
          }
          @keyframes boom {
            0% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { transform: scale(1.5) rotate(10deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'welcome') {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-purple-900 via-indigo-900 to-black overflow-hidden flex items-center justify-center">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-4 rounded-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-5%',
              background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F'][i % 5],
              animation: `confettiFall ${2 + Math.random() * 2}s linear forwards ${Math.random() * 2}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          />
        ))}

        <div className="relative z-10 text-center space-y-8"
          style={{ animation: 'slideUp 1s ease-out forwards' }}>

          <div className="text-8xl font-black text-white mb-4"
            style={{
              textShadow: '0 0 40px rgba(255,255,255,0.8)',
              animation: 'glow 2s ease-in-out infinite'
            }}
          >
            ¡BIENVENIDO!
          </div>

          <div className="text-3xl text-cyan-300 font-light tracking-wider">
            Eres un <span className="font-bold text-yellow-400">FOUNDING MEMBER</span>
          </div>

          <div className="flex justify-center items-center gap-4 mt-8">
            <StarIcon className="w-12 h-12 text-yellow-400" style={{ animation: 'spin 3s linear infinite' }} />
            <span className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              #001
            </span>
            <StarIcon className="w-12 h-12 text-yellow-400" style={{ animation: 'spin 3s linear infinite reverse' }} />
          </div>

          <div className="text-xl text-gray-300 mt-8 max-w-2xl mx-auto px-4">
            Estás entre los primeros en experimentar algo completamente nuevo.
            <br />
            Tu voz ayudará a dar forma al futuro.
          </div>
        </div>

        <style>{`
          @keyframes confettiFall {
            to { transform: translateY(120vh) rotate(720deg); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(100px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes glow {
            0%, 100% { text-shadow: 0 0 40px rgba(255,255,255,0.8); }
            50% { text-shadow: 0 0 80px rgba(255,255,255,1), 0 0 120px rgba(139,92,246,0.8); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
