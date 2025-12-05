import { API_BASE_URL } from "../api/client";
import { useLightbox } from "../context/LightboxContext";

export default function Avatar({ user, size = 48, className = "" }) {
  const mediaBase = API_BASE_URL.replace(/\/api$/, "");
  const src = user?.avatar ? `${mediaBase}/${user.avatar}` : null;
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const { open } = useLightbox();

  return (
    <div
      className={`rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-700 font-semibold ${className} ${src ? "cursor-pointer" : ""}`}
      style={{ width: size, height: size }}
      onClick={() => src && open(src, user?.name || "avatar")}
    >
      {src ? (
        <img src={src} alt={user?.name || "avatar"} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
