import express from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import basicAuth from "express-basic-auth";
import handler from "serve-handler";
import fs from "fs";
import _path from "path";
import { fileURLToPath } from "url";
import config from "./config";
import { debugLog } from "./utils";
import http from "http";
import https from "https";
import { StartOptions } from "./types/index";

const start = ({
  port,
  path,
  receive,
  clipboard,
  updateClipboardData,
  onStart,
  postUploadRedirectUrl,
  sendAddress,
}: StartOptions) => {
  const app = express();

  if (config.auth.username && config.auth.password) {
    app.use(
      basicAuth({
        challenge: true,
        realm: "send",
        users: { [config.auth.username]: config.auth.password },
      })
    );
  }

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  if (receive) {
    app.use(fileUpload());

    app.get("/receive", (_req, res) => {
      const currentDir = _path.dirname(fileURLToPath(import.meta.url));
      const templatePath = _path.join(
        currentDir,
        "templates",
        "upload-form.html"
      );

      const form = fs.readFileSync(templatePath);
      res.send(form.toString().replace(/\{shareAddress\}/, sendAddress));
    });

    app.post("/upload", async (req, res) => {
      if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send("No files were received.");
        return;
      }

      const selectedFiles = req.files.selected as UploadedFile | UploadedFile[];
      const filesToProcess = Array.isArray(selectedFiles)
        ? selectedFiles
        : [selectedFiles];

      try {
        const uploadedFiles: string[] = [];

        for (const file of filesToProcess) {
          const selectedFileName = Buffer.from(file.name, "ascii").toString(
            "utf8"
          );
          const uploadPath = _path.join(path, selectedFileName);
          debugLog(`upload path: ${uploadPath}`);

          await file.mv(uploadPath);
          uploadedFiles.push(selectedFileName);
          console.log(`File received: ${uploadPath}`);
        }

        const fileCount = uploadedFiles.length;
        const successMessage =
          fileCount === 1
            ? `File '${uploadedFiles[0]}' uploaded successfully!`
            : `${fileCount} files uploaded successfully!`;

        res.send(`
          <script>
            window.alert('${successMessage}');
            window.location.href = '${postUploadRedirectUrl}';
          </script>
        `);
      } catch (err) {
        console.error("Upload error:", err);
        return res.status(500).send(`Upload failed: ${err}`);
      }
    });

    app.post("/send-url", async (req, res) => {
      const { url } = req.body;

      if (!url || typeof url !== "string") {
        res.status(400).send("No URL provided.");
        return;
      }

      try {
        const clipboard = await import("clipboardy");
        clipboard.default.writeSync(url);

        console.log(`URL received and copied to clipboard: ${url}`);
      } catch (err) {
        console.error("URL share error:", err);
        return res.status(500).send(`Failed to copy URL: ${err}`);
      }
    });
  }

  app.use("/send", async (req, res) => {
    if (clipboard) {
      await updateClipboardData();
    }
    handler(req, res, { public: path, etag: true });
  });

  if (config.ssl.protocol === "https") {
    https.createServer(config.ssl.option, app).listen(port, onStart);
  } else {
    http.createServer(app).listen(port, onStart);
  }
};

export default {
  start,
};
