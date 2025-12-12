import React, { useEffect, useRef, useLayoutEffect } from "react";

export default function LoginBackground({ children }) {
  const canvasRef = useRef(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

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
        const dx = (mouse.x ?? this.x) - this.x;
        const dy = (mouse.y ?? this.y) - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 2;
          this.y -= Math.sin(angle) * force * 2;
        }
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
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

    for (let i = 0; i < particleCount; i += 1) particles.push(new Particle());

    const connectParticles = () => {
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
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
    };

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      connectParticles();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
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
          50% {
            box-shadow:
              0 0 10px rgba(59, 130, 246, 0.6),
              0 0 20px rgba(59, 130, 246, 0.4),
              0 0 30px rgba(59, 130, 246, 0.3),
              inset 0 0 15px rgba(59, 130, 246, 0.2);
            filter: hue-rotate(180deg);
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
      `}</style>

      <canvas ref={canvasRef} className="absolute inset-0" style={{ width: "100vw", height: "100vh" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="neon-logo hidden" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
