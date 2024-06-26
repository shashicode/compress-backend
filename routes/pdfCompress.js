const express = require("express");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");

const router = express.Router();

const MAX_PDF_SIZE = 200 * 1024 * 1024; // 200 MB

router.post("/", async (req, res) => {
  try {
    const { grayscale } = req.body;

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const pdfPath = req.file.path;
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Optional: Convert PDF to grayscale
    if (grayscale === "true") {
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        const grayPage = pdfDoc.addPage([width, height]);
        grayPage.drawPage(page);
      }
      pdfDoc.removePages(0, pdfDoc.getPageCount() - pages.length);
    }

    const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: false });
    if (compressedPdfBytes.length > MAX_PDF_SIZE) {
      return res.status(400).send("Cannot compress PDF to the desired size.");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.send(compressedPdfBytes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error.");
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

module.exports = router;
