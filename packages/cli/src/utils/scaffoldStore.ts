/// <reference lib="deno.unstable" />

/**
 * Scaffold tracking using Deno KV
 * Tracks every entity scaffolded, its files, and migrations
 */

export interface ScaffoldMetadata {
  entityName: string; // e.g., "articles"
  projectPath: string; // Absolute path to project
  projectName: string; // e.g., "foo-bar-shop-api"
  files: {
    model?: string;
    dto?: string;
    service?: string;
    controller?: string;
    route?: string;
    adminRoute?: string;
    test?: string;
    adminTest?: string;
    migration?: string;
  };
  createdAt: number;
  updatedAt: number;
}

let kv: Deno.Kv | null = null;

/**
 * Get or initialize the KV store (shared with projectStore)
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
 * Save scaffold metadata
 */
export async function saveScaffold(
  metadata: ScaffoldMetadata,
): Promise<void> {
  const db = await getKv();

  // Save by project + entity name
  await db.set(
    ["scaffolds", metadata.projectName, metadata.entityName],
    metadata,
  );
}

/**
 * Get scaffold metadata
 */
export async function getScaffold(
  projectName: string,
  entityName: string,
): Promise<ScaffoldMetadata | null> {
  const db = await getKv();
  const result = await db.get<ScaffoldMetadata>([
    "scaffolds",
    projectName,
    entityName,
  ]);
  return result.value;
}

/**
 * List all scaffolds for a project
 */
export async function listScaffolds(
  projectName: string,
): Promise<ScaffoldMetadata[]> {
  const db = await getKv();
  const scaffolds: ScaffoldMetadata[] = [];

  const entries = db.list<ScaffoldMetadata>({
    prefix: ["scaffolds", projectName],
  });

  for await (const entry of entries) {
    if (entry.value) {
      scaffolds.push(entry.value);
    }
  }

  return scaffolds.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Delete scaffold metadata
 */
export async function deleteScaffold(
  projectName: string,
  entityName: string,
): Promise<void> {
  const db = await getKv();
  await db.delete(["scaffolds", projectName, entityName]);
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
