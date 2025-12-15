import Fastify, { FastifyInstance } from "fastify";

import app from "./app";
import prisma from "./app/utils/prisma";
import config from "./config";

let server: FastifyInstance | null = null;

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);

  if (server) {
    try {
      await server.close();
      console.log("✅ HTTP server closed successfully");

      // Close database connection
      await prisma.$disconnect();
      console.log("✅ Database connection closed successfully");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during server shutdown:", error);
      process.exit(1);
    }
  } else {
    process.exit(0);
  }
};

async function main() {
  server = Fastify({
    logger: true,
  });

  await server.register(app);

  try {
    await server.listen({
      port: Number(config.port) || 5000,
      host: "0.0.0.0",
    });

    // Check database connection
    let dbStatus = "DISCONNECTED";
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "CONNECTED✅";
    } catch (error) {
      dbStatus = "DISCONNECTED❌";
      console.warn("⚠️  Database connection check failed:", error);
    }

    const port = config.port || "5000";
    const env = config.env || "development";
    // Display startup banner
    console.log("\n╔════════════════════════════════════════════╗");
    console.log("║   🚀 Fastify Server Successfully Started   ║");
    console.log("╠════════════════════════════════════════════╣");
    console.log(`║   Port: ${port.toString().padEnd(35)}║`);
    console.log(`║   Environment: ${env.padEnd(28)}║`);
    console.log(`║   Database: ${dbStatus}  ${" ".repeat(18)}║`);
    console.log(`║   URL: http://localhost:${port.toString().padEnd(19)}║`);
    console.log(
      `║   Health: http://localhost:${port.toString()}/health${" ".repeat(5)}║`
    );
    console.log("╚════════════════════════════════════════════╝\n");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown handlers
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Error handlers
  process.on("uncaughtException", (error) => {
    console.log("❌ Uncaught Exception:", error);
    gracefulShutdown("uncaughtException");
  });

  process.on("unhandledRejection", (error) => {
    console.log("❌ Unhandled Rejection:", error);
    gracefulShutdown("unhandledRejection");
  });
}

main();
