import { createServer } from "http";
import app from "./app";
import { initSocket } from "./socket";
import { logger } from "./lib/logger";
import { seedDemoData } from "./seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(port, "0.0.0.0", async () => {
  logger.info({ port, host: "0.0.0.0" }, "Server listening");
  await seedDemoData();
});
