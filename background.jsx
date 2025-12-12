import React, { useEffect, useRef } from 'react';

const LoginBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 100;
    const connectionDistance = 150;
    const mouse = { x: null, y: null, radius: 120 };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.3;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 2;
          this.y -= Math.sin(angle) * force * 2;
        }

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Keep within bounds
        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height, this.y));
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${this.opacity})`;
        ctx.fill();
      }
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Connect particles
    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.3;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      connectParticles();
      requestAnimationFrame(animate);
    }

    animate();

    // Mouse move event
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <style>{`
        @keyframes neonSpin {
          0% {
            box-shadow: 
              0 0 5px rgba(139, 92, 246, 0.5),
              0 0 10px rgba(139, 92, 246, 0.5),
              0 0 20px rgba(139, 92, 246, 0.3),
              inset 0 0 10px rgba(139, 92, 246, 0.2);
            filter: hue-rotate(0deg);
          }
          25% {
            box-shadow: 
              0 0 10px rgba(59, 130, 246, 0.6),
              0 0 20px rgba(59, 130, 246, 0.4),
              0 0 30px rgba(59, 130, 246, 0.3),
              inset 0 0 15px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 
              0 0 5px rgba(236, 72, 153, 0.5),
              0 0 10px rgba(236, 72, 153, 0.5),
              0 0 20px rgba(236, 72, 153, 0.3),
              inset 0 0 10px rgba(236, 72, 153, 0.2);
            filter: hue-rotate(180deg);
          }
          75% {
            box-shadow: 
              0 0 10px rgba(6, 182, 212, 0.6),
              0 0 20px rgba(6, 182, 212, 0.4),
              0 0 30px rgba(6, 182, 212, 0.3),
              inset 0 0 15px rgba(6, 182, 212, 0.2);
          }
          100% {
            box-shadow: 
              0 0 5px rgba(139, 92, 246, 0.5),
              0 0 10px rgba(139, 92, 246, 0.5),
              0 0 20px rgba(139, 92, 246, 0.3),
              inset 0 0 10px rgba(139, 92, 246, 0.2);
            filter: hue-rotate(360deg);
          }
        }
        
        .neon-logo {
          animation: neonSpin 4s ease-in-out infinite;
        }
      `}</style>
      {/* Canvas for particles */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0"
      />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
      
      {/* Content overlay - demo login card */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-purple-500/20 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-4 shadow-lg">
              <span className="text-white text-2xl font-bold">M</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Macanudos</h1>
            <p className="text-gray-300 text-sm">Conectá con tu comunidad</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Usuario o email"
                className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition"
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Contraseña"
                className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition"
              />
            </div>
            <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02]">
              Iniciar sesión
            </button>
            
            <div className="text-center">
              <a href="#" className="text-sm text-gray-300 hover:text-purple-400 transition">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-500/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-400">o</span>
              </div>
            </div>
            
            <button className="w-full py-3 bg-white/5 border border-purple-500/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
              Crear cuenta nueva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginBackground;