import { Context, Next } from "hono";

/** Generate a unique request ID for correlation across logs. */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function requestLogger() {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    const userAgent = c.req.header("User-Agent") || "unknown";
    const ip = c.req.header("X-Forwarded-For") ||
      c.req.header("X-Real-IP") ||
      "unknown";

    // Generate request ID at the start of the pipeline
    const requestId = c.req.header("X-Request-ID") || generateRequestId();
    c.set("requestId", requestId);

    await next();

    // Attach request ID to response
    c.header("X-Request-ID", requestId);

    const duration = Date.now() - start;
    const status = c.res.status;

    // Choose log level based on status code
    const logLevel = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    const logData = {
      timestamp: new Date().toISOString(),
      method,
      path,
      status,
      duration: `${duration}ms`,
      ip,
      userAgent,
    };

    // Simple console logging (replace with proper logger in production)
    const logMessage =
      `${logData.timestamp} [${logLevel.toUpperCase()}] ${method} ${path} ${status} ${logData.duration}`;

    if (logLevel === "error") {
      console.error(logMessage);
    } else if (logLevel === "warn") {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  };
}

// Security headers middleware
export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next();

    // Set security headers
    c.res.headers.set("X-Content-Type-Options", "nosniff");
    c.res.headers.set("X-Frame-Options", "DENY");
    c.res.headers.set("X-XSS-Protection", "1; mode=block");
    c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    c.res.headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()",
    );

    if (c.req.header("X-Forwarded-Proto") === "https") {
      c.res.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    }
  };
}
