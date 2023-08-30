const { Router } = require("express");
const { mongoose } = require("mongoose");
const router = Router();
const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
});

const messageData = mongoose.model("message", messageSchema);

router.get("", async (req, res) => {
  try {
    const messages = await messageData.find();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "An error occured while getting messages" });
  }
});

router.post("", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (name === "" || email === "" || message === "") {
      return res
        .status(400)
        .json({ message: "one of the required fields is missing" });
    }

    const newMessage = new messageData({
      name: name,
      email: email,
      message: message,
    });

    await newMessage.save();
    res.status(201).json({ message: "Message added successfully" });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});
module.exports = router;
