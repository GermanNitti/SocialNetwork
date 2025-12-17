import { useQuery } from "@tanstack/react-query";
import { getReels } from "./reelService";

export function useHighlights(mode) {
  // Default to enabled unless the env explicitly sets it to "0".
  // This avoids a production build unintentionally disabling highlights when
  // the VITE_ENABLE_HIGHLIGHTS variable is not present in the deploy environment.
  const enabled = typeof import.meta.env.VITE_ENABLE_HIGHLIGHTS === 'string'
    ? import.meta.env.VITE_ENABLE_HIGHLIGHTS !== "0"
    : true;

  return useQuery({
    queryKey: ["highlights", mode],
    queryFn: () => {
      if (!enabled) return [];
      return getReels(mode);
    },
    enabled,
    // La data ahora es sincrónica, pero react-query la cachea igual.
    // Si en el futuro es una API real, el queryFn debe ser async.
  });
}
