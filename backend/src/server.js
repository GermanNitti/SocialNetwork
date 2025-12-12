require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const friendRoutes = require("./routes/friends");
const notificationRoutes = require("./routes/notifications");
const chatRoutes = require("./routes/chat");
const preferenceRoutes = require("./routes/preferences");
const squadRoutes = require("./routes/squads");
const feedbackRoutes = require("./routes/feedback");
const hashtagRoutes = require("./routes/hashtags");

const app = express();
const PORT = process.env.PORT || 4000;

const FRONTEND_ORIGIN = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/squads", squadRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/hashtags", hashtagRoutes);

// -------------------------
// Servir frontend SOLO si existe el build
// -------------------------
const clientDist = path.join(__dirname, "../../frontend/dist");

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // Salud simple para probar API
  app.get("/api", (req, res) => {
    res.json({ message: "Social Network API" });
  });

  // Fallback SPA: cualquier ruta que no sea /api o /uploads devuelve index.html
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    return res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  // En Render no existe frontend/dist, así evitamos el 500
  app.get("/api", (req, res) => {
    res.json({ message: "Social Network API (sin frontend embebido)" });
  });
}

// -------------------------
// Manejo de errores
// -------------------------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
