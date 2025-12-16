const express = require("express");
const router = express.Router();

// Minimal router for now to resolve MODULE_NOT_FOUND error
router.get("/", (req, res) => {
  res.status(200).json({ message: "Reels API endpoint (placeholder)" });
});

module.exports = router;