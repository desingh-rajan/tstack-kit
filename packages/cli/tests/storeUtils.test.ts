/// <reference lib="deno.unstable" />

/**
 * KV Store Unit Tests
 *
 * Dedicated tests for projectStore, workspaceStore, and scaffoldStore.
 * Previously these stores were only tested indirectly via command integration tests.
 */

import { assertEquals, assertRejects } from "@std/assert";
import {
  closeKv as closeProjectKv,
  deleteProject,
  getProject,
  getProjectByNameAndType,
  saveProject,
} from "../src/utils/projectStore.ts";
import {
  closeKv as closeWorkspaceKv,
  deleteWorkspace,
  getWorkspace,
  saveWorkspace,
  updateWorkspace,
} from "../src/utils/workspaceStore.ts";
import {
  closeKv as closeScaffoldKv,
  deleteScaffold,
  getScaffold,
  saveScaffold,
} from "../src/utils/scaffoldStore.ts";
import { cleanupTestKv, getTestKvPath, initTestKv } from "./helpers/testKv.ts";

// All tests use the shared test KV path
const kvPath = getTestKvPath();

Deno.test({
  name: "KV Store Tests",
  async fn(t) {
    // Setup
    await initTestKv();

    await t.step(
      "projectStore - getProjectByNameAndType passes kvPath through to getProject",
      async () => {
        // Save a project using the test KV path
        await saveProject(
          {
            name: "test-store-project",
            type: "api",
            folderName: "test-store-project-api",
            path: "/tmp/test-store-project-api",
            status: "created",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          kvPath,
        );

        // Retrieve by name+type -- this previously dropped kvPath
        const project = await getProjectByNameAndType(
          "test-store-project",
          "api",
          kvPath,
        );

        assertEquals(project !== null, true, "Project should be found");
        assertEquals(project!.name, "test-store-project");
        assertEquals(project!.type, "api");
        assertEquals(project!.folderName, "test-store-project-api");

        // Also verify direct get works
        const direct = await getProject("test-store-project-api", kvPath);
        assertEquals(direct !== null, true);
        assertEquals(direct!.name, project!.name);

        // Cleanup
        await deleteProject("test-store-project-api", kvPath);
        closeProjectKv();
      },
    );

    await t.step(
      "workspaceStore - save and retrieve workspace with kvPath",
      async () => {
        const now = new Date();

        await saveWorkspace(
          {
            name: "test-ws",
            path: "/tmp/test-ws",
            namespace: "test-ws",
            status: "created",
            githubRepos: [],
            projects: [],
            components: {
              api: true,
              adminUi: false,
              store: false,
              ui: false,
              infra: false,
              mobile: false,
            },
            createdAt: now,
            updatedAt: now,
          },
          kvPath,
        );

        const ws = await getWorkspace("test-ws", kvPath);
        assertEquals(ws !== null, true, "Workspace should be found");
        assertEquals(ws!.name, "test-ws");
        assertEquals(ws!.status, "created");

        // Cleanup
        await deleteWorkspace("test-ws", kvPath);
        closeWorkspaceKv();
      },
    );

    await t.step(
      "workspaceStore - updateWorkspace uses OCC (atomic check)",
      async () => {
        const now = new Date();

        await saveWorkspace(
          {
            name: "test-ws-occ",
            path: "/tmp/test-ws-occ",
            namespace: "test-ws-occ",
            status: "created",
            githubRepos: [],
            projects: [],
            components: {
              api: true,
              adminUi: false,
              store: false,
              ui: false,
              infra: false,
              mobile: false,
            },
            createdAt: now,
            updatedAt: now,
          },
          kvPath,
        );

        // Update the workspace
        await updateWorkspace(
          "test-ws-occ",
          { status: "partial" },
          kvPath,
        );

        const updated = await getWorkspace("test-ws-occ", kvPath);
        assertEquals(updated!.status, "partial");
        // updatedAt should be newer than original
        assertEquals(
          new Date(updated!.updatedAt).getTime() >= now.getTime(),
          true,
          "updatedAt should be >= original time",
        );

        // Cleanup
        await deleteWorkspace("test-ws-occ", kvPath);
        closeWorkspaceKv();
      },
    );

    await t.step(
      "workspaceStore - updateWorkspace throws for non-existent workspace",
      async () => {
        await assertRejects(
          () =>
            updateWorkspace(
              "nonexistent-ws-xyz",
              { status: "partial" },
              kvPath,
            ),
          Error,
          "not found",
        );
        closeWorkspaceKv();
      },
    );

    await t.step(
      "scaffoldStore - save and retrieve scaffold with kvPath",
      async () => {
        await saveScaffold(
          {
            entityName: "articles",
            projectPath: "/tmp/test-project",
            projectName: "test-project-api",
            files: {
              model: "article.model.ts",
              service: "article.service.ts",
              controller: "article.controller.ts",
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          kvPath,
        );

        const scaffold = await getScaffold(
          "test-project-api",
          "articles",
          kvPath,
        );
        assertEquals(scaffold !== null, true, "Scaffold should be found");
        assertEquals(scaffold!.entityName, "articles");
        assertEquals(scaffold!.projectName, "test-project-api");

        // Cleanup
        await deleteScaffold("test-project-api", "articles", kvPath);
        closeScaffoldKv();
      },
    );

    // Final cleanup
    await cleanupTestKv();
  },
});
