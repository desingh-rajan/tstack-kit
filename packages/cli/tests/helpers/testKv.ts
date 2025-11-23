/**
 * Test KV store utilities
 * Provides isolated KV store for testing
 */

/**
 * Get the test KV store path (isolated from production)
 */
export function getTestKvPath(): string {
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "";
  if (!homeDir) {
    throw new Error("Could not determine home directory");
  }

  return `${homeDir}/.tstack/projects-test.db`;
}

/**
 * Clean up the test KV store completely
 * Call this after all tests finish
 */
export async function cleanupTestKv(): Promise<void> {
  const testKvPath = getTestKvPath();

  try {
    // Remove the entire test KV database directory
    await Deno.remove(testKvPath, { recursive: true });
  } catch {
    // Database might not exist, that's fine
  }
}

/**
 * Initialize test KV store (ensure directory exists)
 */
export async function initTestKv(): Promise<void> {
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "";
  if (!homeDir) {
    throw new Error("Could not determine home directory");
  }

  try {
    await Deno.mkdir(`${homeDir}/.tstack`, { recursive: true });
  } catch {
    // Directory might already exist
  }
}
