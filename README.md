# Compress App

This is a Node.js application for compressing images and PDF files.

## Endpoints

### /compress-image

- Compresses an image to the desired file size.
- Supports `jpeg`, `jpg`, `png`, and `webp` formats.
- Requires a multipart form-data with the file and an optional size parameter.

### /compress-pdf

- Compresses a PDF file to the lowest possible size while maintaining good quality.
- Can optionally convert the PDF to grayscale.
- Requires a multipart form-data with the file and an optional grayscale parameter.

## Configuration

- Default maximum file size for images: 100 MB
- Default maximum file size for PDFs: 200 MB

## Installation

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `node app.js` to start the server.

## Usage

Send a POST request to the respective endpoint with the required file and parameters.