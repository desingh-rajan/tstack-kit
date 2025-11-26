import {
  type ScaffoldOptions,
  ScaffoldOrchestrator,
} from "./scaffolders/scaffold-orchestrator.ts";

/**
 * Scaffold entity command
 * Creates API and/or Admin-UI files for a new entity
 *
 * @example
 * ```typescript
 * // Default: Create both API and admin-UI (if admin-ui project exists)
 * await scaffoldEntity({ entityName: "products" });
 *
 * // Skip admin-UI scaffolding
 * await scaffoldEntity({ entityName: "products", skipAdminUi: true });
 *
 * // Only API files
 * await scaffoldEntity({ entityName: "products", onlyApi: true });
 *
 * // Only admin-UI files (for existing API)
 * await scaffoldEntity({ entityName: "products", onlyAdminUi: true });
 * ```
 */
export async function scaffoldEntity(options: ScaffoldOptions): Promise<void> {
  const orchestrator = new ScaffoldOrchestrator(options);
  await orchestrator.execute();
}

// Export types for external use
export type { ScaffoldOptions };
