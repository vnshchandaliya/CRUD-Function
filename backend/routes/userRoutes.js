import express from "express";
import User from "../models/User.js";

const router = express.Router();

// get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// create user
router.post("/", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name.trim() || !email.trim()) {
      return res.status(400).json({ message: "Name and Email are required" });
    }
    const user = await User.create({ name, email, phone });
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {
      res.status(4001).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update User

router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name.trim() || !email.trim()) {
      return res.status(400).json({ message: "Name and Email are required" });
    }
    const user = await User.findByIdAndUpdate(
      { _id: req.params.id },
      req.body,
      { returnDocument: "after" }
    );

    if (!user) {
      return res.status(404).json({ message: "User not Found" });
    }
    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Email already exists" });
    }
    if (error.name === "CastError") {
      res.status(400).json({ message: "invalid user id" });
    }

    res.status(500).json({ message: "Failed to update user" });
  }
});

// Delete User
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not Found" });
    }
    res.json({ message: "user Delete Successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      res.status(400).json({ message: "invalid user id" });
    }
    res.status(500).json({ message: "Failed to delete user" });
  }
});

export default router;
