import { API_BASE_URL } from "../api/client";
import { useLightbox } from "../context/LightboxContext";
import { motion } from "framer-motion";

export default function Avatar({ user, size = 48, className = "", emotionColor = null }) {
  const mediaBase = API_BASE_URL.replace(/\/api$/, "");
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    return `${mediaBase}/${imagePath}`;
  };
  const imgSrc = user?.avatar ? getImageUrl(user.avatar) : null;
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const { open } = useLightbox();

  const finalEmotionColor = user?.emotionMode === "hidden"
    ? null
    : (emotionColor || user?.currentEmotionColor || null);

  const ringColors = finalEmotionColor
    ? {
        c1: finalEmotionColor,
        c2: finalEmotionColor,
      }
    : {
        c1: "rgb(186, 66, 255)",
        c2: "rgb(0, 225, 255)",
      };

  const ringSize = size + 10;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: ringSize, height: ringSize }}>
      {/* Spinner exterior */}
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          backgroundImage: `linear-gradient(${ringColors.c1} 35%, ${ringColors.c2})`,
          filter: "blur(0.5px)",
          boxShadow: `0px -4px 14px 0px ${ringColors.c1}, 0px 4px 14px 0px ${ringColors.c2}`,
          animationDuration: "2.8s",
        }}
      />
      {/* Halo interior */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: "rgb(36,36,36)",
          filter: "blur(8px)",
          transform: "scale(0.88)",
        }}
      />
      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`relative rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-700 font-semibold ${
          imgSrc ? "cursor-pointer" : ""
        }`}
        style={{ width: size, height: size }}
        onClick={() => {
          if (imgSrc) open(imgSrc, user?.name || "avatar", { isVideo: false });
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={user?.name || "avatar"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{initials}</span>
        )}
      </motion.div>
    </div>
  );
}
