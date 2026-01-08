import React from "react";

export default function MacanudosAnimatedLogo({ className = "", size = 128, showText = true }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={`${import.meta.env.BASE_URL}logoheader.png`}
        alt="Macanudos"
        style={{ height: size, width: "auto" }}
        className="object-contain drop-shadow-lg"
      />
      {showText && (
        <span className="font-semibold text-base tracking-wide text-slate-900 dark:text-white">
          Macanudos
        </span>
      )}
    </div>
  );
}
