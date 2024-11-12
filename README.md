Local Image Compression Tool

Tired of unreliable online image compression tools that compromise quality or hide functionality behind paywalls? This project offers a powerful, privacy-first solution for image compression that runs entirely on your local machine. With Node.js and Next.js, you can compress images with ease, retaining control over quality without sacrificing performance.

Features
1. **High-Quality Compression:** Achieves effective compression without compromising visual quality.
2. **Privacy-Focused:** Keeps your images private by handling compression locally, with no third-party dependencies that access your files.
3. **Easy Setup:** With just Node.js and Next.js, install dependencies and get started in minutes.

Getting Started
1. Clone this repository.
2. Run npm install to set up dependencies.
3. Execute the app, and you have a reliable compression tool that keeps your images safe and fully under your control.
## Endpoints

**This is the backend, you also need to setup and run the Frontend from the below repo**
[Local Image Compression Tool Frontend Repo](https://github.com/shashicode/jumbo-compress-ui)

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
