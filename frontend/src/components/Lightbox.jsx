import { AnimatePresence, motion } from "framer-motion";
import { useLightbox } from "../context/LightboxContext";
import { useEffect, useMemo, useRef } from "react";

function parseTimeRange(src = "") {
  const match = src.match(/#t=([\d.]+),?([\d.]*)/);
  if (!match) return { cleanSrc: src, start: 0, end: null };
  const start = parseFloat(match[1]) || 0;
  const end = match[2] ? parseFloat(match[2]) : null;
  const cleanSrc = src.split("#")[0];
  return { cleanSrc, start, end };
}

export default function Lightbox() {
  const { media, close } = useLightbox();
  const videoRef = useRef(null);

  const parsed = useMemo(() => parseTimeRange(media?.src), [media]);

  useEffect(() => {
    if (!media?.isVideo || !videoRef.current) return;
    const video = videoRef.current;
    const start = parsed.start || 0;
    const end = parsed.end;
    const handleLoaded = () => {
      video.currentTime = start;
    };
    const handleTimeUpdate = () => {
      if (end && video.currentTime >= end - 0.05) {
        video.currentTime = start;
        video.play();
      }
    };
    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [media, parsed.start, parsed.end]);

  return (
    <AnimatePresence>
      {media && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl overflow-hidden bg-black/40 p-1"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {media.isVideo ? (
              <video
                ref={videoRef}
                src={parsed.cleanSrc}
                autoPlay
                loop
                muted
                playsInline
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
              />
            ) : (
              <img
                src={media.src}
                alt={media.alt || "media"}
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
