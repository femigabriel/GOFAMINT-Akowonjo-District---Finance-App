// test-mongo.js
import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://Eatsumn:Eatsumn@cluster0.glsj1ah.mongodb.net/gof-akowonjo?retryWrites=true&w=majority";

async function test() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected!");
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
}

test();
