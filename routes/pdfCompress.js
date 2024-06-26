const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads");
const MAX_PDF_SIZE = 200 * 1024 * 1024; // 200 MB

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

router.post("/", upload.single("pdf"), async (req, res) => {
  let originalFilePath;
  let simplifiedFilePath;
  let preprocessedFilePath;
  let outputFilePath;

  try {
    console.log("Handling /compress-pdf route");

    const { grayscale } = req.body;

    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).send("No file uploaded.");
    }

    console.log(`Received file: ${req.file.originalname}`);
    console.log(`File size: ${req.file.size}`);
    console.log(`File path: ${req.file.path}`);

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (fileExtension !== ".pdf") {
      console.error("Unsupported file format");
      return res.status(400).send("Unsupported file format.");
    }

    originalFilePath = path.resolve(req.file.path);
    simplifiedFilePath = path.join(
      uploadDir,
      `${uuidv4()}-input${fileExtension}`
    );
    preprocessedFilePath = path.join(
      uploadDir,
      `${uuidv4()}-preprocessed${fileExtension}`
    );
    const uniqueOutputFileName = `${uuidv4()}-output${fileExtension}`;
    outputFilePath = path.join(uploadDir, uniqueOutputFileName);

    // Copy the input file to a new location with a simplified name
    fs.copyFileSync(originalFilePath, simplifiedFilePath);

    // Debug logging for file paths
    console.log(`Original file path: ${originalFilePath}`);
    console.log(`Simplified file path: ${simplifiedFilePath}`);

    // Ensure the copied file exists before processing
    if (!fs.existsSync(simplifiedFilePath)) {
      console.error(`Copied file does not exist: ${simplifiedFilePath}`);
      return res.status(400).send("Copied file does not exist.");
    }

    console.log(`File ${simplifiedFilePath} successfully copied and exists.`);

    // Adding a delay to ensure the file system has time to register the copied file
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log(`Verifying file before qpdf command: ${simplifiedFilePath}`);
    if (fs.existsSync(simplifiedFilePath)) {
      console.log(
        `File ${simplifiedFilePath} confirmed to exist before qpdf command.`
      );
    } else {
      console.error(
        `File ${simplifiedFilePath} does not exist before qpdf command.`
      );
      return res.status(400).send("File does not exist before qpdf command.");
    }

    console.log(
      `Preprocessing PDF with qpdf from ${simplifiedFilePath} to ${preprocessedFilePath}`
    );

    // Pre-process PDF with qpdf to handle advanced PDF features
    const qpdfResult = spawnSync("qpdf", [
      "--stream-data=uncompress",
      simplifiedFilePath,
      preprocessedFilePath,
    ]);

    if (qpdfResult.error) {
      console.error(`Error executing qpdf: ${qpdfResult.error.message}`);
      return res.status(500).send("Error executing qpdf.");
    }

    if (qpdfResult.stderr.length > 0) {
      console.error(`qpdf stderr: ${qpdfResult.stderr.toString()}`);
    }

    if (qpdfResult.status !== 0) {
      console.error(`qpdf process exited with code ${qpdfResult.status}`);
      return res.status(500).send("qpdf process exited with error.");
    }

    console.log("qpdf execution completed");

    let gsOptions = [
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      "-dPDFSETTINGS=/screen",
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      "-dAutoRotatePages=/None",
      "-dColorImageDownsampleType=/Bicubic",
      "-dColorImageResolution=72",
      "-dGrayImageDownsampleType=/Bicubic",
      "-dGrayImageResolution=72",
      "-dMonoImageDownsampleType=/Bicubic",
      "-dMonoImageResolution=72",
      `-sOutputFile=${outputFilePath}`,
      preprocessedFilePath,
    ];

    if (grayscale === "true") {
      gsOptions.splice(
        3,
        0,
        "-sColorConversionStrategy=Gray",
        "-dProcessColorModel=/DeviceGray"
      );
    }

    console.log(`Executing Ghostscript with options: ${gsOptions.join(" ")}`);

    const gsResult = spawnSync("gs", gsOptions);

    if (gsResult.error) {
      console.error(`Error executing Ghostscript: ${gsResult.error.message}`);
      return res.status(500).send("Error executing Ghostscript.");
    }

    if (gsResult.stderr.length > 0) {
      console.error(`Ghostscript stderr: ${gsResult.stderr.toString()}`);
    }

    if (gsResult.status !== 0) {
      console.error(`Ghostscript process exited with code ${gsResult.status}`);
      return res.status(500).send("Ghostscript process exited with error.");
    }

    console.log("Ghostscript execution completed");

    const compressedPdfBytes = fs.readFileSync(outputFilePath);
    if (compressedPdfBytes.length > MAX_PDF_SIZE) {
      console.error("Cannot compress PDF to the desired size.");
      return res.status(400).send("Cannot compress PDF to the desired size.");
    }

    console.log("PDF successfully compressed");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${path.basename(outputFilePath)}`
    );
    res.send(compressedPdfBytes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error.");
  } finally {
    if (originalFilePath && fs.existsSync(originalFilePath)) {
      fs.unlinkSync(originalFilePath); // Clean up the original uploaded file
    }
    if (simplifiedFilePath && fs.existsSync(simplifiedFilePath)) {
      fs.unlinkSync(simplifiedFilePath); // Clean up the simplified file
    }
    if (preprocessedFilePath && fs.existsSync(preprocessedFilePath)) {
      fs.unlinkSync(preprocessedFilePath); // Clean up the preprocessed file
    }
    // Do not delete the output file if it was successfully created and sent
  }
});

module.exports = router;
