import express from "express";
import connectDB from "../db/dbConnection.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const db = await connectDB();

  const user = await db.collection("users").findOne({
    username,
    password,
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  req.session.userId = user._id;
  req.session.role = user.role;

  res.json({ role: user.role });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not logged in" });
  }

  res.json({
    userId: req.session.userId,
    role: req.session.role,
  });
});

export default router;
