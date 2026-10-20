
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);


app.get("/", (req, res) => {
  res.json({ message: "Local Server is running" });
});

app.use("/api/user", userRoutes);
app.get("/api/user/test", (req, res) => {
  res.json({ message: "User routes are working" });
});

const PORT = process.env.PORT || 5009;

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing. Check your backend .env file.");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected successfully");

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
} catch (error) {
  console.error("MongoDB connection failed:", error.message);
  process.exit(1);
}
