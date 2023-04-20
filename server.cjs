const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");
const app = express();
const port = 4000;
const cors = require("cors");

// Enable CORS for all routes
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Define a storage engine for multer that saves files to the 'pdfs' directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "docs/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Set up multer middleware to handle file uploads
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

app.post("/upload", upload.single("pdf"), (req, res) => {
  if (req.file) {
    console.log("File uploaded:", req.file.originalname);

    // Remove .DS_Store file before running the npm command
    exec(
      'find . -name ".DS_Store" -type f -delete',
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error deleting .DS_Store file: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Delete .DS_Store file stderr: ${stderr}`);
          return;
        }
        console.log("Deleted .DS_Store file");

        // Comment out the line below to disable running npm run ingest command
        // exec("npm run ingest", (error, stdout, stderr) => {
        //   if (error) {
        //     console.error(`Error executing command: ${error.message}`);
        //     return;
        //   }
        //   if (stderr) {
        //     console.error(`Command stderr: ${stderr}`);
        //     return;
        //   }
        //   console.log(`Command stdout: ${stdout}`);

          // Delete the contents of the docs folder
          exec("rm -rf ./docs/*", (error, stdout, stderr) => {
            if (error) {
              console.error(
                `Error deleting contents of docs folder: ${error.message}`
              );
              return;
            }
            if (stderr) {
              console.error(`Delete contents of docs folder stderr: ${stderr}`);
              return;
            }
            console.log("Deleted contents of docs folder");
          });
        // });
      }
    );

    res.status(200).send("File uploaded successfully!");
  } else {
    res.status(400).send("File upload failed");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
