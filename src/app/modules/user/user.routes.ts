import { UserRole } from "@prisma/client";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { fileUploader } from "../../helpers/fileUploader";
import auth from "../../middlewares/auth";

import { userController } from "./user.controller";
import { userValidation } from "./user.validation";

const userRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    "/create-user",
    {
      preHandler: [fileUploader.uploadSingle("file")],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = request.body as any;
      if (data.data) {
        request.body = userValidation.createUser.parse(JSON.parse(data.data));
      }
      return userController.createUser(request, reply);
    }
  );

  fastify.put(
    "/update-profile",
    {
      preHandler: [
        fileUploader.uploadSingle("file"),
        auth(UserRole.ADMIN, UserRole.USER),
      ],
    },
    userController.profileUpdate
  );

  fastify.get(
    "/me",
    {
      preHandler: auth(UserRole.ADMIN, UserRole.USER),
    },
    userController.getMyProfile
  );

  fastify.get(
    "/",
    {
      preHandler: auth(UserRole.ADMIN),
    },
    userController.getAllUsers
  );

  fastify.put(
    "/update-role/:id",
    {
      preHandler: auth(UserRole.ADMIN),
    },
    userController.updateUserRole
  );

  fastify.put(
    "/update-status/:id",
    {
      preHandler: auth(UserRole.ADMIN),
    },
    userController.updateUserStatus
  );

  fastify.get(
    "/customer/followed-shops",
    {
      preHandler: auth(UserRole.ADMIN, UserRole.USER),
    },
    userController.getCustomerFollowedShops
  );
};

export { userRoutes };

// Improvement commit 35

// Improvement commit 109
