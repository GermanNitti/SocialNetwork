import React, { useEffect, useState, useRef } from "react";

const IntroLogo = ({ onFinish, title = "MACANUDOS", subtitle = "SOCIAL EXPERIENCE", visible = true }) => {
  if (!visible) return null;

  const [fadeOut, setFadeOut] = useState(false);
  const [typedText, setTypedText] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    const fullText = subtitle || "";
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 80); // Velocidad de escritura

    return () => clearInterval(typingInterval);
  }, [subtitle]);

  useEffect(() => {
    // reproduce sfx una vez al iniciar
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => onFinish && onFinish(), 100);
    }, 5500); // Duración visible del logo

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center 
      bg-black
      transition-opacity duration-700 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      <style>{`
        /* Pulso suave del glow */
        @keyframes outerGlow {
          0% { box-shadow: 0 0 25px rgba(139,92,246,0.4), 0 0 45px rgba(56,189,248,0.3); }
          50% { box-shadow: 0 0 55px rgba(139,92,246,0.75), 0 0 85px rgba(56,189,248,0.5); }
          100% { box-shadow: 0 0 25px rgba(139,92,246,0.4), 0 0 45px rgba(56,189,248,0.3); }
        }
        /* Círculo interior vivo */
        @keyframes swirlEnergy {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        /* Texto reveal */
        @keyframes brandReveal {
          0% { opacity: 0; letter-spacing: -8px; transform: translateY(12px); }
          100% { opacity: 1; letter-spacing: 4px; transform: translateY(0); }
        }
        /* Cursor parpadeante */
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}sfx-office-keyboard3.mp3`}
        preload="auto"
      />

      <div className="flex flex-col items-center gap-6 select-none">
        
        {/* Contenedor del logo */}
        <div
          className="relative h-40 w-40 rounded-full bg-black/40 backdrop-blur-xl 
          flex items-center justify-center"
          style={{
            animation: "outerGlow 3s ease-in-out infinite",
          }}
        >
          {/* Capa giratoria */}
          <div
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background:
                "conic-gradient(from 0deg, #8b5cf6, #3b82f6, #06b6d4, #8b5cf6)",
              animation: "swirlEnergy 4s linear infinite",
            }}
          />

        {/* Círculo interior */}
        <div className="relative z-10 h-28 w-28 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center">
          <span className="text-white text-5xl font-bold tracking-wide">
            M
          </span>
          </div>
        </div>

        {/* TEXTO MACANUDOS */}
        <h1
          className="text-3xl font-extrabold text-transparent bg-clip-text 
          bg-gradient-to-r from-purple-400 to-blue-300"
          style={{
            animation: "brandReveal 0.9s ease forwards",
          }}
        >
          {title}
        </h1>

        {/* Subtítulo con efecto terminal */}
        <p className="text-sm text-gray-400 tracking-widest font-mono">
          {typedText}
          <span 
            className="inline-block w-2 h-4 bg-gray-400 ml-1"
            style={{ animation: "blink 1s step-end infinite" }}
          />
        </p>
      </div>
    </div>
  );
};

export default IntroLogo;
