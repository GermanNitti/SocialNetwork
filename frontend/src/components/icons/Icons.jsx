import React from 'react';

export const AirplaneIcon = ({ className = 'w-5 h-5', title = 'Enviar' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <title>{title}</title>
    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor" />
  </svg>
);

export const ChevronIcon = ({ className = 'w-4 h-4', direction = 'down', title = '' }) => {
  const rotation = direction === 'down' ? 0 : direction === 'up' ? 180 : direction === 'left' ? -90 : 90;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: `rotate(${rotation}deg)` }} aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const CloseIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default {
  AirplaneIcon,
  ChevronIcon,
  CloseIcon,
};
