import React, { useRef, useEffect, useState } from "react";

export default function MacanudosAnimatedLogo({ className = "", size = 128, showText = true }) {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(err => {
        console.log("Autoplay prevented:", err);
      });
    }
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <video
        ref={videoRef}
        src={`${import.meta.env.BASE_URL}macanudoswebm.webm`}
        alt="Macanudos"
        style={{ height: size, width: "auto" }}
        className="object-contain drop-shadow-lg"
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={handleLoad}
      />
      {showText && (
        <span className="font-semibold text-base tracking-wide text-slate-900 dark:text-white">
          Macanudos
        </span>
      )}
    </div>
  );
}
