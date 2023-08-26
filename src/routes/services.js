const { Router, response } = require("express");

const { mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");

const formidable = require("formidable");
const fs = require("node:fs/promises");
//import * as fs from "node:fs";
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const router = Router();
const db = mongoose.connection;

// Define the Features schema

const featuresSchema = new mongoose.Schema({
  title: String,
  description: String,
});

const benefitSchema = new mongoose.Schema({
  title: String,
  description: String,
});

const serviceSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  features: [featuresSchema],
  benefits: [benefitSchema],
});

const Service = mongoose.model("services", serviceSchema);

router.get("", async (req, res) => {
  const servicePerPage = req.query.p || 3;
  try {
    const services = await Service.find().limit(servicePerPage * 1);
    res.json(services);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching services" });
  }
});

router.get("/:id", async (request, response) => {
  const { id } = request.params;
  await Service.findOne({ _id: new ObjectId(id) })
    .then((doc) => {
      response.status(200).json(doc);
    })
    .catch((err) => {
      res.status(500).json({ error: "could not fetch document" });
    });
});

router.post("", async (req, res) => {
  console.log(req.body);
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

      const productData = new oneService({
        imageUrl: relativeImagePath.replace("\\", "/"),
        title: fields.title[0],
        description: fields.description[0],

        features: JSON.parse(fields.features),
        benefits: JSON.parse(fields.benefits),
      });

      console.log(productData);

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
module.exports = router;
