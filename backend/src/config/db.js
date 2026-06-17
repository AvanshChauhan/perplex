import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in the environment");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");

  try {
    // Drop the unique username index if it exists in the collection to support duplicate usernames
    await mongoose.connection.db.collection("users").dropIndex("username_1");
    console.log("Successfully dropped unique index on username");
  } catch (error) {
    console.log("Unique username index checked (already dropped or not present)");
  }
};

export default connectDB;
