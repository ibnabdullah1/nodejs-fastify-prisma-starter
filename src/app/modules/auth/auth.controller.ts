import { StatusCodes } from "http-status-codes";
import config from "../../config";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

const loginUser = catchAsync(async (req, res) => {
  const result = await AuthService.loginUser(req.body);

  res.cookie("refreshToken", refreshToken, {
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User logged in successfully!",
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { authorization } = req.headers;

  const result = await AuthService.refreshToken(authorization as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User logged in successfully!",
    data: result,
  });
});

// change password
const changePassword = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;

  await AuthService.changePassword(user, payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password changed successfully!",
    data: null,
  });
});

export const AuthController = {
  loginUser,
  refreshToken,
  changePassword,
};

// Commit 81
