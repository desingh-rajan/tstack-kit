import { Hono } from "hono";

/**
 * Auto-discovery and registration of all entity routes
 *
 * This function dynamically imports all .route.ts files from entity folders
 * and registers them at the ROOT level (no prefix)
 *
 * CLEAN ARCHITECTURE:
 * - Routes are registered at root: /articles, /users, /products
 * - Deployment prefix (e.g., /company-be/api) is handled by reverse proxy (Kamal, nginx, etc.)
 * - Application code stays clean and deployment-agnostic
 *
 * AUTOMATIC CONVENTION:
 * entities/
 *   users/
 *     user.route.ts (exports default Hono router with /users paths)
 *   posts/
 *     post.route.ts (exports default Hono router with /posts paths)
 *
 * Example:
 * - Application routes: GET /articles, GET /articles/:id
 * - With Kamal prefix: GET /company-be/api/articles, GET /company-be/api/articles/:id
 * - Proxy strips prefix automatically
 *
 * MANUAL OVERRIDE OPTIONS:
 *
 * Option 1: Register routes manually in main.ts
 * ```typescript
 * // Comment out: await registerEntityRoutes(app);
 * import userRoutes from "./entities/users/user.route.ts";
 * import postRoutes from "./entities/posts/post.route.ts";
 * app.route("/", userRoutes);
 * app.route("/", postRoutes);
 * ```
 *
 * Option 2: Mix auto-discovery with manual routes
 * ```typescript
 * await registerEntityRoutes(app); // Auto-discover most routes
 *
 * // Add custom routes with different patterns
 * import adminRoutes from "./admin/admin.route.ts";
 * app.route("/admin", adminRoutes);
 * ```
 *
 * Option 3: Add manual routes to this index.ts file
 * ```typescript
 * export async function registerEntityRoutes(app: Hono): Promise<void> {
 *   // Auto-discovery code here...
 *
 *   // Manual additions
 *   const { default: customRoutes } = await import("../custom/routes.ts");
 *   app.route("/custom", customRoutes);
 * }
 * ```
 *
 * REQUIREMENTS FOR AUTO-DISCOVERY:
 * - File must be named *.route.ts
 * - File must export default Hono router
 * - File must be in a subdirectory of entities/
 */
export async function registerEntityRoutes(app: Hono): Promise<void> {
  try {
    // Get the directory path where this index.ts file is located
    const entitiesURL = new URL(".", import.meta.url);
    const entitiesPath = entitiesURL.pathname;

    // Get all directories in entities folder
    const entries = [];
    try {
      for await (const entry of Deno.readDir(entitiesPath)) {
        if (entry.isDirectory) {
          entries.push(entry);
        }
      }
    } catch (error) {
      // No entities directory or it's empty
      console.log(`   - No entity directories found at: ${entitiesPath}`);
      console.log(
        `   - Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return;
    }

    if (entries.length === 0) {
      console.log("   - No entity subdirectories found");
      return;
    }

    // Import and register routes from each entity directory
    for (const entry of entries) {
      // Fix path concatenation - ensure proper separator
      const entityPath = entitiesPath.endsWith("/")
        ? `${entitiesPath}${entry.name}`
        : `${entitiesPath}/${entry.name}`;

      // Look for .route.ts file in the entity directory
      try {
        for await (const file of Deno.readDir(entityPath)) {
          if (file.name.endsWith(".route.ts")) {
            const routePath = `${entityPath}/${file.name}`;
            const routeModule = await import(`file://${routePath}`);

            if (routeModule.default) {
              app.route("/", routeModule.default);
              console.log(
                `   [OK] Registered routes from ${entry.name}/${file.name}`,
              );
            }
          }
        }
      } catch (_error) {
        // Skip if entity directory doesn't exist or has no route file
        console.log(`   - Skipped ${entry.name} (no route file)`);
      }
    }
  } catch (error) {
    console.error("Failed to auto-register entity routes:", error);
  }
}
