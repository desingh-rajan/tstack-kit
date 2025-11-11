import { join } from "@std/path";
import { ensureDir } from "@std/fs";

/**
 * Create a temporary directory for testing
 * Returns the path to the temp directory
 */
export async function createTempDir(): Promise<string> {
  const tempDir = await Deno.makeTempDir({
    prefix: "tstack-test-",
  });
  return tempDir;
}

/**
 * Clean up a temporary directory
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await Deno.remove(dir, { recursive: true });
  } catch {
    // Ignore errors if directory doesn't exist
  }
}

/**
 * Create a test file with content in a temp directory
 */
export async function createTestFile(
  dir: string,
  path: string,
  content: string,
): Promise<string> {
  const filePath = join(dir, path);
  const dirPath = join(dir, ...path.split("/").slice(0, -1));

  await ensureDir(dirPath);
  await Deno.writeTextFile(filePath, content);

  return filePath;
}

/**
 * Read a test file from temp directory
 */
export async function readTestFile(
  dir: string,
  path: string,
): Promise<string> {
  const filePath = join(dir, path);
  return await Deno.readTextFile(filePath);
}

/**
 * Check if a file exists in temp directory
 */
export async function fileExists(
  dir: string,
  path: string,
): Promise<boolean> {
  try {
    const filePath = join(dir, path);
    const stat = await Deno.stat(filePath);
    return stat.isFile;
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists in temp directory
 */
export async function dirExists(
  dir: string,
  path: string,
): Promise<boolean> {
  try {
    const dirPath = join(dir, path);
    const stat = await Deno.stat(dirPath);
    return stat.isDirectory;
  } catch {
    return false;
  }
}

/**
 * List files in a directory (recursively)
 */
export async function listFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  for await (const entry of Deno.readDir(dir)) {
    const fullPath = join(dir, entry.name);
    if (entry.isFile) {
      files.push(entry.name);
    } else if (entry.isDirectory) {
      const subFiles = await listFiles(fullPath);
      files.push(...subFiles.map((f) => join(entry.name, f)));
    }
  }

  return files.sort();
}
