/// <reference lib="deno.unstable" />

/**
 * Project tracking using Deno KV
 * Stores metadata about created projects for reliable management
 */

export type ProjectStatus = "creating" | "created" | "destroying" | "destroyed";

export interface ProjectMetadata {
  name: string; // Original name without suffix (e.g., "foo-bar-shop")
  type: "api" | "admin-ui" | "workspace";
  folderName: string; // Actual folder name (e.g., "foo-bar-shop-api")
  path: string; // Absolute path to project
  databases: {
    dev?: string;
    test?: string;
    prod?: string;
  };
  status: ProjectStatus; // Current state of the project
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}

let kv: Deno.Kv | null = null;

/**
 * Get or initialize the KV store
 * Store in user's home directory for global access from any directory
 */
async function getKv(kvPath?: string): Promise<Deno.Kv> {
  if (!kv) {
    const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "";
    if (!homeDir) {
      throw new Error("Could not determine home directory");
    }

    // Use custom path for testing (via env var or parameter), or default production path
    const isTest = Deno.env.get("TSTACK_CLI_TEST") === "true";
    const dbPath = kvPath ||
      (isTest
        ? `${homeDir}/.tstack/projects-test.db`
        : `${homeDir}/.tstack/projects.db`);

    // Ensure .tstack directory exists
    try {
      await Deno.mkdir(`${homeDir}/.tstack`, { recursive: true });
    } catch {
      // Directory might already exist
    }

    kv = await Deno.openKv(dbPath);
  }
  return kv;
}

/**
 * Save project metadata
 */
export async function saveProject(
  metadata: ProjectMetadata,
  kvPath?: string,
): Promise<void> {
  const db = await getKv(kvPath);

  // Save by folder name (primary key)
  await db.set(["projects", metadata.folderName], metadata);

  // Also index by name+type for easy lookup
  await db.set(
    ["projects_by_name", metadata.name, metadata.type],
    metadata.folderName,
  );
}

/**
 * Get project metadata by folder name
 */
export async function getProject(
  folderName: string,
  kvPath?: string,
): Promise<ProjectMetadata | null> {
  const db = await getKv(kvPath);
  const result = await db.get<ProjectMetadata>(["projects", folderName]);
  return result.value;
}

/**
 * Get project by name and type
 */
export async function getProjectByNameAndType(
  name: string,
  type: "api" | "admin-ui" | "workspace",
  kvPath?: string,
): Promise<ProjectMetadata | null> {
  const db = await getKv(kvPath);

  // Get folder name from index
  const indexResult = await db.get<string>([
    "projects_by_name",
    name,
    type,
  ]);

  if (!indexResult.value) return null;

  // Get full metadata
  return getProject(indexResult.value);
}

/**
 * List all tracked projects
 */
export async function listProjects(
  kvPath?: string,
): Promise<ProjectMetadata[]> {
  const db = await getKv(kvPath);
  const projects: ProjectMetadata[] = [];

  const entries = db.list<ProjectMetadata>({ prefix: ["projects"] });

  for await (const entry of entries) {
    if (entry.value) {
      projects.push(entry.value);
    }
  }

  return projects.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Delete project metadata
 */
export async function deleteProject(
  folderName: string,
  kvPath?: string,
): Promise<void> {
  const db = await getKv(kvPath);

  // Get metadata first to clean up index
  const metadata = await getProject(folderName, kvPath);

  if (metadata) {
    // Delete index entry
    await db.delete(["projects_by_name", metadata.name, metadata.type]);
  }

  // Delete main entry
  await db.delete(["projects", folderName]);
}

/**
 * Update project metadata
 */
export async function updateProject(
  folderName: string,
  updates: Partial<ProjectMetadata>,
  kvPath?: string,
): Promise<void> {
  const db = await getKv(kvPath);
  const existing = await getProject(folderName, kvPath);

  if (!existing) {
    throw new Error(`Project ${folderName} not found`);
  }

  const updated: ProjectMetadata = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  await db.set(["projects", folderName], updated);
}

/**
 * Close KV connection (for cleanup)
 */
export function closeKv(): void {
  if (kv) {
    kv.close();
    kv = null;
  }
}
