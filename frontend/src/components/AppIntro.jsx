import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AppIntro() {
  const [showIntro, setShowIntro] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem("hasSeenIntro");
    if (!hasSeenIntro) {
      setShowIntro(true);
    }
  }, []);

  const handleVideoEnd = () => {
    localStorage.setItem("hasSeenIntro", "true");
    setTimeout(() => {
      setShowIntro(false);
    }, 300);
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenIntro", "true");
    videoRef.current?.pause();
    setShowIntro(false);
  };

  return (
    <AnimatePresence>
      {showIntro && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950"
        >
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={`${import.meta.env.BASE_URL}VideoIntro.mp4`}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              onEnded={handleVideoEnd}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSkip}
              className="absolute bottom-8 right-8 px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-semibold hover:bg-white/30 transition-colors"
            >
              Saltar
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
