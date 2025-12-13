import { useQuery } from "@tanstack/react-query";
import { fetchMockHighlights } from "./mockHighlights";

export function useHighlights(mode) {
  const enabled = import.meta.env.VITE_ENABLE_HIGHLIGHTS === "1";
  return useQuery({
    queryKey: ["highlights", mode],
    queryFn: async () => {
      if (!enabled) return [];
      // TODO: conectar a endpoint real /api/highlights?mode=...
      return fetchMockHighlights(mode);
    },
    enabled,
  });
}
