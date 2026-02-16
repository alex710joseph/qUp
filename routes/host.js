import express from "express";

const router = express.Router();

router.get("/host-ping", (req, res) => {
  res.json({ message: "Hello, Host!" });
});

export default router;
