#! /usr/bin/env node

import fs from "fs";
import https from "https";
import _path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import qrcode from "qrcode-terminal";
import portfinder from "portfinder";
import app from "./app";
import config from "./config";
import {
  debugLog,
  getNetworkAddress,
  isValidUrl,
  expandTildePath,
} from "./utils";

const packageJson = JSON.parse(
  fs.readFileSync(_path.join(__dirname, "../package.json"), "utf8")
);
const version = packageJson.version;

const usage = `
Usage:
• Share file or directory
$ send [options] <path>

Examples:
• Share file or directory
$ send /path/to/file-or-directory

• Share clipboard
$ send -c

• Share URL
$ send --url https://example.com

• Receive files
$ send --receive /destination/directory

• Share with authentication
$ send -u user -p password /path/to/file-or-directory

• Share with custom port
$ send --port 8080 /path/to/file-or-directory

• Receive with authentication
$ send --receive -u user -p password /destination/directory`;

(async () => {
  const options = await yargs(hideBin(process.argv))
    .usage(usage)
    .version(version)
    .option("debug", {
      describe: "enable debuging logs",
      type: "boolean",
      demandOption: false,
    })
    .option("port", {
      describe: "Change default port",
      demandOption: false,
    })
    .option("ip", {
      describe: "Your machine public ip address",
      demandOption: false,
    })
    .option("c", {
      alias: "clipboard",
      describe: "Share Clipboard",
      type: "boolean",
      demandOption: false,
    })
    .option("url", {
      describe: "Share URL",
      demandOption: false,
    })
    .option("t", {
      alias: "tmpdir",
      describe: "Clipboard Temporary files directory",
      demandOption: false,
    })
    .option("w", {
      alias: "on-windows-native-terminal",
      describe: "Enable QR-Code support for windows native terminal",
      type: "boolean",
      demandOption: false,
    })
    .option("r", {
      alias: "receive",
      describe: "Receive files",
      type: "boolean",
      demandOption: false,
    })
    .option("u", {
      default: "user",
      alias: "username",
      describe: "set basic authentication username",
      demandOption: false,
    })
    .option("p", {
      alias: "password",
      describe: "set basic authentication password",
      demandOption: false,
    })
    .option("s", {
      alias: "ssl",
      describe: "Enable https",
      type: "boolean",
      demandOption: false,
    })
    .option("cert", {
      describe: "Path to ssl cert file",
      demandOption: false,
    })
    .option("key", {
      describe: "Path to ssl key file",
      demandOption: false,
    })
    .help(true).argv;

  config.debug = Boolean(options.debug) || config.debug;

  config.qrcode.small = !options.w;

  if (options.u && options.p) {
    config.auth.username = String(options.u);
    config.auth.password = String(options.p);
  }

  let path: string | undefined = undefined;
  let fileName: string | undefined = undefined;

  if (options.s) {
    if (!options.cert) {
      console.log("Specify the cert path.");
      return;
    }

    if (!options.key) {
      console.log("Specify the key path.");
      return;
    }

    config.ssl = {
      protocolModule: https,
      protocol: "https",
      option: {
        key: fs.readFileSync(_path.resolve(__dirname, String(options.key))),
        cert: fs.readFileSync(_path.resolve(__dirname, String(options.cert))),
      },
    };
  }

  const updateClipboardData = async () => {
    const clipboard = await import("clipboardy");

    const data = clipboard.default.readSync();
    debugLog(`clipboard data:\n ${data}`);

    let filePath = data;
    if (data.indexOf("file://") !== -1) {
      filePath = data
        .substring(data.indexOf("file://") + "file://".length)
        .trim();
      try {
        filePath = decodeURI(filePath);
      } catch (err) {}
    }
    debugLog(`clipboard file path:\n ${filePath}`);

    if (fs.existsSync(expandTildePath(filePath))) {
      debugLog(`clipboard file ${filePath} found`);
      path = expandTildePath(filePath);
    } else {
      const outPath = options.t
        ? _path.join(String(options.t), ".clipboard-tmp")
        : ".clipboard-tmp";
      fs.writeFileSync(outPath, data);
      path = _path.resolve(outPath);
    }
  };

  if (options.c) {
    await updateClipboardData();
  } else {
    path = String(options._[0]);

    if (path === "undefined" && options._.length === 0) {
      path = undefined;
    } else if (path && path !== "undefined") {
      path = expandTildePath(path);
    }
  }

  if (options.url) {
    if (!isValidUrl(String(options.url))) {
      console.log("Invalid URL.");
      process.exit(1);
    }

    console.log("\nScan the QR-Code to access the URL");
    qrcode.generate(String(options.url), config.qrcode);
    console.log(`URL: ${options.url}`);
    console.log("\nPress ctrl+c to stop\n");

    process.stdin.resume();
    return;
  }

  if (!path) {
    console.log("Specify directory or file path.");
    process.exit(1);
  }
  if (!fs.existsSync(path)) {
    console.log("Directory or file not found.");
    process.exit(1);
  }

  if (path && fs.lstatSync(path).isFile()) {
    let trailingSlash = path.lastIndexOf("/") > -1 ? "/" : "\\";
    fileName = _path.basename(path);
    path = path.substring(0, path.lastIndexOf(trailingSlash) + 1);
  }

  const port = options.port
    ? Number(options.port)
    : await portfinder.getPortPromise(config.portfinder);

  const uploadAddress = options.ip
    ? `${config.ssl.protocol}://${String(options.ip)}:${port}/receive`
    : `${config.ssl.protocol}://${getNetworkAddress()}:${port}/receive`;

  const time = new Date().getTime();
  const file = fileName ? encodeURIComponent(fileName) : "";
  const urlInfo = `:${port}/send/${file}?time=${time}`;
  const sendAddress = options.ip
    ? `${config.ssl.protocol}://${String(options.ip)}${urlInfo}`
    : `${config.ssl.protocol}://${getNetworkAddress()}${urlInfo}`;

  const onStart = () => {
    if (options.r) {
      console.log("\nScan the QR-Code to upload your files");
      qrcode.generate(uploadAddress, config.qrcode);
      console.log(`Upload link: ${uploadAddress}\n`);
      console.log("\nPress ctrl+c to stop receiving\n");
      return;
    }

    let usageMessage: string;
    if (options.c) {
      usageMessage = "Scan the QR-Code to access your Clipboard";
    } else {
      usageMessage = fileName
        ? `Scan the QR-Code to access '${fileName}' file on your mobile`
        : `Scan the QR-Code to access '${path}' directory on your mobile`;
    }

    console.log(usageMessage);
    qrcode.generate(sendAddress, config.qrcode);
    console.log(`Access link: ${sendAddress}`);
    console.log("\nPress ctrl+c to stop sharing\n");
  };

  app.start({
    port,
    path: path!,
    receive: Boolean(options.r),
    clipboard: Boolean(options.c),
    updateClipboardData,
    onStart,
    postUploadRedirectUrl: uploadAddress,
    sendAddress,
  });
})();
