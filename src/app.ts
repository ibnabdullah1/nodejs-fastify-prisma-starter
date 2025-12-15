import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";

import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";
import prisma from "./app/utils/prisma";

const app = async (fastify: FastifyInstance) => {
  // Register plugins
  await fastify.register(cors, {
    origin: ["http://localhost:5173",],
    credentials: true,
  });

  await fastify.register(formbody);
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });
  await fastify.register(cookie);
  await fastify.register(helmet);

  // Root route
  fastify.get("/", async (_request: FastifyRequest, _reply: FastifyReply) => {
    return {
      success: true,
      message: "API Server is running!😄",
      status: httpStatus.OK,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env["NODE_ENV"] || "development",
    };
  });

  // Health check route
  fastify.get("/health", async (_request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const healthStatus: {
      success: boolean;
      status: string;
      timestamp: string;
      uptime: number;
      environment: string;
      version: string;
      services: {
        database: {
          status: string;
          responseTime?: number;
        };
        server: {
          status: string;
          responseTime: number;
        };
      };
      memory: {
        used: string;
        total: string;
        percentage: string;
      };
    } = {
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env["NODE_ENV"] || "development",
      version: "1.0.0",
      services: {
        database: {
          status: "unknown",
        },
        server: {
          status: "healthy",
          responseTime: 0,
        },
      },
      memory: {
        used: "0 MB",
        total: "0 MB",
        percentage: "0%",
      },
    };

    // Check database connection
    try {
      const dbStartTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - dbStartTime;
      healthStatus.services.database = {
        status: "connected",
        responseTime: dbResponseTime,
      };
    } catch (error) {
      healthStatus.services.database = {
        status: "disconnected",
      };
      healthStatus.success = false;
      healthStatus.status = "degraded";
      reply.status(httpStatus.SERVICE_UNAVAILABLE);
    }

    // Calculate memory usage
    const memUsage = process.memoryUsage();
    const usedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const totalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
    const percentage = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2);

    healthStatus.memory = {
      used: `${usedMB} MB`,
      total: `${totalMB} MB`,
      percentage: `${percentage}%`,
    };

    // Calculate server response time
    healthStatus.services.server.responseTime = Date.now() - startTime;

    return healthStatus;
  });

  // API routes
  await fastify.register(router, { prefix: "/api/v1" });

  // 404 handler
  fastify.setNotFoundHandler(
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.status(httpStatus.NOT_FOUND).send({
        success: false,
        message: "API NOT FOUND!",
        status: httpStatus.NOT_FOUND,
        error: {
          path: request.url,
          message: "Your requested path is not found!",
        },
      });
    }
  );

  // Global error handler
  fastify.setErrorHandler(globalErrorHandler);
};

export default app;
