import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import HighlightViewer from "../features/highlights/HighlightViewer";
import { useEffect, useState } from "react";
import { MODES } from "../features/highlights/ModeConfig";

export default function ReelViewerPage() {
  const { reelId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const { data: reel, isLoading, isError, error } = useQuery({
    queryKey: ["reel", reelId],
    queryFn: async () => {
      const { data } = await api.get(`/reels/${reelId}`);
      return data;
    },
    enabled: !!reelId,
  });

  useEffect(() => {
    if (reel) {
      setItems([reel]); // HighlightViewer expects an array of items
      setOpen(true);
    }
  }, [reel]);

  const handleClose = () => {
    setOpen(false);
    navigate(-1); // Navigate back to the previous page
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando reel...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error al cargar el reel: {error.message}
      </div>
    );
  }

  // Assuming a default mode for standalone reel viewing, e.g., "reels" mode
  // The mode might need to be passed with the reel data from the backend or chosen here
  const defaultMode = Object.keys(MODES).includes("reels") ? "reels" : Object.keys(MODES)[0];


  return (
    <>
      {reel && (
        <HighlightViewer
          open={open}
          items={items}
          index={0} // Always show the first (and only) item
          onClose={handleClose}
          mode={defaultMode}
        />
      )}
    </>
  );
}
