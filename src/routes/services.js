const { Router, response } = require("express");
require("dotenv").config();
const crypto = require("crypto");

const { mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");

const {
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const randomImageName = (bytes = 16) =>
  crypto.randomBytes(bytes).toString("hex");

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

const formidable = require("formidable");
const fs = require("fs");
//import * as fs from "node:fs";
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const { Console } = require("console");

const router = Router();
const db = mongoose.connection;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
  const servicePerPage = req.query.p || 4;
  try {
    const services = await Service.find().limit(servicePerPage * 1);

    for (const service of services) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: service.imageUrl,
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      service.imageUrl = url;
    }

    res.json(services);
  } catch (error) {
    console.error("Error fetching image from S3:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching images from S3" });
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

router.post("", upload.single("image"), async (req, res) => {
  const buffer = req.file.buffer;
  // const buffer = await sharp(req.file.buffer)
  //   .resize({ height: 250, width: 250, fit: "contain" })
  //   .toBuffer();

  const imageName = randomImageName();
  const params = {
    Bucket: bucketName,
    Key: imageName,
    Body: buffer,
    ContentType: req.file.mimetype,
  };

  const command = new PutObjectCommand(params);
  await s3.send(command);

  const productData = new Service({
    imageUrl: imageName,
    title: req.body.title,
    description: req.body.description,

    features: JSON.parse(req.body.features),
    benefits: JSON.parse(req.body.benefits),
  });

  productData
    .save()
    .then(() => {
      console.log("Product saved successfully");
      return res.status(200).json({ message: "Product added successfully" });
    })
    .catch((saveError) => {
      console.error("Error saving product:", saveError);
      return res
        .status(500)
        .json({ message: "Error adding product to the database" });
    });
});
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  const service = await Service.findOne({ _id: new ObjectId(id) });
  if (!service) {
    res.status(404).send("Service not found");
    return;
  }
  const params = {
    Bucket: bucketName,
    Key: service.imageUrl,
  };

  const command = new DeleteObjectCommand(params);
  await s3.send(command);

  await service.deleteOne();
  res.send({});
});
module.exports = router;
