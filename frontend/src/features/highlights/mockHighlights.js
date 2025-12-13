const baseItems = [
  {
    id: "h1",
    title: "Sketch cómico",
    authorName: "Lau C.",
    thumbUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=60",
    type: "video",
    contentType: "HUMOR",
    provider: "internal",
  },
  {
    id: "h2",
    title: "Respira y pausa",
    authorName: "Tomi Yoga",
    thumbUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=60",
    type: "card",
    contentType: "CALMA",
    provider: "internal",
  },
  {
    id: "h3",
    title: "Dato nerd",
    authorName: "Fede Dev",
    thumbUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=60",
    type: "video",
    contentType: "APRENDER",
    provider: "internal",
  },
  {
    id: "h4",
    title: "Rush de la ciudad",
    authorName: "Majo",
    thumbUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=400&q=60",
    type: "video",
    contentType: "AHORA",
    provider: "internal",
  },
  {
    id: "h5",
    title: "Hallazgo random",
    authorName: "Pato",
    thumbUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=60",
    type: "card",
    contentType: "DESCUBRIR",
    provider: "internal",
  },
  {
    id: "h6",
    title: "Historias cercanas",
    authorName: "Amiga",
    thumbUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=60",
    type: "video",
    contentType: "CERCA",
    provider: "internal",
  },
  {
    id: "h7",
    title: "Deep dive",
    authorName: "Profe",
    thumbUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=60",
    type: "card",
    contentType: "PROFUNDO",
    provider: "internal",
  },
];

export async function fetchMockHighlights(mode) {
  await new Promise((r) => setTimeout(r, 300));
  if (mode === "CAOS") return baseItems;
  return baseItems.filter((item) => item.contentType === mode || mode === "CERCA");
}
