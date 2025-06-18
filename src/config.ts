import http from "http";
import { Config } from "./types";

const config: Config = {
  debug: false,
  qrcode: {
    small: true,
  },
  auth: {
    username: undefined,
    password: undefined,
  },
  ssl: {
    protocolModule: http,
    protocol: "http",
    option: {},
  },
  portfinder: {
    port: 7478,
    stopPort: 8000,
  },
};

export default config;
