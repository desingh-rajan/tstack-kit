import { assertEquals, assertExists } from "@std/assert";
import { join } from "@std/path";
import { createWorkspace, destroyWorkspace } from "./workspace.ts";
import { closeKv, getWorkspace } from "../utils/workspaceStore.ts";
import { cleanupTempDir, createTempDir } from "../../tests/helpers/tempDir.ts";

// ⚠️ WARNING: VS Code's formatOnSave with Deno formatter can corrupt this file!
// If you see orphaned commas or broken assertEquals() calls, restore from git.
// Workaround: Disable formatOnSave temporarily when editing complex assertions.

// GitHub integration tests are DISABLED by default for fast test runs.
// To enable GitHub integration tests, set: TSTACK_TEST_GITHUB=true
// This requires:
// - GITHUB_TOKEN environment variable
// - GitHub organization: ts-ground
// - gh CLI installed and authenticated
const SKIP_GITHUB = Deno.env.get("TSTACK_TEST_GITHUB") !== "true";

const GITHUB_ORG = "ts-ground";
const TEST_WORKSPACE_PREFIX = "test-ws";

// Helper to generate unique workspace names
function generateWorkspaceName(): string {
  return `${TEST_WORKSPACE_PREFIX}-${Date.now()}`;
}

// Helper to delete GitHub repo
async function deleteGitHubRepo(repoName: string): Promise<void> {
  try {
    const deleteCmd = new Deno.Command("gh", {
      args: ["repo", "delete", `${GITHUB_ORG}/${repoName}`, "--yes"],
      stdout: "piped",
      stderr: "piped",
    });
    await deleteCmd.output();
  } catch {
    // Ignore errors - repo might not exist
  }
}

// ============================================================================
// Basic Workspace Creation Tests (No GitHub)
// ============================================================================

Deno.test({
  name: "createWorkspace - creates workspace with default components (api + admin-ui)",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = "test-default-workspace";

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        skipRemote: true, // Local only
      });

      // Verify workspace metadata
      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace.name, workspaceName);
      assertEquals(workspace.components.api, true);
      assertEquals(workspace.components.adminUi, true);
      assertEquals(workspace.projects.length, 2); // api + admin-ui

      // Verify folders exist
      const workspacePath = join(tempDir, workspaceName);
      const apiPath = join(workspacePath, `${workspaceName}-api`);
      const adminUiPath = join(workspacePath, `${workspaceName}-admin-ui`);

      assertEquals(
        await Deno.stat(workspacePath)
          .then(() => true)
          .catch(() => false),
        true
      );
      assertEquals(
        await Deno.stat(apiPath)
          .then(() => true)
          .catch(() => false),
        true
      );
      assertEquals(
        await Deno.stat(adminUiPath)
          .then(() => true)
          .catch(() => false),
        true
      );

      // Cleanup
      await destroyWorkspace({
        name: workspaceName,
        force: true,
        deleteRemote: false,
      });
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

Deno.test({
  name: "createWorkspace - creates workspace with --with-api only",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = "test-api-only";

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        withApi: true,
        skipRemote: true,
      });

      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace.components.api, true);
      assertEquals(workspace.components.adminUi, false);
      assertEquals(workspace.projects.length, 1); // api only

      const apiPath = join(tempDir, workspaceName, `${workspaceName}-api`);
      assertEquals(
        await Deno.stat(apiPath)
          .then(() => true)
          .catch(() => false),
        true
      );

      await destroyWorkspace({
        name: workspaceName,
        force: true,
        deleteRemote: false,
      });
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

Deno.test({
  name: "createWorkspace - creates workspace with --skip-admin-ui",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = "test-skip-admin";

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        skipAdminUi: true,
        skipRemote: true,
      });

      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace.components.api, true);
      assertEquals(workspace.components.adminUi, false);
      assertEquals(workspace.projects.length, 1); // api only

      await destroyWorkspace({
        name: workspaceName,
        force: true,
        deleteRemote: false,
      });
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

Deno.test({
  name: "createWorkspace - validates workspace name (blocks reserved suffixes)",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const invalidNames = ["myapp-api", "myapp-admin-ui", "myapp-ui"];

    for (const name of invalidNames) {
      let errorThrown = false;
      try {
        await createWorkspace({
          name,
          targetDir: tempDir,
          skipRemote: true,
        });
      } catch (error) {
        errorThrown = true;
        assertEquals(
          (error as Error).message.includes("reserved"),
          true,
          `Should reject reserved suffix: ${name}`
        );
      }
      assertEquals(errorThrown, true, `Should have thrown error for ${name}`);
    }

    await cleanupTempDir(tempDir);
    closeKv();
  },
});

Deno.test({
  name: "createWorkspace - prevents duplicate workspace creation",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = "test-duplicate";

    try {
      // Create first time
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        withApi: true,
        skipRemote: true,
      });

      // Try to create again
      let errorThrown = false;
      try {
        await createWorkspace({
          name: workspaceName,
          targetDir: tempDir,
          withApi: true,
          skipRemote: true,
        });
      } catch (error) {
        errorThrown = true;
        assertEquals((error as Error).message.includes("already exists"), true);
      }
      assertEquals(errorThrown, true);

      await destroyWorkspace({
        name: workspaceName,
        force: true,
        deleteRemote: false,
      });
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

Deno.test({
  name: "createWorkspace - initializes Git in each project",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = "test-git-init";

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        withApi: true,
        skipRemote: true,
      });

      const apiPath = join(tempDir, workspaceName, `${workspaceName}-api`);
      const gitPath = join(apiPath, ".git");

      assertEquals(
        await Deno.stat(gitPath)
          .then(() => true)
          .catch(() => false),
        true
      );

      // Verify initial commit exists
      const logCmd = new Deno.Command("git", {
        args: ["log", "--oneline", "-1"],
        cwd: apiPath,
        stdout: "piped",
      });
      const result = await logCmd.output();
      assertEquals(result.success, true);

      const output = new TextDecoder().decode(result.stdout);
      assertEquals(output.includes("Initial commit"), true);

      await destroyWorkspace({
        name: workspaceName,
        force: true,
        deleteRemote: false,
      });
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

// ============================================================================
// GitHub Integration Tests (Require TONYSTACK_TEST_GITHUB=true)
// ============================================================================

Deno.test({
  name: "createWorkspace - creates remote GitHub repos when org provided",
  ignore: SKIP_GITHUB,
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        withApi: true,
        githubOrg: GITHUB_ORG,
      });

      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace.githubOrg, GITHUB_ORG);
      assertEquals(workspace.githubRepos.length, 1);

      const apiRepo = workspace.githubRepos.find((r) => r.type === "api");
      assertExists(apiRepo);
      assertEquals(apiRepo.name, `${workspaceName}-api`);
      assertEquals(apiRepo.url.includes(GITHUB_ORG), true);

      // Verify remote is configured
      const apiPath = join(tempDir, workspaceName, `${workspaceName}-api`);
      const remoteCmd = new Deno.Command("git", {
        args: ["remote", "get-url", "origin"],
        cwd: apiPath,
        stdout: "piped",
      });
      const result = await remoteCmd.output();
      assertEquals(result.success, true);

      const remoteUrl = new TextDecoder().decode(result.stdout).trim();
      assertEquals(remoteUrl.includes(GITHUB_ORG), true);
      assertEquals(remoteUrl.includes(`${workspaceName}-api`), true);

      // Cleanup
      await destroyWorkspace({
        name: workspaceName,
        force: true,
        deleteRemote: true,
      });
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

Deno.test({
  name: "createWorkspace - skips remote creation with --skip-remote flag",
  ignore: SKIP_GITHUB,
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        withApi: true,
        githubOrg: GITHUB_ORG,
        skipRemote: true, // Should skip remote creation
      });

      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace.githubRepos.length, 0); // No remote repos

      // Verify no remote configured
      const apiPath = join(tempDir, workspaceName, `${workspaceName}-api`);
      const remoteCmd = new Deno.Command("git", {
        args: ["remote", "get-url", "origin"],
        cwd: apiPath,
        stdout: "piped",
        stderr: "piped",
      });
      const result = await remoteCmd.output();
      assertEquals(result.success, false); // Should fail (no remote)

      await destroyWorkspace({
        name: workspaceName,
        force: true,
        deleteRemote: false,
      });
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

Deno.test({
  name: "createWorkspace - pushes initial commit to remote",
  ignore: SKIP_GITHUB,
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        withApi: true,
        githubOrg: GITHUB_ORG,
      });

      // Verify remote branch exists
      const apiPath = join(tempDir, workspaceName, `${workspaceName}-api`);
      const branchCmd = new Deno.Command("git", {
        args: ["branch", "-a"],
        cwd: apiPath,
        stdout: "piped",
      });
      const result = await branchCmd.output();
      const output = new TextDecoder().decode(result.stdout);
      assertEquals(output.includes("remotes/origin/main"), true);

      await destroyWorkspace({
        name: workspaceName,
        force: true,
        deleteRemote: true,
      });
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

// ============================================================================
// Workspace Destroy Tests
// ============================================================================

Deno.test({
  name: "destroyWorkspace - removes all projects and metadata",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = "test-destroy";

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        withApi: true,
        skipRemote: true,
      });

      const workspacePath = join(tempDir, workspaceName);
      assertEquals(
        await Deno.stat(workspacePath)
          .then(() => true)
          .catch(() => false),
        true
      );

      await destroyWorkspace({
        name: workspaceName,
        force: true,
        deleteRemote: false,
      });

      // Verify workspace removed
      assertEquals(
        await Deno.stat(workspacePath)
          .then(() => true)
          .catch(() => false),
        false
      );

      // Verify metadata removed
      const workspace = await getWorkspace(workspaceName);
      assertEquals(workspace, null);
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

Deno.test({
  name: "destroyWorkspace - deletes remote GitHub repos",
  ignore: SKIP_GITHUB,
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        withApi: true,
        githubOrg: GITHUB_ORG,
      });

      // Verify repo exists
      const checkCmd = new Deno.Command("gh", {
        args: [
          "repo",
          "view",
          `${GITHUB_ORG}/${workspaceName}-api`,
          "--json",
          "name",
        ],
        stdout: "piped",
        stderr: "piped",
      });
      const checkResult = await checkCmd.output();
      assertEquals(checkResult.success, true);

      // Destroy with remote deletion
      await destroyWorkspace({
        name: workspaceName,
        force: true,
        deleteRemote: true,
      });

      // Verify repo deleted
      const verifyCmd = new Deno.Command("gh", {
        args: [
          "repo",
          "view",
          `${GITHUB_ORG}/${workspaceName}-api`,
          "--json",
          "name",
        ],
        stdout: "piped",
        stderr: "piped",
      });
      const verifyResult = await verifyCmd.output();
      assertEquals(verifyResult.success, false); // Should fail (repo deleted)
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
      // Extra cleanup in case test failed
      await deleteGitHubRepo(`${workspaceName}-api`);
    }
  },
});

// ============================================================================
// Cleanup Test (Run after all tests)
// ============================================================================

Deno.test({
  name: "CLEANUP - Remove all test workspaces from GitHub",
  ignore: SKIP_GITHUB,
  sanitizeResources: false,
  async fn() {
    // List all repos in ts-ground org
    const listCmd = new Deno.Command("gh", {
      args: ["repo", "list", GITHUB_ORG, "--json", "name", "--limit", "100"],
      stdout: "piped",
    });
    const result = await listCmd.output();
    const repos = JSON.parse(new TextDecoder().decode(result.stdout));

    // Delete repos starting with test-ws-
    for (const repo of repos) {
      if (repo.name.startsWith(TEST_WORKSPACE_PREFIX)) {
        await deleteGitHubRepo(repo.name);
        console.log(`Deleted: ${repo.name}`);
      }
    }

    closeKv();
  },
});
