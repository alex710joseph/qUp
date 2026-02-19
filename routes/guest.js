import express from "express";
import connectDB from "../db/dbConnection.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.use((req, res, next) => {
  if (req.session.role !== "guest") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
});

// GET /api/guest/guest-ping (test route for guest role)
router.get("/guest-ping", (req, res) => {
  res.json({ message: "Hello, Guest!" });
});

// GET /api/guest/queue/:queueId (get queue details and estimated wait time)
router.get("/queue/:queueId", async (req, res) => {
  try {
    const db = await connectDB();
    const { queueId } = req.params;
    const guestId = req.session.userId;

    console.log("Fetching queue info for ID:", queueId);

    if (!ObjectId.isValid(queueId)) {
      return res.status(400).json({ message: "Invalid queue ID" });
    }

    const queue = await db.collection("queues").findOne({
      _id: new ObjectId(queueId),
    });

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    // Check if this guest is already in queue
    const existingEntry = await db.collection("queue_guest").findOne({
      queue_id: new ObjectId(queueId),
      user_id: guestId,
      activeFlag: "Y",
    });

    let position = null;
    let isInQueue = false;

    if (existingEntry) {
      isInQueue = true;

      position =
        (await db.collection("queue_guest").countDocuments({
          queue_id: new ObjectId(queueId),
          activeFlag: "Y",
          timestamp: { $lt: existingEntry.timestamp },
        })) + 1;
    }

    const waitingCount = await db.collection("queue_guest").countDocuments({
      queue_id: new ObjectId(queueId),
      activeFlag: "Y",
    });

    const estimatedWait = waitingCount * queue.estimatedServiceTime;

    res.json({
      name: queue.name,
      address: queue.address,
      status: queue.status,
      waitingCount,
      estimatedWait,
      isInQueue,
      position,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/guest/join/:queueId (join a queue)
router.post("/join/:queueId", async (req, res) => {
  try {
    const db = await connectDB();
    const { queueId } = req.params;
    const guestId = req.session.userId;

    if (!ObjectId.isValid(queueId)) {
      return res.status(400).json({ message: "Invalid queue ID" });
    }

    const queue = await db.collection("queues").findOne({
      _id: new ObjectId(queueId),
    });

    if (!queue) {
      return res.status(404).json({ message: "Queue not found" });
    }

    if (queue.status !== "open") {
      return res.status(400).json({ message: "Queue is closed" });
    }

    const waitingCount = await db.collection("queue_guest").countDocuments({
      queue_id: new ObjectId(queueId),
      activeFlag: "Y",
    });

    if (waitingCount >= queue.popLimit) {
      return res.status(400).json({ message: "Queue is full" });
    }

    // Prevent same guest from joining twice
    const existingEntry = await db.collection("queue_guest").findOne({
      queue_id: new ObjectId(queueId),
      user_id: guestId,
      activeFlag: "Y",
    });

    if (existingEntry) {
      return res.status(400).json({ message: "Already in queue" });
    }

    const entry = {
      queue_id: new ObjectId(queueId),
      user_id: guestId,
      timestamp: new Date(),
      activeFlag: "Y",
    };

    const result = await db.collection("queue_guest").insertOne(entry);

    res.status(201).json({
      message: "Joined successfully",
      entryId: result.insertedId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/guest/exit/:queueId (exit a queue)
router.post("/exit/:queueId", async (req, res) => {
  try {
    const db = await connectDB();
    const { queueId } = req.params;
    const guestId = req.session.userId;

    if (!ObjectId.isValid(queueId)) {
      return res.status(400).json({ message: "Invalid queue ID" });
    }

    const result = await db.collection("queue_guest").deleteOne({
      queue_id: new ObjectId(queueId),
      user_id: guestId,
      activeFlag: "Y",
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({ message: "Not in queue" });
    }

    res.json({ message: "Exited successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// latest 10 queues
// GET /api/guest/queues/latest
router.get("/queues/latest", async (req, res) => {
  try {
    const db = await connectDB();

    const queues = await db
      .collection("queues")
      .find({ status: "open" })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    res.json(queues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
