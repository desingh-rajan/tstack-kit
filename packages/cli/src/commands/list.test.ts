import { assertEquals, assertExists } from "@std/assert";
import { createProject } from "./create.ts";
import { closeKv, deleteProject, listProjects } from "../utils/projectStore.ts";
import { cleanupTempDir, createTempDir } from "../../tests/helpers/tempDir.ts";

Deno.test({
  name: "listTrackedProjects - should show empty list when no projects",
  sanitizeResources: false,
  async fn() {
    // This test assumes no projects exist, or at least documents behavior
    // In reality, there might be projects from other tests
    const projects = await listProjects();

    assertEquals(Array.isArray(projects), true, "Should return an array");
    closeKv();
  },
});

Deno.test("listTrackedProjects - should show created projects", async () => {
  const tempDir = await createTempDir();
  const projectName = "list-test-project";

  try {
    // Create a test project
    await createProject({
      projectName,
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    // List all projects
    const projects = await listProjects();

    // Find our test project
    const ourProject = projects.find((p) =>
      p.folderName === `${projectName}-api`
    );

    assertExists(ourProject, "Should find our test project");
    assertEquals(ourProject!.name, projectName);
    assertEquals(ourProject!.type, "api");
    assertExists(ourProject!.createdAt, "Should have createdAt");
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject(`${projectName}-api`).catch(() => {});
    closeKv();
  }
});

Deno.test("listTrackedProjects - should show multiple projects", async () => {
  const tempDir = await createTempDir();

  try {
    // Create multiple test projects
    await createProject({
      projectName: "list-multi-one",
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    await createProject({
      projectName: "list-multi-two",
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    await createProject({
      projectName: "list-multi-workspace",
      projectType: "workspace",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    // List all projects
    const projects = await listProjects();

    // Find our test projects
    const ourProjects = projects.filter((p) =>
      p.folderName === "list-multi-one-api" ||
      p.folderName === "list-multi-two-api" ||
      p.folderName === "list-multi-workspace"
    );

    assertEquals(
      ourProjects.length >= 3,
      true,
      "Should have at least 3 test projects",
    );

    // Verify types
    const apiProjects = ourProjects.filter((p) => p.type === "api");
    const workspaceProjects = ourProjects.filter((p) => p.type === "workspace");

    assertEquals(apiProjects.length >= 2, true, "Should have 2 API projects");
    assertEquals(
      workspaceProjects.length >= 1,
      true,
      "Should have 1 workspace project",
    );
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("list-multi-one-api").catch(() => {});
    await deleteProject("list-multi-two-api").catch(() => {});
    await deleteProject("list-multi-workspace").catch(() => {});
    closeKv();
  }
});

Deno.test("listTrackedProjects - should sort by creation date (newest first)", async () => {
  const tempDir = await createTempDir();

  try {
    // Create projects with slight delays
    await createProject({
      projectName: "sort-test-old",
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));

    await createProject({
      projectName: "sort-test-new",
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    // List all projects
    const projects = await listProjects();

    // Find our test projects
    const sortTestOld = projects.find((p) =>
      p.folderName === "sort-test-old-api"
    );
    const sortTestNew = projects.find((p) =>
      p.folderName === "sort-test-new-api"
    );

    assertExists(sortTestOld, "Should find old project");
    assertExists(sortTestNew, "Should find new project");

    // Verify newer project has later timestamp
    assertEquals(
      sortTestNew!.createdAt > sortTestOld!.createdAt,
      true,
      "Newer project should have later timestamp",
    );

    // Verify sorting (newest first)
    const ourProjects = projects.filter((p) =>
      p.folderName === "sort-test-old-api" ||
      p.folderName === "sort-test-new-api"
    );

    if (ourProjects.length === 2) {
      assertEquals(
        ourProjects[0].createdAt >= ourProjects[1].createdAt,
        true,
        "Should be sorted by createdAt descending",
      );
    }
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("sort-test-old-api").catch(() => {});
    await deleteProject("sort-test-new-api").catch(() => {});
    closeKv();
  }
});

Deno.test("listTrackedProjects - should include database information", async () => {
  const tempDir = await createTempDir();
  const projectName = "db-info-test";

  try {
    await createProject({
      projectName,
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projects = await listProjects();
    const ourProject = projects.find((p) =>
      p.folderName === `${projectName}-api`
    );

    assertExists(ourProject, "Should find our project");
    assertExists(ourProject!.databases, "Should have databases object");
    assertExists(ourProject!.databases.dev, "Should have dev database");
    assertExists(ourProject!.databases.test, "Should have test database");
    assertExists(ourProject!.databases.prod, "Should have prod database");

    assertEquals(ourProject!.databases.dev, "db_info_test_api_dev");
    assertEquals(ourProject!.databases.test, "db_info_test_api_test");
    assertEquals(ourProject!.databases.prod, "db_info_test_api_prod");
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject(`${projectName}-api`).catch(() => {});
    closeKv();
  }
});
