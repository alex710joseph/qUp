import express from "express";
import connectDB from "../db/dbConnection.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/getQueuelist", async (req, res) => {
  try {
    const queueIdParam = req.query.queueId;

    if (!queueIdParam) {
      return res.status(400).json({ error: "Missing queueId parameter" });
    }

    const db = await connectDB();

    const pipeline = [
      {
        $match: {
          queue_id: new ObjectId(queueIdParam),
          activeFlag: "Y",
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
        $lookup: {
          from: "queues",
          localField: "queue_id",
          foreignField: "_id",
          as: "queueDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $unwind: "$queueDetails",
      },
      {
        $sort: { timestamp: 1 },
      },
      {
        $project: {
          _id: 1,
          token_number: 1,
          timestamp: 1,
          customer_firstName: "$userDetails.firstName",
          customer_lastName: "$userDetails.lastName",
          estimated_wait_time: "$queueDetails.estimatedServiceTime",
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
    console.error("Error fetching queue:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/getServedCustomerCount", async (req, res) => {
  try {
    const queueIdParam = req.query.queueId;

    if (!queueIdParam) {
      return res.status(400).json({ error: "Missing queueId parameter" });
    }

    const db = await connectDB();

    const servedCount = await db.collection("queue_guest").countDocuments({
      queue_id: new ObjectId(queueIdParam),
      activeFlag: "N",
    });

    res.json({ count: servedCount });
  } catch (error) {
    console.error("Error fetching served count:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/getQueueDetails", async (req, res) => {
  try {
    const queueIdParam = req.query.queueId;

    if (!queueIdParam) {
      return res.status(400).json({ error: "Missing queueId parameter" });
    }

    if (!ObjectId.isValid(queueIdParam)) {
      return res.status(400).json({ error: "Invalid queueId format" });
    }

    const db = await connectDB();

    const queueDetails = await db
      .collection("queues")
      .findOne(
        { _id: new ObjectId(queueIdParam) },
        { projection: { estimatedServiceTime: 1, status: 1 } },
      );

    if (!queueDetails) {
      return res.status(404).json({ error: "Queue not found" });
    }

    res.json({
      estimatedServiceTime: queueDetails.estimatedServiceTime,
      status: queueDetails.status,
    });
  } catch (error) {
    console.error("Error Fetching Restaurant Average Service Time: ", error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/serveNext", async (req, res) => {
  try {
    console.log(
      "Serve Next Guest Request Received for queueId:",
      req.query.queueId,
    );
    const queueId = req.query.queueId;

    if (!queueId) {
      return res.status(400).json({ error: "Missing queueId parameter" });
    }

    const db = await connectDB();

    const result = await db.collection("queue_guest").findOneAndUpdate(
      {
        queue_id: new ObjectId(queueId),
        activeFlag: "Y",
      },
      {
        $set: {
          activeFlag: "N",
          served_timestamp: new Date(),
        },
      },
      {
        sort: { timestamp: 1 },
        returnDocument: "after",
      },
    );

    // If result is null, it means no one is currently waiting
    if (!result) {
      return res.status(404).json({ message: "Queue is already empty" });
    }

    res.json({
      success: true,
      message: "Guest served successfully",
      servedGuest: result,
    });
  } catch (error) {
    console.error("Error serving next guest:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/updateStatus", async (req, res) => {
  try {
    const { queueId, status } = req.body;

    if (!queueId || !status) {
      return res.status(400).json({ error: "Missing queueId or status" });
    }

    const db = await connectDB();

    const result = await db
      .collection("queues")
      .updateOne({ _id: new ObjectId(queueId) }, { $set: { status: status } });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Queue not found in database." });
    }

    res.json({ success: true, message: `Queue status updated to ${status}` });
  } catch (error) {
    console.error("Error updating queue status:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/clearQueue", async (req, res) => {
  try {
    const { queueId } = req.body;

    if (!queueId) {
      return res.status(400).json({ error: "Missing queueId parameter" });
    }

    const db = await connectDB();

    // Delete all guest entries for this specific queue
    const result = await db.collection("queue_guest").deleteMany({
      queue_id: new ObjectId(queueId),
    });

    res.json({
      success: true,
      message: "Queue cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing queue:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
