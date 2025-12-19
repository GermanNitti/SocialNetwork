import { useState, useCallback } from "react";
import { useHighlights } from "./useHighlights";
import { MODES } from "./ModeConfig";
import { useReelsMode } from "./ReelsModeProvider";
import HighlightViewer from "./HighlightViewer";

export default function HighlightsRow() {
  const { mode } = useReelsMode();
  const { data, isLoading } = useHighlights(mode);
  const items = Array.isArray(data) ? data : [];
  const accent = MODES[mode]?.accent || "#3B82F6";
  const [viewerIndex, setViewerIndex] = useState(null);

  const openViewer = useCallback((idx) => setViewerIndex(idx), []);
  const closeViewer = useCallback(() => setViewerIndex(null), []);
  const next = useCallback(() => setViewerIndex((idx) => (idx === null ? 0 : (idx + 1) % items.length)), [items.length]);
  const prev = useCallback(() => setViewerIndex((idx) => (idx === null ? 0 : (idx - 1 + items.length) % items.length)), [items.length]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
          Reels: {MODES[mode]?.label}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-16 w-16 rounded-full bg-slate-800/70 animate-pulse border border-slate-700 flex-shrink-0"
            />
          ))}
        {!isLoading &&
          items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => openViewer(idx)}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <span
                className="h-16 w-16 rounded-full border-2 flex items-center justify-center overflow-hidden bg-slate-900"
                style={{ borderColor: accent, boxShadow: `0 0 0 2px ${accent}22` }}
              >
                <video
                  src={item.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="text-[11px] text-slate-100 line-clamp-1">{item.authorName}</span>
            </button>
          ))}
      </div>
      <HighlightViewer
        open={viewerIndex !== null}
        items={items}
        index={viewerIndex ?? 0}
        onClose={closeViewer}
        onNext={next}
        onPrev={prev}
        mode={mode}
      />
    </div>
  );
}