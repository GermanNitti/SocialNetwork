import React from "react";
import { Link } from "react-router-dom";

const hashtagRegex = /#([A-Za-z0-9_ÁÉÍÓÚÑáéíóúñ]+)/g;

export function formatTextWithHashtags(text) {
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = hashtagRegex.exec(text)) !== null) {
    const start = match.index;

    if (start > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, start)}</span>);
    }

    const word = match[1]; // sin '#'
    const full = match[0]; // con '#'

    parts.push(
      <Link key={key++} to={`/tag/${encodeURIComponent(word)}`} className="hashtag-link">
        {full}
      </Link>
    );

    lastIndex = hashtagRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts;
}
