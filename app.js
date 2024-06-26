const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

const app = express();

// Configure CORS
const corsOptions = {
  origin: "*", // Allow requests from any origin
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

const upload = multer({ dest: "uploads/" });

// Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const imageCompressRouter = require("./routes/imageCompress");
const pdfCompressRouter = require("./routes/pdfCompress");

app.use("/compress-image", upload.single("image"), imageCompressRouter);
app.use("/compress-pdf", upload.single("pdf"), pdfCompressRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
