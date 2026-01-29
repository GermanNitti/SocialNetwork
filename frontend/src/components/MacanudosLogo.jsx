import React from "react";

export default function MacanudosLogo({ className = "", size = 128 }) {
  const imgSrc = `${import.meta.env.BASE_URL}MacanudosLogonew.svg`;

  return (
    <div className={`flex items-start justify-start ${className}`}>
      <img
        src={imgSrc}
        alt="Macanudos"
        style={{ height: size, width: "auto" }}
        className="object-contain drop-shadow-lg"
      />
    </div>
  );
}
