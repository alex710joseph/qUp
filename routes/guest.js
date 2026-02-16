import express from "express";

const router = express.Router();

router.get("/guest-ping", (req, res) => {
  res.json({ message: "Hello, Guest!" });
});

export default router;
