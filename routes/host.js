import express from "express";

const router = express.Router();

router.use((req, res, next) => {
  if (req.session.role !== "host") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
});

router.get("/host-ping", (req, res) => {
  res.json({ message: "Hello, Host!" });
});

export default router;
