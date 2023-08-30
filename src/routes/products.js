const { Router, json } = require("express");

const { mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");
const express = require("express");

const formidable = require("formidable");
const fs = require("fs");
//import * as fs from "node:fs";
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// const {getDb, connectToDb} = require('./database/')

const router = Router();
const db = mongoose.connection;
router.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
const oneProduct = new mongoose.Schema({
  name: String,
  description: String,
  unitAvailable: Number,
  price: Number,
  imageUrl: String,
  features: [String], // Define as an array of strings
});

const oneProductData = mongoose.model("products", oneProduct);

router.get("", (request, response) => {
  let products = [];

  db.collection("products")
    .find()

    .forEach((product) => products.push(product))
    .then(() => {
      response.status(200).json(products);
    })
    .catch(() => {
      response.status(500).json({ error: "Could not fetch the products" });
    });
});

router.use(express.static("public/uploads"));
router.get("/:id", (request, response) => {
  const { id } = request.params;
  db.collection("products")
    .findOne({ _id: new ObjectId(id) })
    .then((doc) => {
      response.status(200).json(doc);
    })
    .catch((err) => {
      res.status(500).json({ error: "could not fetch document" });
    });
});

// PATCH route for updating a product
router.patch("/:id", async (req, res) => {
  const productId = req.params.id;
  const updateData = req.body; // Request body should contain the fields to be updated

  try {
    const updatedProduct = await oneProductData.findByIdAndUpdate(
      productId,
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not founddd" });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Error updating product" });
    console.log(error);
  }
});

router.post("", async (req, res) => {
  const form = new formidable.IncomingForm();
  const uploadDir = path.join(__dirname, "public/uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  form.uploadDir = uploadDir;
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: "Error parsing form data" });
    }

    // const image = files.image;
    // const imagePath = image ? image.path : '';

    const imagePath = files.imageUrl[0].filepath;
    const imageName = uuidv4() + path.extname(imagePath);
    const relativeImagePath = path.join("uploads", imageName);

    const newPath = path.join(uploadDir, imageName);

    //Use fs.rename to move the file instead of fs.renameSync
    fs.rename(imagePath, newPath, (renameError) => {
      if (renameError) {
        console.error("Error renaming file:", renameError);
        return res.status(500).json({ message: "Error saving uploaded image" });
      }

      const productData = new oneProductData({
        imageUrl: relativeImagePath.replace("\\", "/"),
        name: fields.name[0],
        description: fields.description[0],
        price: parseFloat(fields.price),
        unitAvailable: parseInt(fields.unitAvailable, 10),
        features: JSON.parse(fields.features),
      });

      productData
        .save()
        .then(() => {
          console.log("Product saved successfully");
          return res
            .status(200)
            .json({ message: "Product added successfully" });
        })
        .catch((saveError) => {
          console.error("Error saving product:", saveError);
          return res
            .status(500)
            .json({ message: "Error adding product to the database" });
        });
    });
  });
});

// DELETE route to delete a product by ID
router.delete("/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    // Check if the product exists
    const product = await oneProductData.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete the product
    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product" });
  }
});

module.exports = router;
