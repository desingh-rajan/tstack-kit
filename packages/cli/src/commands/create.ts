import { ApiProjectCreator } from "./creators/api-creator.ts";
import { AdminUiProjectCreator } from "./creators/admin-ui-creator.ts";
import { StoreProjectCreator } from "./creators/store-creator.ts";
import { StatusProjectCreator } from "./creators/status-creator.ts";
import type {
  BaseProjectCreator,
  ProjectScope,
} from "./creators/base-creator.ts";

export interface CreateOptions {
  projectName: string;
  projectType?: "api" | "admin-ui" | "store" | "status" | "workspace";
  targetDir?: string;
  latest?: boolean;
  skipDbSetup?: boolean;
  forceOverwrite?: boolean;
  scope?: ProjectScope; // core | listing | commerce (default: commerce)
  // Legacy flags (still supported)
  skipListing?: boolean;
  skipCommerce?: boolean;
}

/**
 * Main entry point for project creation
 * Delegates to type-specific creator classes
 */
export async function createProject(options: CreateOptions): Promise<void> {
  const projectType = options.projectType || "api";

  // Validate project type
  if (projectType === "workspace") {
    throw new Error(
      'Project type "workspace" should use the workspace command instead',
    );
  }

  // Create options with required projectType
  const baseOptions = { ...options, projectType };

  // Create appropriate creator based on project type
  let creator: BaseProjectCreator;

  switch (projectType) {
    case "api":
      creator = new ApiProjectCreator(baseOptions);
      break;

    case "admin-ui":
      creator = new AdminUiProjectCreator(baseOptions);
      break;

    case "store":
      creator = new StoreProjectCreator(baseOptions);
      break;

    case "status":
      creator = new StatusProjectCreator(baseOptions);
      break;

    default: {
      const _exhaustive: never = projectType;
      throw new Error(`Unknown project type: ${_exhaustive}`);
    }
  }

  // Execute project creation
  await creator.create();
}
