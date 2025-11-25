import { basename, dirname, join } from "@std/path";
import { dirExists } from "./fileWriter.ts";
import { getProject } from "./projectStore.ts";

/**
 * Information about detected admin-ui project
 */
export interface AdminUiProjectInfo {
  exists: boolean;
  name: string; // e.g., "shop-admin-ui"
  path: string; // absolute path
  relativeFromApi: string; // e.g., "../shop-admin-ui"
}

/**
 * Detect admin-ui project from API project path
 *
 * Strategy:
 * 1. Get base name from API project (remove -api suffix)
 * 2. Check for {baseName}-admin-ui in same directory
 * 3. Verify with KV store for confirmation
 *
 * @param apiProjectPath - Absolute path to API project
 * @returns AdminUiProjectInfo
 */
export async function detectAdminUiProject(
  apiProjectPath: string,
): Promise<AdminUiProjectInfo> {
  // Get directory and project name
  const apiDir = dirname(apiProjectPath);
  const apiName = basename(apiProjectPath);

  // Extract base name (remove -api suffix)
  const baseName = apiName.replace(/-api$/, "");

  // Construct admin-ui project name and path
  const adminUiName = `${baseName}-admin-ui`;
  const adminUiPath = join(apiDir, adminUiName);
  const relativeFromApi = `../${adminUiName}`;

  // Check if directory exists
  const exists = await dirExists(adminUiPath);

  if (!exists) {
    return {
      exists: false,
      name: adminUiName,
      path: adminUiPath,
      relativeFromApi,
    };
  }

  // Verify with KV store
  try {
    const metadata = await getProject(adminUiName);

    if (metadata?.type === "admin-ui") {
      return {
        exists: true,
        name: adminUiName,
        path: adminUiPath,
        relativeFromApi,
      };
    }
  } catch {
    // If KV lookup fails, still return exists=true based on directory
    // This handles edge cases where project exists but isn't tracked
  }

  // Directory exists, assume it's an admin-ui project
  return {
    exists: true,
    name: adminUiName,
    path: adminUiPath,
    relativeFromApi,
  };
}
