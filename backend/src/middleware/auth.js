const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = payload.userId;
    } catch (error) {
      req.userId = null;
    }
  } else {
    req.userId = null;
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
