import { assertEquals, assertExists } from "@std/assert";
import { join } from "@std/path";
import { exists } from "@std/fs";
import { createProject } from "./create.ts";
import { cleanupTempDir, createTempDir } from "../../tests/helpers/tempDir.ts";
import { fileExists } from "../utils/fileWriter.ts";
import { closeKv, deleteProject, getProject } from "../utils/projectStore.ts";

// Admin UI project creation tests

Deno.test("createProject - admin-ui: creates project directory with correct suffix", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-admin",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "test-admin-admin-ui");
    const stat = await Deno.stat(projectPath);
    assertEquals(stat.isDirectory, true);
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("test-admin-admin-ui").catch(() => {});
    closeKv();
  }
});

Deno.test("createProject - admin-ui: copies all starter files", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-admin",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "test-admin-admin-ui");

    // Check key files exist
    assertEquals(await fileExists(join(projectPath, "deno.json")), true);
    assertEquals(await fileExists(join(projectPath, ".env.example")), true);
    assertEquals(await fileExists(join(projectPath, "main.ts")), true);
    assertEquals(
      await fileExists(join(projectPath, "tailwind.config.ts")),
      true,
    );
    assertEquals(await fileExists(join(projectPath, "vite.config.ts")), true);

    // Check key directories
    assertEquals(
      await exists(join(projectPath, "components"), { isDirectory: true }),
      true,
    );
    assertEquals(
      await exists(join(projectPath, "islands"), { isDirectory: true }),
      true,
    );
    assertEquals(
      await exists(join(projectPath, "routes"), { isDirectory: true }),
      true,
    );
    assertEquals(
      await exists(join(projectPath, "static"), { isDirectory: true }),
      true,
    );
    assertEquals(
      await exists(join(projectPath, "lib"), { isDirectory: true }),
      true,
    );
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("test-admin-admin-ui").catch(() => {});
    closeKv();
  }
});

Deno.test("createProject - admin-ui: creates .env from .env.example", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-admin",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "test-admin-admin-ui");
    const envPath = join(projectPath, ".env");

    assertEquals(await fileExists(envPath), true);

    const envContent = await Deno.readTextFile(envPath);
    assertEquals(envContent.length > 0, true);
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("test-admin-admin-ui").catch(() => {});
    closeKv();
  }
});

Deno.test("createProject - admin-ui: deno.json has required Fresh imports", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-admin",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "test-admin-admin-ui");
    const denoJsonPath = join(projectPath, "deno.json");
    const denoJsonContent = await Deno.readTextFile(denoJsonPath);
    const denoJson = JSON.parse(denoJsonContent);

    // Check Fresh and UI-specific imports
    assertExists(denoJson.imports["fresh"], "Should have Fresh import");
    assertExists(denoJson.imports["preact"], "Should have Preact import");
    assertExists(
      denoJson.imports["tailwindcss"],
      "Should have Tailwind import",
    );
    assertExists(denoJson.imports["daisyui"], "Should have DaisyUI import");
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("test-admin-admin-ui").catch(() => {});
    closeKv();
  }
});

Deno.test("createProject - admin-ui: deno.json has required tasks", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-admin",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "test-admin-admin-ui");
    const denoJsonPath = join(projectPath, "deno.json");
    const denoJsonContent = await Deno.readTextFile(denoJsonPath);
    const denoJson = JSON.parse(denoJsonContent);

    // Check required tasks
    assertExists(denoJson.tasks.dev, "Should have dev task");
    assertExists(denoJson.tasks.build, "Should have build task");
    assertExists(denoJson.tasks.start, "Should have start task");
    assertExists(denoJson.tasks.check, "Should have check task");
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("test-admin-admin-ui").catch(() => {});
    closeKv();
  }
});

Deno.test("createProject - admin-ui: metadata stored without databases", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-admin",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const metadata = await getProject("test-admin-admin-ui");

    assertExists(metadata, "Project metadata should exist in KV store");
    assertEquals(metadata!.name, "test-admin", "Should store original name");
    assertEquals(metadata!.type, "admin-ui", "Should store project type");
    assertEquals(
      metadata!.folderName,
      "test-admin-admin-ui",
      "Should store folder name with suffix",
    );
    assertEquals(
      metadata!.databases,
      undefined,
      "Admin UI should not have databases",
    );
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("test-admin-admin-ui").catch(() => {});
    closeKv();
  }
});

Deno.test("createProject - admin-ui: should not duplicate suffix if already present", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "dashboard-admin-ui",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    // Should use the name as-is without adding another suffix
    const expectedPath = join(tempDir, "dashboard-admin-ui");
    const folderExists = await exists(expectedPath, { isDirectory: true });

    assertEquals(folderExists, true, "Should not duplicate -admin-ui suffix");

    const metadata = await getProject("dashboard-admin-ui");
    assertEquals(
      metadata!.folderName,
      "dashboard-admin-ui",
      "Should use name as-is",
    );
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("dashboard-admin-ui").catch(() => {});
    closeKv();
  }
});

Deno.test("createProject - admin-ui: has Fresh route structure", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-admin",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "test-admin-admin-ui");

    // Check Fresh route structure
    assertEquals(
      await fileExists(join(projectPath, "routes", "_app.tsx")),
      true,
    );
    assertEquals(
      await fileExists(join(projectPath, "routes", "index.tsx")),
      true,
    );
    assertEquals(
      await exists(join(projectPath, "routes", "admin"), { isDirectory: true }),
      true,
    );
    assertEquals(
      await exists(join(projectPath, "routes", "auth"), { isDirectory: true }),
      true,
    );
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("test-admin-admin-ui").catch(() => {});
    closeKv();
  }
});

Deno.test("createProject - admin-ui: has admin components", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-admin",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "test-admin-admin-ui");

    // Check admin components exist
    assertEquals(
      await exists(join(projectPath, "components", "admin"), {
        isDirectory: true,
      }),
      true,
      "Should have admin components directory",
    );
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("test-admin-admin-ui").catch(() => {});
    closeKv();
  }
});

// --latest flag tests for Admin UI

Deno.test({
  name: "createProject - admin-ui: --latest flag updates dependencies",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    try {
      await createProject({
        projectName: "test-latest-ui",
        projectType: "admin-ui",
        targetDir: tempDir,
        skipDbSetup: true,
        latest: true,
      });

      const projectPath = join(tempDir, "test-latest-ui-admin-ui");
      const denoJsonPath = join(projectPath, "deno.json");

      const denoJsonContent = await Deno.readTextFile(denoJsonPath);
      const denoJson = JSON.parse(denoJsonContent);

      // Verify imports exist (versions will be latest)
      assertExists(denoJson.imports["fresh"], "Should have Fresh import");
      assertExists(denoJson.imports["preact"], "Should have Preact import");
      assertExists(
        denoJson.imports["tailwindcss"],
        "Should have Tailwind import",
      );
      assertExists(denoJson.imports["daisyui"], "Should have DaisyUI import");

      // Version numbers should be updated
      const freshImport = denoJson.imports["fresh"];
      assertEquals(
        freshImport.includes("jsr:@fresh/core@^"),
        true,
        "Should have JSR Fresh import with version",
      );
    } finally {
      await cleanupTempDir(tempDir);
      await deleteProject("test-latest-ui-admin-ui").catch(() => {});
      closeKv();
    }
  },
});

Deno.test("createProject - admin-ui: without --latest uses template versions", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-default-ui",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
      latest: false, // Explicitly false
    });

    const projectPath = join(tempDir, "test-default-ui-admin-ui");
    const denoJsonPath = join(projectPath, "deno.json");

    const denoJsonContent = await Deno.readTextFile(denoJsonPath);
    const denoJson = JSON.parse(denoJsonContent);

    // Should still have imports (from template)
    assertExists(denoJson.imports["fresh"], "Should have Fresh import");
    assertExists(denoJson.imports["preact"], "Should have Preact import");
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("test-default-ui-admin-ui").catch(() => {});
    closeKv();
  }
});

// Edge cases and error scenarios

Deno.test("createProject - admin-ui: handles project names with hyphens", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "my-cool-admin",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "my-cool-admin-admin-ui");
    const folderExists = await exists(projectPath, { isDirectory: true });
    assertEquals(folderExists, true);
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("my-cool-admin-admin-ui").catch(() => {});
    closeKv();
  }
});

Deno.test("createProject - admin-ui: handles project names with underscores", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "my_admin_ui",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "my_admin_ui-admin-ui");
    const folderExists = await exists(projectPath, { isDirectory: true });
    assertEquals(folderExists, true);
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("my_admin_ui-admin-ui").catch(() => {});
    closeKv();
  }
});

Deno.test("createProject - admin-ui: allows recreation with forceOverwrite", async () => {
  const tempDir = await createTempDir();
  try {
    // Create first project
    await createProject({
      projectName: "test-overwrite",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const firstProject = await getProject("test-overwrite-admin-ui");
    const firstCreatedAt = firstProject?.createdAt;

    // Wait a bit to ensure timestamps differ
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Recreate with forceOverwrite
    await createProject({
      projectName: "test-overwrite",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
      forceOverwrite: true,
    });

    const recreatedProject = await getProject("test-overwrite-admin-ui");
    assertExists(recreatedProject, "Recreated project should be tracked");
    assertEquals(
      recreatedProject?.createdAt,
      firstCreatedAt,
      "createdAt should be preserved",
    );
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("test-overwrite-admin-ui").catch(() => {});
    closeKv();
  }
});

Deno.test("createProject - both types can coexist with same base name", async () => {
  const tempDir = await createTempDir();
  try {
    // Create API project
    await createProject({
      projectName: "myapp",
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    // Create Admin UI project with same base name
    await createProject({
      projectName: "myapp",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    // Both should exist
    const apiPath = join(tempDir, "myapp-api");
    const adminPath = join(tempDir, "myapp-admin-ui");

    assertEquals(
      await exists(apiPath, { isDirectory: true }),
      true,
      "API project should exist",
    );
    assertEquals(
      await exists(adminPath, { isDirectory: true }),
      true,
      "Admin UI project should exist",
    );

    // Both should be tracked separately
    const apiMetadata = await getProject("myapp-api");
    const adminMetadata = await getProject("myapp-admin-ui");

    assertExists(apiMetadata, "API project should be tracked");
    assertExists(adminMetadata, "Admin UI project should be tracked");
    assertEquals(apiMetadata!.type, "api");
    assertEquals(adminMetadata!.type, "admin-ui");
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("myapp-api").catch(() => {});
    await deleteProject("myapp-admin-ui").catch(() => {});
    closeKv();
  }
});
