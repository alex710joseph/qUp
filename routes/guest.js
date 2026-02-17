import express from "express";

const router = express.Router();

router.use((req, res, next) => {
  if (req.session.role !== "guest") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
});

router.get("/guest-ping", (req, res) => {
  res.json({ message: "Hello, Guest!" });
});

export default router;
