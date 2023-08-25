const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Router } = require("express");
const { authenticateToken } = require("../functions/middleware");
// const {oneProductData} = require('../database/schemas/Product')
const cookieParser = require("cookie-parser");

require("dotenv").config();

const router = Router();
const db = mongoose.connection;
router.use(cookieParser());

const AdminSchema = new mongoose.Schema({
  username: String,
  password: String,
  phoneNumber: String,
  occupation: String,
});

const Admin = mongoose.model("Admin", AdminSchema, "admin"); // Specify the collection name 'admin'

router.get("/verify-token", authenticateToken, (req, res) => {
  res.status(201).json({ body: "admin" });
});

// Endpoint to get all admin information
router.get("", async (req, res) => {
  try {
    const admins = await Admin.find();

    if (!admins) {
      return res.status(404).json({ error: "No admins found" });
    }

    // Remove the password field from each admin object before sending the response
    const adminsData = admins.map((admin) => {
      const adminData = admin.toObject();
      delete adminData.password;
      return adminData;
    });

    res.status(200).json(adminsData);
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, password, phoneNumber, occupation } = req.body;

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      username: username,
      password: hashedPassword,
      phoneNumber: phoneNumber,
      occupation: occupation,
    });

    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Endpoint for user login and token generation
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await Admin.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // // Compare the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const serializeUser = { name: username };

    // Generate JWT token
    const token = jwt.sign(serializeUser, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "5m",
    });

    // const user = {name: username}
    // const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    res.status(200).json({ token: token });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
