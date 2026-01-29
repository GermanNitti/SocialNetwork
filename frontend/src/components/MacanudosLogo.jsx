import React from "react";

export default function MacanudosLogo({ className = "", size = 128, showText = true }) {
  const imgSrc = `${import.meta.env.BASE_URL}MacanudosLogonew.svg`;
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={imgSrc}
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
