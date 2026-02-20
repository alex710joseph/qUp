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
  req.session.username = user.username;
  req.session.firstName = user.firstName;

  res.json({
    role: user.role,
    username: user.username,
    firstName: user.firstName,
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not logged in" });
  }

  res.json({
    userId: req.session.userId,
    role: req.session.role,
    username: req.session.username,
    firstName: req.session.firstName,
  });
});

export default router;
