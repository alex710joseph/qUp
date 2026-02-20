import express from "express";
import connectDB from "../db/dbConnection.js";

const router = express.Router();

// POST /api/auth/login
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

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { username, password, firstName, lastName, role } = req.body;

    if (!username || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!["guest", "host"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const db = await connectDB();

    const existingUser = await db.collection("users").findOne({
      username,
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const result = await db.collection("users").insertOne({
      username,
      firstName,
      lastName,
      password,
      role,
    });

    res.status(201).json({
      message: "User created successfully",
      userId: result.insertedId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// GET /api/auth/me
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
