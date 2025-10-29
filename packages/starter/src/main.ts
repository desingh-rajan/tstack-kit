import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { config, isDevelopment } from "./config/env.ts";
import { healthCheck, initDatabase } from "./config/database.ts";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./shared/middleware/errorHandler.ts";
import { requestLogger, securityHeaders } from "./shared/middleware/logger.ts";
import { ApiResponse } from "./shared/utils/response.ts";

// Import your entity routes here
// Example: import productRoutes from "./entities/products/product.route.ts";

// Create Hono app
const app = new Hono();

// Global middleware
app.use("*", globalErrorHandler());
app.use("*", securityHeaders());
app.use("*", requestLogger());

// CORS configuration
app.use(
  "*",
  cors({
    origin: config.allowedOrigins,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Health check endpoint
app.get("/health", async (c: Context) => {
  const dbHealthy = await healthCheck();
  const statusCode = dbHealthy ? 200 : 503;

  return c.json(
    ApiResponse.success({
      status: "OK",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: config.nodeEnv,
      database: dbHealthy ? "connected" : "disconnected",
    }, "Service is healthy"),
    statusCode as 200 | 503,
  );
});

// API routes
// Register your entity routes here
// Example: app.route("/api", productRoutes);

// Root endpoint
app.get("/", (c: Context) => {
  return c.json(
    ApiResponse.success({
      name: "TonyStack API",
      version: "1.0.0",
      description:
        "A lightweight, type-safe backend service built with Deno, Hono, Drizzle, and PostgreSQL",
      documentation: "/api/docs",
      health: "/health",
      message:
        "Start building by scaffolding entities: tstack scaffold products",
    }, "Welcome to TonyStack API"),
  );
});

// 404 handler
app.notFound(notFoundHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log(" Starting TonyStack API...");

    // Initialize database
    await initDatabase();

    // Start server
    console.log(` Server running on http://localhost:${config.port}`);
    console.log(` Environment: ${config.nodeEnv}`);
    console.log(` Database: ${config.databaseUrl}`);

    if (isDevelopment) {
      console.log("\n Available endpoints:");
      console.log("   GET  /       - API information");
      console.log("   GET  /health - Health check");
      console.log("\n Scaffold entities to get started:");
      console.log("   tstack scaffold products");
      console.log("   tstack scaffold orders");
      console.log("\n Development mode enabled");
    }

    // For Deno Deploy or other platforms that provide the port
    const port = config.port;

    // Start the server
    Deno.serve({ port }, app.fetch);
  } catch (error) {
    console.error(" Failed to start server:", error);
    Deno.exit(1);
  }
}

// Start the server
if (import.meta.main) {
  startServer();
}
