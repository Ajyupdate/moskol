require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const { getDb, connectToDb } = require("../src/database/db");
const serviceRoute = require("./routes/services");
const reviewsRoute = require("./routes/reviews");
const productsRoute = require("./routes/products");
const adminRoute = require("./routes/admin");
const clientRoute = require("./routes/client");

const app = express();
const PORT = 3001;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Serve images from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

connectToDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log("app listening on port 3001");
    });
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

app.get("/info", (req, res) => {
  res.send({ id: "3" });
});

app.use("/client", clientRoute);
app.use("/admin", adminRoute);
app.use("/service", serviceRoute);
app.use("/reviews", reviewsRoute);
app.use("/products", productsRoute);
