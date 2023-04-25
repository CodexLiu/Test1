const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");
const app = express();
const port = 4000;
const cors = require("cors");
const { spawn } = require("child_process");

// Enable CORS for all routes
app.use(cors());

//set upload size limit
app.use(express.json({ limit: "5gb" })); // Adjust the limit as needed

// Set the server timeout
app.timeout = 600000; // 10 minutes, adjust as needed

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Define a storage engine for multer that saves files to the 'docs' directory
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

app.post("/upload", upload.array("pdf"), (req, res) => {
  if (req.files) {
    req.files.forEach((file) => {
      console.log("File uploaded:", file.originalname);
    });

    const deleteDSStore = () => {
      return new Promise((resolve, reject) => {
        exec(
          'find . -name ".DS_Store" -type f -delete',
          (error, stdout, stderr) => {
            if (error) {
              console.error(`Error deleting .DS_Store file: ${error.message}`);
              reject(error);
            } else {
              console.log("Deleted .DS_Store file");
              resolve();
            }
          }
        );
      });
    };

    const runIngest = () => {
      return new Promise((resolve, reject) => {
        console.log("Starting ingest process...");

        const ingestProcess = spawn("npm", ["run", "ingest"]);

        ingestProcess.stdout.on("data", (data) => {
          console.log(`stdout: ${data}`);
        });

        ingestProcess.stderr.on("data", (data) => {
          console.error(`stderr: ${data}`);
        });

        ingestProcess.on("close", (code) => {
          if (code !== 0) {
            console.error(`Ingest process exited with code ${code}`);
            reject(new Error("Ingest process failed"));
          } else {
            console.log("Ingest process completed.");
            resolve();
          }
        });
      });
    };

    const deleteDocsFolderContents = () => {
      return new Promise((resolve, reject) => {
        exec("rm -rf ./docs/*", (error, stdout, stderr) => {
          if (error) {
            console.error(
              `Error deleting contents of docs folder: ${error.message}`
            );
            reject(error);
          } else {
            console.log("Deleted contents of docs folder");
            resolve();
          }
        });
      });
    };

    deleteDSStore()
      .then(runIngest)
      .then(deleteDocsFolderContents)
      .then(() => {
        res.status(200).send("File(s) uploaded successfully!");
      })
      .catch((error) => {
        res.status(500).send("An error occurred during file processing");
      });
  } else {
    res.status(400).send("File upload failed");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).send("Internal Server Error");
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).send("Internal Server Error");
});


