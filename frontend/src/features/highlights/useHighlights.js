import { useQuery } from "@tanstack/react-query";
import { getReels } from "./reelService";

export function useHighlights(mode) {
  const enabled = import.meta.env.VITE_ENABLE_HIGHLIGHTS === "1";
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
