// lib/mongodb.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) throw new Error("Please add your MONGODB_URI to .env.local");

let cached = (global as any).mongoose;

if (!cached) cached = (global as any).mongoose = { conn: null, promise: null };

async function dbConnect(dbName?: string) {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = { bufferCommands: false, maxPoolSize: 10 };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      if (dbName) mongoose.connection.useDb(dbName);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
