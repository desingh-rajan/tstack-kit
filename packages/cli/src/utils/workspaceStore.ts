/// <reference lib="deno.unstable" />

/**
 * Workspace tracking using Deno KV
 * Tracks workspaces, their GitHub repos, and sub-projects
 */

export type WorkspaceStatus =
  | "creating"
  | "created"
  | "partial"
  | "destroying"
  | "destroyed";
export type ProjectType =
  | "api"
  | "admin-ui"
  | "store"
  | "status"
  | "ui"
  | "infra"
  | "mobile";

export interface WorkspaceMetadata {
  name: string; // e.g., "vega-groups"
  path: string; // Absolute path to workspace root
  namespace: string; // Custom namespace (defaults to workspace name)
  status: WorkspaceStatus; // Lifecycle status
  githubOrg?: string; // GitHub organization name (if using remote)
  githubRepos: {
    name: string; // Repo name (e.g., "vega-groups-api")
    url: string; // Full GitHub URL
    type: ProjectType;
  }[];
  projects: {
    folderName: string; // Local folder name (e.g., "vega-groups-api")
    path: string; // Absolute path
    type: ProjectType;
    projectKey: string; // Reference to project KV store
    addedBy: "workspace-init" | "manual"; // How it was added
    addedAt: Date;
  }[];
  components: {
    api: boolean;
    adminUi: boolean;
    store: boolean;
    status: boolean;
    ui: boolean;
    infra: boolean;
    mobile: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

let kv: Deno.Kv | null = null;

/**
 * Get or initialize the KV store (shared across all stores)
 * Supports test mode via TSTACK_CLI_TEST env var and optional kvPath override.
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
 * Save workspace metadata
 */
export async function saveWorkspace(
  metadata: WorkspaceMetadata,
  kvPath?: string,
): Promise<void> {
  const db = await getKv(kvPath);
  await db.set(["workspaces", metadata.name], metadata);
}

/**
 * Get workspace metadata
 */
export async function getWorkspace(
  name: string,
  kvPath?: string,
): Promise<WorkspaceMetadata | null> {
  const db = await getKv(kvPath);
  const result = await db.get<WorkspaceMetadata>(["workspaces", name]);
  return result.value;
}

/**
 * List all workspaces
 */
export async function listWorkspaces(
  kvPath?: string,
): Promise<WorkspaceMetadata[]> {
  const db = await getKv(kvPath);
  const workspaces: WorkspaceMetadata[] = [];

  const entries = db.list<WorkspaceMetadata>({ prefix: ["workspaces"] });

  for await (const entry of entries) {
    if (entry.value) {
      workspaces.push(entry.value);
    }
  }

  return workspaces.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Delete workspace metadata
 */
export async function deleteWorkspace(
  name: string,
  kvPath?: string,
): Promise<void> {
  const db = await getKv(kvPath);
  await db.delete(["workspaces", name]);
}

/**
 * Update workspace metadata using atomic transactions to prevent race conditions.
 * Uses optimistic concurrency -- retries until the check passes.
 */
export async function updateWorkspace(
  name: string,
  updates: Partial<WorkspaceMetadata>,
  kvPath?: string,
): Promise<void> {
  const db = await getKv(kvPath);
  const key = ["workspaces", name];

  let res = { ok: false };
  while (!res.ok) {
    const entry = await db.get<WorkspaceMetadata>(key);

    if (!entry.value) {
      throw new Error(`Workspace ${name} not found`);
    }

    const updated: WorkspaceMetadata = {
      ...entry.value,
      ...updates,
      updatedAt: new Date(),
    };

    res = await db.atomic()
      .check(entry) // Only commit if entry hasn't changed since we read it
      .set(key, updated)
      .commit();
  }
}

/**
 * Close KV connection
 */
export function closeKv(): void {
  if (kv) {
    kv.close();
    kv = null;
  }
}
