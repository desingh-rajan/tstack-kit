/// <reference lib="deno.unstable" />

/**
 * Workspace tracking using Deno KV
 * Tracks workspaces, their GitHub repos, and sub-projects
 */

export interface WorkspaceMetadata {
  name: string; // e.g., "foo-bar-shop"
  path: string; // Absolute path
  namespace: string; // GitHub org/user
  githubRepos: {
    name: string; // Repo name
    url: string; // Full GitHub URL
    type: "api" | "ui" | "admin" | "infra" | "mobile";
  }[];
  subProjects: {
    name: string; // Local folder name
    path: string; // Absolute path
    type: "api" | "ui" | "admin" | "infra" | "mobile";
    databases?: {
      dev?: string;
      test?: string;
      prod?: string;
    };
  }[];
  createdAt: number;
  updatedAt: number;
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

  return workspaces.sort((a, b) => b.createdAt - a.createdAt);
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
    updatedAt: Date.now(),
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
