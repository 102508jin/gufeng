import { spawn } from "node:child_process";
import path from "node:path";

import { findAvailablePort, parseDevServerArgs } from "@/lib/utils/dev-server";

function resolveNextBinary(): string {
  const binaryName = process.platform === "win32" ? "next.cmd" : "next";
  return path.join(process.cwd(), "node_modules", ".bin", binaryName);
}

async function main() {
  const parsed = parseDevServerArgs(process.argv.slice(2), process.env.PORT);
  const port = await findAvailablePort(parsed.startPort);

  if (port !== parsed.startPort) {
    console.log(`Port ${parsed.startPort} is busy. Using ${port} instead.`);
  }

  console.log(`Starting Next.js dev server at http://localhost:${port}`);

  const nextArgs = ["dev", "--port", String(port), ...parsed.nextArgs];
  const command = process.platform === "win32" ? "cmd.exe" : resolveNextBinary();
  const commandArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", resolveNextBinary(), ...nextArgs]
    : nextArgs;

  const child = spawn(command, commandArgs, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port)
    },
    stdio: "inherit"
  });

  const stop = () => {
    if (!child.killed) {
      child.kill();
    }
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((cause) => {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exit(1);
});
