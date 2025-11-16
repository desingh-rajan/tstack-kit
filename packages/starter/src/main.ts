import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { config, isDevelopment } from "./config/env.ts";
import { healthCheck, initDatabase } from "./config/database.ts";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/middleware/errorHandler.ts";
import { requestLogger, securityHeaders } from "./shared/middleware/logger.ts";
import { ApiResponse } from "./shared/utils/response.ts";
import { registerEntityRoutes } from "./entities/index.ts";
import authRoutes from "./auth/auth.route.ts";
import adminRoutes from "./auth/admin.route.ts";

// Create Hono app
const app = new Hono();

// Register global error handler
app.onError(errorHandler);

// Global middleware
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
      environment: config.environment,
      database: dbHealthy ? "connected" : "disconnected",
    }, "Service is healthy"),
    statusCode as 200 | 503,
  );
});

// Auth routes (manual registration at root level)
// Deployment path prefix (e.g., /company-be/api) is handled by reverse proxy
app.route("/", authRoutes);
app.route("/", adminRoutes);

// User admin routes (manually registered because user.model.ts is in auth/, not entities/)
import userAdminRoutes from "./auth/user.admin.route.ts";
app.route("/", userAdminRoutes);

// Entity routes - Auto-registered from entities folder at root level
// All *.route.ts files in entities/* subdirectories are automatically imported
// For manual route registration, see ./entities/index.ts for examples
await registerEntityRoutes(app);

// Manual route registration (if needed):
// import customRoutes from "./custom/custom.route.ts";
// app.route("/custom", customRoutes);

// Root endpoint
app.get("/", (c: Context) => {
  return c.json(
    ApiResponse.success({
      name: "TonyStack API",
      version: "1.0.0", // Your API version - increment as you develop
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

    console.log(" Registering entity routes...");

    // Start server
    console.log(` Server running on http://localhost:${config.port}`);
    console.log(` Environment: ${config.environment}`);
    console.log(` Database: ${config.databaseUrl}`);

    if (isDevelopment) {
      console.log("\n Available endpoints:");
      console.log("   GET  /       - API information");
      console.log("   GET  /health - Health check");
      console.log(
        "   All /*       - Auto-registered public routes from entities/",
      );
      console.log(
        "   All /ts-admin/* - Auto-registered admin routes (requires auth)",
      );
      console.log("\n Scaffold entities to get started:");
      console.log("   tstack scaffold articles  (includes admin panel)");
      console.log("   tstack scaffold products");
      console.log("   tstack scaffold users --skip-admin  (skip admin panel)");
      console.log("\n Development mode enabled - routes auto-discovered");
      console.log("\n Note: Routes are clean (e.g., /articles, /users)");
      console.log("      Admin API: /ts-admin/articles (JSON API)");
      console.log(
        "      Deployment prefix handled by reverse proxy (Kamal, nginx)",
      );
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

// Export app for testing
export { app };

// Start the server
if (import.meta.main) {
  startServer();
}
