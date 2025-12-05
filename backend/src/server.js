require("dotenv").config();
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

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
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

app.get("/", (req, res) => {
  res.json({ message: "Social Network API" });
});

app.use((err, req, res, next) => {
  // Basic error handler to avoid uncaught promise rejections reaching the client raw
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API escuchando en http://localhost:${PORT}`);
});
