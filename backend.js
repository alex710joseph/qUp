import express from "express";
import dotenv from "dotenv";
import guestRouter from "./routes/guest.js";
import hostRouter from "./routes/host.js";
import connectDB from "./db/dbConnection.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("frontend"));

async function startServer() {
  try {
    await connectDB();

    app.use("/api/guest", guestRouter);
    app.use("/api/host", hostRouter);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
}

startServer();
