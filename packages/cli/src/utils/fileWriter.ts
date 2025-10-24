import { ensureDir } from "@std/fs";
import { dirname, join } from "@std/path";
import { Logger } from "./logger.ts";

export interface FileToWrite {
  path: string;
  content: string;
  description: string;
}

/**
 * Write multiple files to disk
 */
export async function writeFiles(
  baseDir: string,
  files: FileToWrite[],
): Promise<void> {
  for (const file of files) {
    await writeFile(baseDir, file.path, file.content, file.description);
  }
}

/**
 * Write a single file to disk
 */
export async function writeFile(
  baseDir: string,
  relativePath: string,
  content: string,
  description?: string,
): Promise<void> {
  const fullPath = join(baseDir, relativePath);

  // Create parent directories if they don't exist
  const dir = dirname(fullPath);
  await ensureDir(dir);

  // Write the file
  await Deno.writeTextFile(fullPath, content);

  // Log success
  const displayPath = relativePath;
  if (description) {
    Logger.success(`Created ${displayPath} - ${description}`);
  } else {
    Logger.success(`Created ${displayPath}`);
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile;
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists
 */
export async function dirExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch {
    return false;
  }
}

/**
 * Create a directory if it doesn't exist
 */
export async function ensureDirectory(path: string): Promise<void> {
  await ensureDir(path);
}
