const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Router } = require("express");
const cookieParser = require("cookie-parser");
const { authenticateClientToken } = require("../functions/middleware");
require("dotenv").config();

const router = Router();
const db = mongoose.connection;
router.use(cookieParser());

const ClientSchema = new mongoose.Schema({
  username: String,
  password: String,
  phoneNumber: String,
  occupation: String,
});

const Client = mongoose.model("client", ClientSchema, "client");

router.get("/verify-token", authenticateClientToken, (req, res) => {
  res.status(201).json({ body: req.body });
});

router.get("", authenticateClientToken, async (req, res) => {
  try {
    const client = await Client.find();

    if (!client) {
      return res.status(404).json({ error: "No client found" });
    }

    // Remove the password field from each admin object before sending the response
    const clientData = client.map((client) => {
      const clientData = client.toObject();
      delete clientData.password;
      return clientData;
    });

    res.status(200).json(clientData);
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, password, phoneNumber, occupation } = req.body;

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Client({
      username: username,
      password: hashedPassword,
      phoneNumber: phoneNumber,
      occupation: occupation,
    });

    await newAdmin.save();

    res.status(201).json({ message: "Client registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Endpoint for user login and token generation

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await Client.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentialss" });
    }

    // // Compare the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const serializeUser = { name: username };

    // Generate JWT token
    const token = jwt.sign(serializeUser, process.env.CLIENT_TOKEN_SECRET, {
      expiresIn: "2m",
    });

    // const user = {name: username}
    // const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    res.status(200).json({ token: token });
  } catch (error) {
    res.status(500).json({ error: "an error occured" });
  }
});

module.exports = router;
