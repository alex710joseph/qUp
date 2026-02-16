import express from "express";
import guestRouter from "./routes/guest.js";
import hostRouter from "./routes/host.js";

console.log("Initializing the backend...");
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static("frontend"));

app.use("/api/", guestRouter);
app.use("/api/", hostRouter);

app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
