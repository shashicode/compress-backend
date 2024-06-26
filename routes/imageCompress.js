const express = require("express");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

router.post("/", async (req, res) => {
  let uniqueFilePath;
  let outputFilePath;

  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (![".jpeg", ".jpg", ".png", ".webp"].includes(fileExtension)) {
      return res.status(400).send("Unsupported file format.");
    }

    // Generate a unique file name for the uploaded file
    const uniqueUploadFileName = `${uuidv4()}-upload${fileExtension}`;
    uniqueFilePath = path.join(uploadDir, uniqueUploadFileName);

    // Move the uploaded file to a new unique path
    fs.renameSync(req.file.path, uniqueFilePath);

    let compressedImage;
    let quality = 80;
    const minQuality = 10;
    let prevSize = Infinity;

    // Compress the image repeatedly, reducing quality each time
    do {
      compressedImage = await sharp(uniqueFilePath)
        .resize({ fit: sharp.fit.inside, withoutEnlargement: true })
        .toFormat(fileExtension.substring(1), { quality, progressive: true })
        .toBuffer();

      if (compressedImage.length >= prevSize || quality <= minQuality) {
        break;
      }

      prevSize = compressedImage.length;
      quality -= 10;
    } while (true);

    // Generate a unique file name for the compressed output file
    const uniqueOutputFileName = `${uuidv4()}-output${fileExtension}`;
    outputFilePath = path.join(uploadDir, uniqueOutputFileName);

    // Write the compressed image to the output file
    fs.writeFileSync(outputFilePath, compressedImage);

    console.log(`Output file created at: ${outputFilePath}`); // Logging the output file path

    // Adding a delay to ensure the file is available for reading
    setTimeout(() => {
      res.setHeader("Content-Type", `image/${fileExtension.substring(1)}`);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${uniqueOutputFileName}`
      );
      res.sendFile(outputFilePath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).send("Error sending file.");
        }
      });
    }, 100); // 100ms delay
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error.");
  } finally {
    if (uniqueFilePath && fs.existsSync(uniqueFilePath)) {
      fs.unlinkSync(uniqueFilePath); // Clean up the uploaded file
    }
  }
});

module.exports = router;
