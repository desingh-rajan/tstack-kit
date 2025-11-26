import { Context, Next } from "hono";
import { ApiResponse } from "../utils/response.ts";
import { AppError, ValidationError } from "../utils/errors.ts";
import { isDevelopment } from "../../config/env.ts";
import { ZodError } from "zod";

// Generate unique request ID for correlation
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Extract and format Zod validation errors
function formatZodErrors(zodError: ZodError, isProduction: boolean) {
  if (isProduction) {
    // Production: Sanitized errors (no internal details)
    return zodError.errors.map((err) => ({
      field: err.path.join(".") || "unknown",
      message: err.message,
      code: err.code,
    }));
  } else {
    // Development: Full error details for debugging
    return zodError.errors.map((err) => ({
      ...err, // Include all Zod error details in dev mode
      code: err.code,
      message: err.message,
      path: err.path,
    }));
  }
}

export function errorHandler(err: Error, c: Context) {
  const requestId = generateRequestId();
  const isProduction = !isDevelopment;

  // Log error with request correlation
  console.error(`[${requestId}] Error:`, {
    name: err.name,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });

  // Handle ValidationError (from our app code)
  if (err instanceof ValidationError) {
    return c.json(
      ApiResponse.error(
        err.message,
        null,
        err.errors, // Always return array (could be empty)
      ),
      err.statusCode as 400,
    );
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    return c.json(
      ApiResponse.error(err.message),
      err.statusCode as 400 | 401 | 403 | 404 | 500,
    );
  }

  // Handle Zod validation errors
  if (err instanceof ZodError || err.name === "ZodError") {
    const zodError = err as ZodError;
    const formattedErrors = formatZodErrors(zodError, isProduction);

    return c.json(
      ApiResponse.error("Validation failed", null, formattedErrors),
      400,
    );
  }

  // Generic server error (sanitize in production)
  const message = isProduction
    ? "Internal server error"
    : `${err.name}: ${err.message}`;

  const errorResponse = isProduction
    ? ApiResponse.error(message)
    : ApiResponse.error(message, { stack: err.stack });

  return c.json(errorResponse, 500);
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
