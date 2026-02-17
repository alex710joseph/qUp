import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = "qup";

let client;
let db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB at URI:", URI);
  }
  return db;
}

export default connectDB;
