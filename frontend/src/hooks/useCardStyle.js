import { usePreferences } from "../context/PreferencesContext";

export default function useCardStyle() {
  const { preferences } = usePreferences();
  const rounded = preferences?.cardStyle?.rounded ?? 16;
  const glass = preferences?.cardStyle?.glass ?? false;
  return {
    style: {
      borderRadius: `${rounded}px`,
      background: glass ? "rgba(255,255,255,0.7)" : undefined,
      backdropFilter: glass ? "blur(8px)" : undefined,
    },
  };
}
