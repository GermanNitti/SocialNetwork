import { useState } from "react";
import { MODES } from "./ModeConfig";
import ModePicker from "./ModePicker";
import { useReelsMode } from "./ReelsModeProvider";

export default function ModePickerButton() {
  const { mode } = useReelsMode();
  const [open, setOpen] = useState(false);
  const accent = MODES[mode]?.accent || "#3B82F6";

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-700 bg-slate-900 text-slate-50 text-sm font-semibold"
        style={{ boxShadow: `0 0 0 2px ${accent}33` }}
      >
        <span
          className="h-3 w-3 rounded-full"
          style={{ background: accent }}
        />
        Modo: {MODES[mode]?.label}
      </button>
      <ModePicker open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
