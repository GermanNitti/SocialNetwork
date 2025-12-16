import React from 'react';
import { motion } from 'framer-motion';

// Simple burst animation: scales and fades an icon, then calls onComplete
export default function Burst({ icon = '❤', color = '#ef4444', onComplete = () => {} }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1.6, opacity: 1, y: -20 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={onComplete}
      className="pointer-events-none absolute inset-0 flex items-center justify-center z-40"
    >
      <motion.div
        initial={{ rotate: -10 }}
        animate={{ rotate: 0 }}
        className="text-6xl drop-shadow-lg"
        style={{ color }}
        aria-hidden
      >
        {icon}
      </motion.div>
    </motion.div>
  );
}
