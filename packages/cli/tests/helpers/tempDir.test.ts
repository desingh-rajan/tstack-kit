import { assertEquals } from "@std/assert";
import {
  cleanupTempDir,
  createTempDir,
  createTestFile,
  dirExists,
  fileExists,
  listFiles,
  readTestFile,
} from "./tempDir.ts";

Deno.test("tempDir - creates and cleans up temp directory", async () => {
  const tempDir = await createTempDir();

  // Should create a directory
  const stat = await Deno.stat(tempDir);
  assertEquals(stat.isDirectory, true);

  // Should contain "tstack-test-" in path
  assertEquals(tempDir.includes("tstack-test-"), true);

  // Cleanup should remove it
  await cleanupTempDir(tempDir);

  let exists = true;
  try {
    await Deno.stat(tempDir);
  } catch {
    exists = false;
  }
  assertEquals(exists, false);
});

Deno.test("tempDir - creates test file with content", async () => {
  const tempDir = await createTempDir();

  try {
    const filePath = await createTestFile(
      tempDir,
      "test.txt",
      "Hello, World!",
    );

    const content = await Deno.readTextFile(filePath);
    assertEquals(content, "Hello, World!");
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("tempDir - creates nested file structure", async () => {
  const tempDir = await createTempDir();

  try {
    await createTestFile(tempDir, "src/utils/helper.ts", "export const x = 1;");

    const content = await readTestFile(tempDir, "src/utils/helper.ts");
    assertEquals(content, "export const x = 1;");
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("tempDir - fileExists checks correctly", async () => {
  const tempDir = await createTempDir();

  try {
    await createTestFile(tempDir, "exists.txt", "content");

    assertEquals(await fileExists(tempDir, "exists.txt"), true);
    assertEquals(await fileExists(tempDir, "not-exists.txt"), false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("tempDir - dirExists checks correctly", async () => {
  const tempDir = await createTempDir();

  try {
    await createTestFile(tempDir, "src/test.ts", "content");

    assertEquals(await dirExists(tempDir, "src"), true);
    assertEquals(await dirExists(tempDir, "not-exists"), false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("tempDir - lists all files recursively", async () => {
  const tempDir = await createTempDir();

  try {
    await createTestFile(tempDir, "file1.txt", "");
    await createTestFile(tempDir, "src/file2.ts", "");
    await createTestFile(tempDir, "src/utils/file3.ts", "");

    const files = await listFiles(tempDir);

    assertEquals(files.length, 3);
    assertEquals(files.includes("file1.txt"), true);
    assertEquals(files.includes("src/file2.ts"), true);
    assertEquals(files.includes("src/utils/file3.ts"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});
