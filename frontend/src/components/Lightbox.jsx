import { AnimatePresence, motion } from "framer-motion";
import { useLightbox } from "../context/LightboxContext";

export default function Lightbox() {
  const { image, close } = useLightbox();

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.img
            src={image.src}
            alt={image.alt || "media"}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
