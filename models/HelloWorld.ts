import mongoose, { Schema, Document } from "mongoose";

export interface IHelloWorld extends Document {
  message: string;
  createdAt: Date;
}

const HelloWorldSchema = new Schema<IHelloWorld>(
  {
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }
);

export default mongoose.models.HelloWorld ||
  mongoose.model<IHelloWorld>("HelloWorld", HelloWorldSchema, "hello-worlds");
