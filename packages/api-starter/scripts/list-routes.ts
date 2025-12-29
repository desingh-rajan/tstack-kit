#!/usr/bin/env -S deno run --allow-all
/**
 * List all registered routes in the API
 *
 * Usage: deno task routes
 *
 * Similar to Rails' `rails routes` command
 * Uses Hono's built-in route inspection (hono/helper/dev)
 */

import { app } from "../src/main.ts";
import { inspectRoutes, showRoutes } from "hono/dev";

// Check for verbose flag
const verbose = Deno.args.includes("-v") || Deno.args.includes("--verbose");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
};

console.log(`\n${colors.bright}TStack API Routes${colors.reset}\n`);
console.log(`${colors.dim}${"─".repeat(80)}${colors.reset}\n`);

// Use Hono's built-in showRoutes for formatted output
showRoutes(app, { verbose, colorize: true });

// Show summary
const routes = inspectRoutes(app);
const uniqueRoutes = new Set(routes.map((r) => `${r.method}:${r.path}`));

console.log(`\n${colors.dim}${"─".repeat(80)}${colors.reset}`);
console.log(
  `${colors.bright}Total: ${uniqueRoutes.size} routes${colors.reset}\n`,
);

// Show helpful tips
console.log(`${colors.dim}Tips:`);
console.log(`  Use -v or --verbose to show middleware handlers`);
console.log(
  `  Routes are dynamically loaded from your entities${colors.reset}`,
);
console.log();
