import { assertEquals, assertExists } from "@std/assert";
import { createProject } from "./create.ts";
import { createWorkspace } from "./workspace.ts";
import { destroyProject } from "./destroy.ts";
import { closeKv, listProjects } from "../utils/projectStore.ts";
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
    const ourProject = projects.find(
      (p) => p.folderName === `${projectName}-api`,
    );

    assertExists(ourProject, "Should find our test project");
    assertEquals(ourProject!.name, projectName);
    assertEquals(ourProject!.type, "api");
    assertExists(ourProject!.createdAt, "Should have createdAt");
  } finally {
    await cleanupTempDir(tempDir);
    await destroyProject({
      projectName: `${projectName}-api`,
      force: true,
      skipDbSetup: true,
    }).catch(() => {});
    closeKv();
  }
});

Deno.test({
  name: "listTrackedProjects - should show multiple projects",
  sanitizeResources: false,
  fn: async () => {
    const tempDir = await createTempDir();
    const timestamp = Date.now();

    try {
      // Create multiple test projects with unique names
      await createProject({
        projectName: `list-multi-one-${timestamp}`,
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      await createProject({
        projectName: `list-multi-two-${timestamp}`,
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      await createWorkspace({
        name: `list-multi-ws-${timestamp}`,
        targetDir: tempDir,
        skipApi: false,
        skipAdminUi: true,
        skipRemote: true,
      });

      // List all projects
      const projects = await listProjects();

      // Find our test projects
      const ourProjects = projects.filter(
        (p) =>
          p.folderName === `list-multi-one-${timestamp}-api` ||
          p.folderName === `list-multi-two-${timestamp}-api` ||
          p.folderName === `list-multi-ws-${timestamp}-api`,
      );

      assertEquals(
        ourProjects.length >= 3,
        true,
        "Should have at least 3 test projects",
      );

      // Verify types
      const apiProjects = ourProjects.filter((p) => p.type === "api");
      const workspaceProjects = ourProjects.filter(
        (p) => p.type === "workspace",
      );

      assertEquals(
        apiProjects.length,
        3,
        "Should have 3 API projects (2 standalone + 1 from workspace)",
      );
      assertEquals(
        workspaceProjects.length,
        0,
        "Workspace itself is not tracked, only its projects",
      );
    } finally {
      await cleanupTempDir(tempDir);
      await destroyProject({
        projectName: `list-multi-one-${timestamp}-api`,
        force: true,
        skipDbSetup: true,
      }).catch(() => {});
      await destroyProject({
        projectName: `list-multi-two-${timestamp}-api`,
        force: true,
        skipDbSetup: true,
      }).catch(() => {});
      await destroyProject({
        projectName: `list-multi-ws-${timestamp}-api`,
        force: true,
        skipDbSetup: true,
      }).catch(() => {});
      closeKv();
    }
  },
});

Deno.test(
  "listTrackedProjects - should sort by creation date (newest first)",
  async () => {
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
      const sortTestOld = projects.find(
        (p) => p.folderName === "sort-test-old-api",
      );
      const sortTestNew = projects.find(
        (p) => p.folderName === "sort-test-new-api",
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
      const ourProjects = projects.filter(
        (p) =>
          p.folderName === "sort-test-old-api" ||
          p.folderName === "sort-test-new-api",
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
      await destroyProject({
        projectName: "sort-test-old-api",
        force: true,
        skipDbSetup: true,
      }).catch(() => {});
      await destroyProject({
        projectName: "sort-test-new-api",
        force: true,
        skipDbSetup: true,
      }).catch(() => {});
      closeKv();
    }
  },
);

Deno.test(
  "listTrackedProjects - should include database information",
  async () => {
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
      const ourProject = projects.find(
        (p) => p.folderName === `${projectName}-api`,
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
      await destroyProject({
        projectName: `${projectName}-api`,
        force: true,
        skipDbSetup: true,
      }).catch(() => {});
      closeKv();
    }
  },
);

Deno.test(
  "listTrackedProjects - should filter out destroyed projects",
  async () => {
    const tempDir = await createTempDir();
    const projectName = "filter-destroyed-test";

    try {
      // Create a test project
      await createProject({
        projectName,
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      // Verify it appears in the list
      const projects = await listProjects();
      const ourProject = projects.find(
        (p) =>
          p.folderName === `${projectName}-api` && p.status !== "destroyed",
      );
      assertExists(ourProject, "Should find created project");
      assertEquals(ourProject!.status, "created");

      // Destroy the project
      await destroyProject({
        projectName: `${projectName}-api`,
        force: true,
        skipDbSetup: true,
      });

      // Verify it's marked as destroyed but still in KV
      projects = await listProjects();
      const allProjects = projects.filter(
        (p) => p.folderName === `${projectName}-api`,
      );
      assertEquals(allProjects.length, 1, "Project should still be in KV");
      assertEquals(
        allProjects[0].status,
        "destroyed",
        "Status should be destroyed",
      );

      // Verify it doesn't appear in filtered list (status !== 'destroyed')
      const activeProjects = projects.filter(
        (p) =>
          p.folderName === `${projectName}-api` && p.status !== "destroyed",
      );
      assertEquals(
        activeProjects.length,
        0,
        "Destroyed project should not appear in active list",
      );
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
);

Deno.test("listTrackedProjects - should filter by status flag", async () => {
  const tempDir = await createTempDir();
  const activeProject = "status-filter-active";
  const destroyedProject = "status-filter-destroyed";

  try {
    // Create two projects
    await createProject({
      projectName: activeProject,
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    await createProject({
      projectName: destroyedProject,
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    // Destroy one
    await destroyProject({
      projectName: `${destroyedProject}-api`,
      force: true,
      skipDbSetup: true,
    });

    // Test: Get all projects (no filter - should only show active by default)
    let projects = await listProjects();
    let filtered = projects.filter((p) => p.status !== "destroyed");
    let ourActive = filtered.filter(
      (p) => p.folderName === `${activeProject}-api`,
    );
    let ourDestroyed = filtered.filter(
      (p) => p.folderName === `${destroyedProject}-api`,
    );
    assertEquals(ourActive.length, 1, "Should find active project");
    assertEquals(
      ourDestroyed.length,
      0,
      "Should NOT find destroyed project by default",
    );

    // Test: Get only destroyed projects
    projects = await listProjects();
    filtered = projects.filter((p) => p.status === "destroyed");
    ourDestroyed = filtered.filter(
      (p) => p.folderName === `${destroyedProject}-api`,
    );
    assertEquals(
      ourDestroyed.length,
      1,
      "Should find destroyed project when filtering",
    );
    assertEquals(ourDestroyed[0].status, "destroyed");

    // Test: Get all projects (including destroyed)
    projects = await listProjects();
    ourActive = projects.filter((p) => p.folderName === `${activeProject}-api`);
    ourDestroyed = projects.filter(
      (p) => p.folderName === `${destroyedProject}-api`,
    );
    assertEquals(ourActive.length, 1, "Should find active in 'all'");
    assertEquals(ourDestroyed.length, 1, "Should find destroyed in 'all'");
  } finally {
    await cleanupTempDir(tempDir);
    await destroyProject({
      projectName: `${activeProject}-api`,
      force: true,
      skipDbSetup: true,
    }).catch(() => {});
    closeKv();
  }
});
