import { assertEquals } from "@std/assert";

/**
 * Assert that a file contains specific content
 */
export async function assertFileContains(
  filePath: string,
  expected: string,
  message?: string,
): Promise<void> {
  const content = await Deno.readTextFile(filePath);
  const contains = content.includes(expected);
  assertEquals(
    contains,
    true,
    message || `File ${filePath} should contain: ${expected}`,
  );
}

/**
 * Assert that a file matches expected content exactly
 */
export async function assertFileEquals(
  filePath: string,
  expected: string,
  message?: string,
): Promise<void> {
  const content = await Deno.readTextFile(filePath);
  assertEquals(content, expected, message);
}

/**
 * Assert that multiple files exist
 */
export async function assertFilesExist(
  files: string[],
  message?: string,
): Promise<void> {
  for (const file of files) {
    try {
      await Deno.stat(file);
    } catch {
      throw new Error(message || `File should exist: ${file}`);
    }
  }
}

/**
 * Assert that a directory structure exists
 */
export async function assertDirectoryStructure(
  baseDir: string,
  expectedPaths: string[],
): Promise<void> {
  for (const path of expectedPaths) {
    const fullPath = `${baseDir}/${path}`;
    try {
      await Deno.stat(fullPath);
    } catch {
      throw new Error(`Expected path not found: ${fullPath}`);
    }
  }
}
