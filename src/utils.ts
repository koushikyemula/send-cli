import os from "node:os";
import _path from "path";
import config from "./config";

const getNetworkAddress = (): string | undefined => {
  for (const interfaceDetails of Object.values(os.networkInterfaces())) {
    if (!interfaceDetails) continue;
    for (const details of interfaceDetails) {
      const { address, family, internal } = details;
      if (family === "IPv4" && !internal) return address;
    }
  }
  return undefined;
};

const debugLog = (log: any): void => {
  if (config.debug) console.log(log);
};

function isValidUrl(urlString: string) {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}

const expandTildePath = (filePath: string): string => {
  if (filePath.startsWith("~/") || filePath === "~") {
    return _path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
};

export { getNetworkAddress, debugLog, isValidUrl, expandTildePath };
