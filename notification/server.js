import dns from "dns";
dns.setDefaultResultOrder("ipv4first"); // Render cannot reach Gmail over IPv6

import app from "./src/app.js";
import config from "./src/config/config.js";
import { connectDB, disconnectDB } from "./src/config/database.js";
import { connect, closeConnection } from "./src/broker/rabbit.js";
import startListener from "./src/broker/listener.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

const server = app.listen(config.PORT, () => {
  console.log(`Notification service running on port ${config.PORT}`);
});

async function shutdown() {
  console.log("Shutting down gracefully...");
  server.close();
  await closeConnection();
  await disconnectDB();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function start() {
  await connectDB();
  connect(startListener);
}

start();
