const { Router, response } = require("express");
require("dotenv").config();
const crypto = require("crypto");

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

const multer = require("multer");

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("", async (req, res) => {
  const key = req.query.key;

  const servicePerPage = req.query.p || 4;
  try {
    const getObjectParams = {
      Bucket: bucketName,
      // Key: "639d10204b29694ee7683203a6d88b01",
      Key: key,
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

router.get("/whoweare", async (req, res) => {
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

module.exports = router;
