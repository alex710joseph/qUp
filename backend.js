import express from "express";

console.log("Initializing the backend...");

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static("frontend"));

app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
