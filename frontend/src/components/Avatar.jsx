import { API_BASE_URL } from "../api/client";
import { useLightbox } from "../context/LightboxContext";
import { useMemo, useRef, useEffect } from "react";

function parseTimeRange(src = "") {
  const match = src.match(/#t=([\d.]+),?([\d.]*)/);
  if (!match) return { cleanSrc: src, start: 0, end: null };
  const start = parseFloat(match[1]) || 0;
  const end = match[2] ? parseFloat(match[2]) : null;
  const cleanSrc = src.split("#")[0];
  return { cleanSrc, start, end };
}

export default function Avatar({ user, size = 48, className = "" }) {
  const mediaBase = API_BASE_URL.replace(/\/api$/, "");
  const imgSrc = user?.avatar ? `${mediaBase}/${user.avatar}` : null;
  const videoSrc = user?.profileVideoUrl ? `${mediaBase}/${user.profileVideoUrl}` : null;
  const useVideo = user?.useVideoAvatar && videoSrc;
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const { open } = useLightbox();
  const videoRef = useRef(null);
  const parsed = useMemo(() => parseTimeRange(videoSrc || ""), [videoSrc]);

  useEffect(() => {
    if (!useVideo || !videoRef.current) return;
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
  }, [useVideo, parsed.start, parsed.end]);

  return (
    <div
      className={`rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-700 font-semibold ${className} ${
        imgSrc || useVideo ? "cursor-pointer" : ""
      }`}
      style={{ width: size, height: size }}
      onClick={() => {
        const src = useVideo ? videoSrc : imgSrc;
        if (src) open(src, user?.name || "avatar", { isVideo: !!useVideo });
      }}
    >
      {useVideo ? (
        <video
          ref={videoRef}
          src={parsed.cleanSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : imgSrc ? (
        <img src={imgSrc} alt={user?.name || "avatar"} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
