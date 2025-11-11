import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import {
  dirExists,
  ensureDirectory,
  fileExists,
  FileToWrite,
  writeFile,
  writeFiles,
} from "./fileWriter.ts";
import { cleanupTempDir, createTempDir } from "../../tests/helpers/tempDir.ts";

Deno.test("fileExists - returns true for existing file", async () => {
  const tempDir = await createTempDir();
  try {
    const testFile = join(tempDir, "test.txt");
    await Deno.writeTextFile(testFile, "test content");

    const exists = await fileExists(testFile);
    assertEquals(exists, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("fileExists - returns false for non-existing file", async () => {
  const tempDir = await createTempDir();
  try {
    const testFile = join(tempDir, "does-not-exist.txt");

    const exists = await fileExists(testFile);
    assertEquals(exists, false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("fileExists - returns false for directory", async () => {
  const tempDir = await createTempDir();
  try {
    const exists = await fileExists(tempDir);
    assertEquals(exists, false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("dirExists - returns true for existing directory", async () => {
  const tempDir = await createTempDir();
  try {
    const exists = await dirExists(tempDir);
    assertEquals(exists, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("dirExists - returns false for non-existing directory", async () => {
  const tempDir = await createTempDir();
  try {
    const testDir = join(tempDir, "does-not-exist");

    const exists = await dirExists(testDir);
    assertEquals(exists, false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("dirExists - returns false for file", async () => {
  const tempDir = await createTempDir();
  try {
    const testFile = join(tempDir, "test.txt");
    await Deno.writeTextFile(testFile, "test content");

    const exists = await dirExists(testFile);
    assertEquals(exists, false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("ensureDirectory - creates new directory", async () => {
  const tempDir = await createTempDir();
  try {
    const newDir = join(tempDir, "new-dir");

    await ensureDirectory(newDir);

    const exists = await dirExists(newDir);
    assertEquals(exists, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("ensureDirectory - creates nested directories", async () => {
  const tempDir = await createTempDir();
  try {
    const nestedDir = join(tempDir, "level1", "level2", "level3");

    await ensureDirectory(nestedDir);

    const exists = await dirExists(nestedDir);
    assertEquals(exists, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("ensureDirectory - does not fail if directory exists", async () => {
  const tempDir = await createTempDir();
  try {
    // Call twice - should not fail second time
    await ensureDirectory(tempDir);
    await ensureDirectory(tempDir);

    const exists = await dirExists(tempDir);
    assertEquals(exists, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("writeFile - creates file with content", async () => {
  const tempDir = await createTempDir();
  try {
    const content = "test content";
    await writeFile(tempDir, "test.txt", content);

    const filePath = join(tempDir, "test.txt");
    const exists = await fileExists(filePath);
    assertEquals(exists, true);

    const written = await Deno.readTextFile(filePath);
    assertEquals(written, content);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("writeFile - creates nested directories", async () => {
  const tempDir = await createTempDir();
  try {
    await writeFile(tempDir, "src/utils/test.ts", "content");

    const filePath = join(tempDir, "src", "utils", "test.ts");
    const exists = await fileExists(filePath);
    assertEquals(exists, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("writeFile - overwrites existing file", async () => {
  const tempDir = await createTempDir();
  try {
    const filePath = join(tempDir, "test.txt");

    await writeFile(tempDir, "test.txt", "original");
    const original = await Deno.readTextFile(filePath);
    assertEquals(original, "original");

    await writeFile(tempDir, "test.txt", "updated");
    const updated = await Deno.readTextFile(filePath);
    assertEquals(updated, "updated");
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("writeFile - handles empty content", async () => {
  const tempDir = await createTempDir();
  try {
    await writeFile(tempDir, "empty.txt", "");

    const filePath = join(tempDir, "empty.txt");
    const exists = await fileExists(filePath);
    assertEquals(exists, true);

    const content = await Deno.readTextFile(filePath);
    assertEquals(content, "");
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("writeFile - handles special characters in content", async () => {
  const tempDir = await createTempDir();
  try {
    const content = "Special: émojis 🚀 and ünïcödé";
    await writeFile(tempDir, "special.txt", content);

    const filePath = join(tempDir, "special.txt");
    const written = await Deno.readTextFile(filePath);
    assertEquals(written, content);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("writeFile - accepts optional description", async () => {
  const tempDir = await createTempDir();
  try {
    // Should not throw
    await writeFile(tempDir, "with-desc.txt", "content", "Test file");
    await writeFile(tempDir, "without-desc.txt", "content");

    const exists1 = await fileExists(join(tempDir, "with-desc.txt"));
    const exists2 = await fileExists(join(tempDir, "without-desc.txt"));
    assertEquals(exists1, true);
    assertEquals(exists2, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("writeFiles - creates multiple files", async () => {
  const tempDir = await createTempDir();
  try {
    const files: FileToWrite[] = [
      {
        path: "file1.txt",
        content: "content 1",
        description: "First file",
      },
      {
        path: "file2.txt",
        content: "content 2",
        description: "Second file",
      },
      {
        path: "src/file3.txt",
        content: "content 3",
        description: "Nested file",
      },
    ];

    await writeFiles(tempDir, files);

    // Check all files exist with correct content
    const file1 = await Deno.readTextFile(join(tempDir, "file1.txt"));
    assertEquals(file1, "content 1");

    const file2 = await Deno.readTextFile(join(tempDir, "file2.txt"));
    assertEquals(file2, "content 2");

    const file3 = await Deno.readTextFile(join(tempDir, "src", "file3.txt"));
    assertEquals(file3, "content 3");
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("writeFiles - handles empty array", async () => {
  const tempDir = await createTempDir();
  try {
    // Should not throw
    await writeFiles(tempDir, []);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("writeFiles - creates files in order", async () => {
  const tempDir = await createTempDir();
  try {
    const files: FileToWrite[] = [
      {
        path: "first.txt",
        content: "1",
        description: "First",
      },
      {
        path: "second.txt",
        content: "2",
        description: "Second",
      },
      {
        path: "third.txt",
        content: "3",
        description: "Third",
      },
    ];

    await writeFiles(tempDir, files);

    // All files should exist
    const exists1 = await fileExists(join(tempDir, "first.txt"));
    const exists2 = await fileExists(join(tempDir, "second.txt"));
    const exists3 = await fileExists(join(tempDir, "third.txt"));
    assertEquals(exists1, true);
    assertEquals(exists2, true);
    assertEquals(exists3, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("writeFiles - handles mixed nested and flat paths", async () => {
  const tempDir = await createTempDir();
  try {
    const files: FileToWrite[] = [
      {
        path: "root.txt",
        content: "root content",
        description: "Root file",
      },
      {
        path: "level1/file.txt",
        content: "level1 content",
        description: "Level 1 file",
      },
      {
        path: "level1/level2/file.txt",
        content: "level2 content",
        description: "Level 2 file",
      },
    ];

    await writeFiles(tempDir, files);

    const content1 = await Deno.readTextFile(join(tempDir, "root.txt"));
    assertEquals(content1, "root content");

    const content2 = await Deno.readTextFile(
      join(tempDir, "level1", "file.txt"),
    );
    assertEquals(content2, "level1 content");

    const content3 = await Deno.readTextFile(
      join(tempDir, "level1", "level2", "file.txt"),
    );
    assertEquals(content3, "level2 content");
  } finally {
    await cleanupTempDir(tempDir);
  }
});
