const { Router, response } = require("express");
const { connectToDb, getDb } = require("../database/db");
const { mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");

// const {getDb, connectToDb} = require('./database/')

const router = Router();
const db = mongoose.connection;

const reviewSchema = new mongoose.Schema({
  name: String,
  comment: String,
  occupation: String,
  imageUrl: String,
});

router.get("", (request, response) => {
  const reviewsPerPage = request.query.p || 4;
  let reviews = [];

  db.collection("reviews")
    .find()
    .limit(reviewsPerPage * 1)
    .forEach((review) => reviews.push(review))
    .then(() => {
      response.status(200).json(reviews);
    })
    .catch(() => {
      response.status(500).json({ error: "Could not fetch the reviews" });
    });
});

router.get("/image", async (req, res) => {
  const key = req.query.key;

  const servicePerPage = req.query.p || 4;
  try {
    const getObjectParams = {
      Bucket: bucketName,
      Key: "a72687c4cd0adcfaea44bde66ccdaea7",
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 36000 });

    res.json(url);
  } catch (error) {
    console.error("Error fetching image from S3:", error);
    res.status(500).json({
      error: "An error occurred while fetching images from S3 bucket",
    });
  }
});

// POST route to add a new review
router.post("", (request, response) => {
  const { name, comment, occupation } = request.body;

  if (name && comment && occupation) {
    const newReview = {
      name,
      comment,
      occupation,
    };

    db.collection("reviews")
      .insertOne(newReview)
      .then(() => {
        response.status(201).json({ message: "Review added successfully" });
      })
      .catch(() => {
        response.status(500).json({ error: "Could not add the review" });
      });
  } else {
    response.status(400).json({ error: "Missing required fields" });
  }
});

module.exports = router;
