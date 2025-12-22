/// <reference lib="deno.unstable" />

/**
 * Workspace tracking using Deno KV
 * Tracks workspaces, their GitHub repos, and sub-projects
 */

export type WorkspaceStatus =
  | "creating"
  | "created"
  | "destroying"
  | "destroyed";
export type ProjectType =
  | "api"
  | "admin-ui"
  | "store"
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
 */
async function getKv(): Promise<Deno.Kv> {
  if (!kv) {
    const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "";
    if (!homeDir) {
      throw new Error("Could not determine home directory");
    }

    const kvPath = `${homeDir}/.tstack/projects.db`;

    // Ensure .tstack directory exists
    try {
      await Deno.mkdir(`${homeDir}/.tstack`, { recursive: true });
    } catch {
      // Directory might already exist
    }

    kv = await Deno.openKv(kvPath);
  }
  return kv;
}

/**
 * Save workspace metadata
 */
export async function saveWorkspace(
  metadata: WorkspaceMetadata,
): Promise<void> {
  const db = await getKv();
  await db.set(["workspaces", metadata.name], metadata);
}

/**
 * Get workspace metadata
 */
export async function getWorkspace(
  name: string,
): Promise<WorkspaceMetadata | null> {
  const db = await getKv();
  const result = await db.get<WorkspaceMetadata>(["workspaces", name]);
  return result.value;
}

/**
 * List all workspaces
 */
export async function listWorkspaces(): Promise<WorkspaceMetadata[]> {
  const db = await getKv();
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
export async function deleteWorkspace(name: string): Promise<void> {
  const db = await getKv();
  await db.delete(["workspaces", name]);
}

/**
 * Update workspace metadata (e.g., add new repo)
 */
export async function updateWorkspace(
  name: string,
  updates: Partial<WorkspaceMetadata>,
): Promise<void> {
  const db = await getKv();
  const existing = await getWorkspace(name);

  if (!existing) {
    throw new Error(`Workspace ${name} not found`);
  }

  const updated: WorkspaceMetadata = {
    ...existing,
    ...updates,
    updatedAt: new Date(),
  };

  await db.set(["workspaces", name], updated);
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
