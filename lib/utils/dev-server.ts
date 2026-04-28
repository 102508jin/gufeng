import { createServer } from "node:net";

export const DEFAULT_DEV_PORT = 3000;
const MAX_PORT = 65535;

export type ParsedDevServerArgs = {
  startPort: number;
  nextArgs: string[];
};

function normalizePort(value: string | number | undefined, fallback: number): number {
  const port = Number(value);
  if (Number.isInteger(port) && port > 0 && port <= MAX_PORT) {
    return port;
  }

  return fallback;
}

export function parseDevServerArgs(argv: string[], envPort?: string): ParsedDevServerArgs {
  let startPort = normalizePort(envPort, DEFAULT_DEV_PORT);
  const nextArgs: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if ((arg === "--port" || arg === "-p") && argv[index + 1]) {
      startPort = normalizePort(argv[index + 1], startPort);
      index += 1;
      continue;
    }

    if (arg.startsWith("--port=")) {
      startPort = normalizePort(arg.slice("--port=".length), startPort);
      continue;
    }

    if (/^-p\d+$/u.test(arg)) {
      startPort = normalizePort(arg.slice(2), startPort);
      continue;
    }

    nextArgs.push(arg);
  }

  return {
    startPort,
    nextArgs
  };
}

export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port);
  });
}

export async function findAvailablePort(startPort: number, maxAttempts = 100): Promise<number> {
  const safeStartPort = normalizePort(startPort, DEFAULT_DEV_PORT);
  const lastPort = Math.min(MAX_PORT, safeStartPort + Math.max(1, maxAttempts) - 1);

  for (let port = safeStartPort; port <= lastPort; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found from ${safeStartPort} to ${lastPort}.`);
}
