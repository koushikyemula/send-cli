import express from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import basicAuth from "express-basic-auth";
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
  download,
  fileName,
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
        res.status(500).send(`Upload failed: ${err}`);
        return;
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
        res.status(200).send("URL copied to clipboard successfully.");
      } catch (err) {
        console.error("URL share error:", err);
        res.status(500).send(`Failed to copy URL: ${err}`);
        return;
      }
    });
  }
  app.use("/send", async (req, res) => {
    if (clipboard) {
      await updateClipboardData();
    }

    if (
      download &&
      fileName &&
      req.path === `/${encodeURIComponent(fileName)}`
    ) {
      const requestedFile = _path.join(path, fileName);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Type", "application/octet-stream");
      fs.createReadStream(requestedFile).pipe(res);
      return;
    }

    const requestedPath = decodeURIComponent(req.path);
    const requestedFile =
      requestedPath === "/" ? path : _path.join(path, requestedPath);

    try {
      const stats = fs.statSync(requestedFile);

      if (stats.isFile()) {
        res.sendFile(_path.resolve(requestedFile));
      } else if (stats.isDirectory()) {
        const files = fs.readdirSync(requestedFile);
        const fileLinks = files
          .map((file) => {
            const filePath = _path.join(requestedFile, file);
            const fileStats = fs.statSync(filePath);
            const isDir = fileStats.isDirectory();

            let icon = "📄";
            let fileType = "";
            let itemClass = "file-item";

            if (isDir) {
              icon = "📁";
              itemClass = "file-item directory";
            } else {
              const ext = _path.extname(file).toLowerCase();
              switch (ext) {
                case ".jpg":
                case ".jpeg":
                case ".png":
                case ".gif":
                case ".webp":
                  icon = "🖼️";
                  fileType = "IMAGE";
                  break;
                case ".mp4":
                case ".mov":
                case ".avi":
                case ".webm":
                  icon = "🎬";
                  fileType = "VIDEO";
                  break;
                case ".mp3":
                case ".wav":
                case ".aac":
                  icon = "🎵";
                  fileType = "AUDIO";
                  break;
                case ".pdf":
                  icon = "📕";
                  fileType = "PDF";
                  break;
                case ".zip":
                case ".rar":
                case ".7z":
                  icon = "📦";
                  fileType = "ARCHIVE";
                  break;
                case ".js":
                case ".ts":
                case ".jsx":
                case ".tsx":
                  icon = "⚡";
                  fileType = "JS";
                  break;
                case ".html":
                case ".htm":
                  icon = "🌐";
                  fileType = "HTML";
                  break;
                case ".css":
                  icon = "🎨";
                  fileType = "CSS";
                  break;
                case ".json":
                  icon = "📋";
                  fileType = "JSON";
                  break;
                case ".md":
                  icon = "📝";
                  fileType = "MD";
                  break;
                default:
                  fileType = ext ? ext.substring(1).toUpperCase() : "FILE";
              }
            }

            const href = `/send${
              requestedPath === "/" ? "" : requestedPath
            }/${encodeURIComponent(file)}`;
            const typeLabel = fileType
              ? `<span class="file-type">${fileType}</span>`
              : "";

            return `
              <a href="${href}" class="${itemClass}">
                <span class="file-icon">${icon}</span>
                <span class="file-name">${file}</span>
                ${typeLabel}
              </a>
            `;
          })
          .join("");

        res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Send - ${requestedPath}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: #0a0a0a;
                color: #ededed;
                min-height: 100vh;
                line-height: 1.6;
              }
              
              .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
              }
              
              .header {
                border-bottom: 1px solid #333;
                padding-bottom: 1.5rem;
                margin-bottom: 2rem;
              }
              
              .title {
                font-size: 1.5rem;
                font-weight: 600;
                color: #fff;
                margin-bottom: 0.5rem;
              }
              
              .breadcrumb {
                color: #888;
                font-size: 0.875rem;
              }
              
              .files-grid {
                display: grid;
                gap: 0.5rem;
              }
              
              .file-item {
                display: flex;
                align-items: center;
                padding: 0.75rem 1rem;
                background: #111;
                border: 1px solid #222;
                border-radius: 8px;
                text-decoration: none;
                color: #ededed;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
              }
              
              .file-item:hover {
                background: #1a1a1a;
                border-color: #333;
                transform: translateY(-1px);
              }
              
              .file-icon {
                font-size: 1.25rem;
                margin-right: 0.75rem;
                min-width: 24px;
              }
              
              .file-name {
                flex: 1;
                font-weight: 500;
                word-break: break-word;
              }
              
              .file-type {
                font-size: 0.75rem;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                padding: 0.25rem 0.5rem;
                background: #222;
                border-radius: 4px;
                margin-left: 0.5rem;
              }
              
              .directory {
                border-left: 3px solid #0070f3;
              }
              
              .directory .file-icon {
                color: #0070f3;
              }
              
              .back-link {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                background: #333;
                color: #fff;
                text-decoration: none;
                border-radius: 6px;
                font-size: 0.875rem;
                margin-bottom: 1.5rem;
                transition: background 0.2s ease;
              }
              
              .back-link:hover {
                background: #444;
              }
              
              .back-link::before {
                content: '←';
                margin-right: 0.5rem;
              }
              
              .empty {
                text-align: center;
                padding: 3rem;
                color: #666;
              }
              
              @media (max-width: 768px) {
                .container {
                  padding: 1rem;
                }
                
                .file-item {
                  padding: 1rem;
                }
                
                .file-type {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 class="title">Send</h1>
                <div class="breadcrumb">Index of ${requestedPath}</div>
              </div>
              
              ${
                requestedPath !== "/"
                  ? '<a href="/send/" class="back-link">Back to root</a>'
                  : ""
              }
              
              <div class="files-grid">
                ${
                  fileLinks ||
                  '<div class="empty">This directory is empty</div>'
                }
              </div>
            </div>
          </body>
          </html>
        `);
      }
    } catch (err) {
      res.status(404).send("File not found");
    }
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
