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
