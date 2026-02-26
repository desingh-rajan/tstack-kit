import { Hono } from "hono";
import { config } from "./config.ts";
import { statusHandler } from "./routes/status.ts";
import { startPoller } from "./poller.ts";

const app = new Hono();

// Status page route
app.get("/", statusHandler);

// Health endpoint (for the status service itself)
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// JSON API endpoint for programmatic access
app.get("/api/status", statusHandler);

// Start the background poller
startPoller();

// Start server
console.log(`[status] ${config.siteTitle} listening on :${config.port}`);
Deno.serve({ port: config.port }, app.fetch);
