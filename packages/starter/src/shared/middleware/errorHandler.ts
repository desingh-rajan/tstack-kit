import { Context, Next } from "hono";
import { ApiResponse } from "../utils/response.ts";
import { AppError } from "../utils/errors.ts";
import { isDevelopment } from "../../config/env.ts";

export function errorHandler(err: Error, c: Context) {
  console.error("Error:", err);

  // Handle custom app errors
  if (err instanceof AppError) {
    return c.json(
      ApiResponse.error(err.message),
      err.statusCode as 400 | 401 | 403 | 404 | 500,
    );
  }

  // Handle validation errors from Zod
  if (err.name === "ZodError") {
    return c.json(
      ApiResponse.error("Validation failed", null, err),
      400,
    );
  }

  // Generic server error
  const message = isDevelopment ? err.message : "Internal server error";
  return c.json(
    ApiResponse.error(message),
    500,
  );
}

// Global error handler middleware
export function globalErrorHandler() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (err) {
      return errorHandler(err as Error, c);
    }
  };
}

// 404 handler
export function notFoundHandler(c: Context) {
  return c.json(
    ApiResponse.error("Route not found"),
    404,
  );
}
