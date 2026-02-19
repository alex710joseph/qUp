import express from "express";
import connectDB from "../db/dbConnection.js";

const router = express.Router();

router.use((req, res, next) => {
  if (req.session.role !== "host") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
});

// GET /api/host/host-ping (test route for host role)
router.get("/host-ping", (req, res) => {
  res.json({ message: "Hello, Host!" });
});

// POST /api/host/queue (create a new queue)
router.post("/queue", async (req, res) => {
  try {
    const db = await connectDB();

    const { name, address, estimatedServiceTime, popLimit } = req.body;

    const newQueue = {
      name,
      address,
      estimatedServiceTime: Number(estimatedServiceTime),
      popLimit: Number(popLimit),
      status: "open",
      createdBy: req.session.userId,
      createdAt: new Date(),
      servedCount: 0,
    };

    const result = await db.collection("queues").insertOne(newQueue);

    res.status(201).json({
      message: "Queue created",
      queueId: result.insertedId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
