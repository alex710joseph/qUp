import express from "express";
import connectDB from "../db/dbConnection.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/getQueuelist", async (req, res) => {
  try {
    const queueIdParam = req.query.queueId;
    console.log("Queue ID from request:", queueIdParam);

    if (!queueIdParam) {
      return res.status(400).json({ error: "Missing queueId parameter" });
    }

    console.log("Connecting to database...");
    const db = await connectDB();

    if (!db) {
      throw new Error("Database connection returned null");
    }
    console.log("Database connected successfully");

    const collections = await db.listCollections().toArray();
    console.log(
      "📚 Available collections:",
      collections.map((c) => c.name),
    );

    const pipeline = [
      {
        $match: {
          queueId: new ObjectId(queueIdParam),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $sort: { timestamp: 1 },
      },
      {
        $project: {
          _id: 1,
          token_number: 1,
          timestamp: 1,
          customer_name: "$userDetails.firstName",
        },
      },
    ];

    const queueList = await db
      .collection("queue_guest")
      .aggregate(pipeline)
      .toArray();

    console.log("Query successful, results:", queueList.length);
    res.json({ queue: queueList });
  } catch (error) {
    console.error("Full error details:", error);
    res.status(500).json({
      error: "Server Error",
      message: error.message,
    });
  }
});

export default router;
