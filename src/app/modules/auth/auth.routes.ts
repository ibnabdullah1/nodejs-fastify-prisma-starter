import { UserRole } from "@prisma/client";
import { FastifyInstance } from "fastify";

import auth from "../../middlewares/auth";

import { AuthController } from "./auth.controller";

const AuthRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/login", AuthController.loginUser);

  fastify.post("/refresh-token", AuthController.refreshToken);

  fastify.post(
    "/change-password",
    {
      preHandler: auth(UserRole.SUPER_ADMIN, UserRole.USER),
    },
    AuthController.changePassword
  );
};

export { AuthRoutes };

// Improvement commit 170

// Improvement commit 186
