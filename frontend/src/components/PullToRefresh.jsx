import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

export default function PullToRefresh({ onRefresh, children, className = "" }) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPullingRef.current || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, 120));
      setPulling(distance > 80);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pulling) {
      onRefresh();
    }
    isPullingRef.current = false;
    setPullDistance(0);
    setPulling(false);
  }, [pulling, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className={className}>
      {pullDistance > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex justify-center py-4"
          style={{ transform: `translateY(${Math.max(0, pullDistance - 80)}px)` }}
        >
          <div className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-2">
            {pulling ? "⬇️ Soltar para actualizar" : "⬆️ Arrastra para actualizar"}
          </div>
        </motion.div>
      )}
      <motion.div
        animate={{ opacity: pulling ? 0.5 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
