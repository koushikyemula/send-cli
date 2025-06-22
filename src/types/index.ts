import http from "http";

interface StartOptions {
  port: number;
  path: string;
  receive: boolean;
  clipboard: boolean;
  updateClipboardData: () => Promise<void>;
  onStart: () => void;
  postUploadRedirectUrl: string;
  sendAddress: string;
  download: boolean;
  fileName?: string;
}

interface Config {
  debug: boolean;
  qrcode: {
    small: boolean;
  };
  auth: {
    username: string | undefined;
    password: string | undefined;
  };
  ssl: {
    protocolModule: typeof http | typeof import("https");
    protocol: string;
    option: Record<string, any>;
  };
  portfinder: {
    port: number;
    stopPort: number;
  };
}

export type { StartOptions, Config };
