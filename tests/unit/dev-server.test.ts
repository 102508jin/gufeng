import { createServer } from "node:net";

import { describe, expect, it } from "vitest";

import { findAvailablePort, parseDevServerArgs } from "@/lib/utils/dev-server";

describe("dev server port helpers", () => {
  it("uses cli port as the scanning start and strips it from next args", () => {
    const parsed = parseDevServerArgs(["--turbo", "--port", "4310", "--hostname", "127.0.0.1"], "3000");

    expect(parsed.startPort).toBe(4310);
    expect(parsed.nextArgs).toEqual(["--turbo", "--hostname", "127.0.0.1"]);
  });

  it("falls forward when the preferred port is occupied", async () => {
    const server = createServer();

    await new Promise<void>((resolve) => {
      server.listen(0, resolve);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      server.close();
      throw new Error("Failed to allocate a test port.");
    }

    const port = await findAvailablePort(address.port, 20);
    server.close();

    expect(port).toBeGreaterThan(address.port);
  });
});
