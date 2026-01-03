import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { createWorkspace, destroyWorkspace } from "./workspace.ts";
import { closeKv, getWorkspace } from "../utils/workspaceStore.ts";
import { cleanupTempDir, createTempDir } from "../../tests/helpers/tempDir.ts";
import { cleanupTestDatabases } from "../../scripts/cleanup-test-dbs.ts";

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
  name:
    "createWorkspace - creates workspace with default components (api + admin-ui)",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        skipRemote: true, // Local only
      });

      // Verify workspace metadata
      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace!.name, workspaceName);
      assertEquals(workspace!.components.api, true);
      assertEquals(workspace!.components.adminUi, true);
      assertEquals(workspace!.components.store, true);
      assertEquals(workspace!.projects.length, 3); // api + admin-ui + store

      // Verify folders exist
      const workspacePath = join(tempDir, workspaceName);
      const apiPath = join(workspacePath, `${workspaceName}-api`);
      const adminUiPath = join(workspacePath, `${workspaceName}-admin-ui`);
      const storePath = join(workspacePath, `${workspaceName}-store`);

      assertEquals(
        await Deno.stat(workspacePath)
          .then(() => true)
          .catch(() => false),
        true,
      );
      assertEquals(
        await Deno.stat(apiPath)
          .then(() => true)
          .catch(() => false),
        true,
      );
      assertEquals(
        await Deno.stat(adminUiPath)
          .then(() => true)
          .catch(() => false),
        true,
      );
      assertEquals(
        await Deno.stat(storePath)
          .then(() => true)
          .catch(() => false),
        true,
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
  name:
    "createWorkspace - shows local-only warning when no github-org specified",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = "test-local-warning";

    try {
      // Create workspace without github-org (should show warning)
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        // No githubOrg, no skipRemote - should warn about local-only
      });

      // Verify workspace created locally
      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace!.githubRepos.length, 0); // No GitHub repos

      // Verify both components created by default
      assertEquals(workspace!.components.api, true);
      assertEquals(workspace!.components.adminUi, true);

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
  name:
    "createWorkspace - throws error when --github-org used without GITHUB_TOKEN",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = "test-no-token";

    // Temporarily unset GITHUB_TOKEN
    const originalToken = Deno.env.get("GITHUB_TOKEN");
    Deno.env.delete("GITHUB_TOKEN");

    try {
      await assertRejects(
        async () => {
          await createWorkspace({
            name: workspaceName,
            targetDir: tempDir,
            githubOrg: "some-org",
            // No githubToken provided, GITHUB_TOKEN env var deleted
          });
        },
        Error,
        "GITHUB_TOKEN is required when using --github-org flag",
      );

      // Verify workspace was NOT created
      const workspace = await getWorkspace(workspaceName);
      assertEquals(workspace, null);
    } finally {
      // Restore original token
      if (originalToken) {
        Deno.env.set("GITHUB_TOKEN", originalToken);
      }
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
      assertEquals(workspace!.components.api, true);
      assertEquals(workspace!.components.adminUi, false);
      assertEquals(workspace!.projects.length, 1); // api only

      const apiPath = join(tempDir, workspaceName, `${workspaceName}-api`);
      assertEquals(
        await Deno.stat(apiPath)
          .then(() => true)
          .catch(() => false),
        true,
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
    const workspaceName = generateWorkspaceName();

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        skipAdminUi: true,
        skipRemote: true,
      });

      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace!.components.api, true);
      assertEquals(workspace!.components.adminUi, false);
      assertEquals(workspace!.components.store, true); // store created by default
      assertEquals(workspace!.projects.length, 2); // api + store

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
  name: "createWorkspace - creates workspace with --skip-store",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        skipStore: true,
        skipRemote: true,
      });

      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace!.components.api, true);
      assertEquals(workspace!.components.adminUi, true);
      assertEquals(workspace!.components.store, false);
      assertEquals(workspace!.projects.length, 2); // api + admin-ui

      const workspacePath = join(tempDir, workspaceName);
      const storePath = join(workspacePath, `${workspaceName}-store`);

      assertEquals(
        await Deno.stat(storePath)
          .then(() => true)
          .catch(() => false),
        false,
      ); // Store should NOT exist

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
  name: "createWorkspace - creates workspace with --with-store only",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        withStore: true,
        skipRemote: true,
      });

      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace!.components.store, true);
      assertEquals(workspace!.components.api, false);
      assertEquals(workspace!.components.adminUi, false);
      assertEquals(workspace!.projects.length, 1); // store only

      const workspacePath = join(tempDir, workspaceName);
      const storePath = join(workspacePath, `${workspaceName}-store`);

      assertEquals(
        await Deno.stat(storePath)
          .then(() => true)
          .catch(() => false),
        true,
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
          `Should reject reserved suffix: ${name}`,
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
        true,
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
      assertEquals(workspace!.githubOrg, GITHUB_ORG);
      assertEquals(workspace!.githubRepos.length, 1);

      const apiRepo = workspace!.githubRepos.find((r) => r.type === "api");
      assertExists(apiRepo);
      assertEquals(apiRepo!.name, `${workspaceName}-api`);
      assertEquals(apiRepo!.url.includes(GITHUB_ORG), true);

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
      assertEquals(workspace!.githubRepos.length, 0); // No remote repos

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

Deno.test({
  name: "createWorkspace - creates BOTH api + admin-ui with GitHub org",
  ignore: SKIP_GITHUB,
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      // Create workspace with both api and admin-ui (default)
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        githubOrg: GITHUB_ORG, // Should create 2 repos
      });

      // Verify workspace metadata
      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace!.components.api, true);
      assertEquals(workspace!.components.adminUi, true);
      assertEquals(workspace!.githubOrg, GITHUB_ORG);
      assertEquals(workspace!.githubRepos.length, 2); // api + admin-ui

      // Verify both repos exist in metadata
      const apiRepo = workspace!.githubRepos.find((r) => r.type === "api");
      const adminUiRepo = workspace!.githubRepos.find(
        (r) => r.type === "admin-ui",
      );

      assertExists(apiRepo);
      assertEquals(apiRepo!.name, `${workspaceName}-api`);
      assertEquals(apiRepo!.url.includes(GITHUB_ORG), true);

      assertExists(adminUiRepo);
      assertEquals(adminUiRepo!.name, `${workspaceName}-admin-ui`);
      assertEquals(adminUiRepo!.url.includes(GITHUB_ORG), true);

      // Verify remote URLs configured for both projects
      const apiPath = join(tempDir, workspaceName, `${workspaceName}-api`);
      const adminUiPath = join(
        tempDir,
        workspaceName,
        `${workspaceName}-admin-ui`,
      );

      // Check API remote
      const apiRemoteCmd = new Deno.Command("git", {
        args: ["remote", "get-url", "origin"],
        cwd: apiPath,
        stdout: "piped",
      });
      const apiResult = await apiRemoteCmd.output();
      assertEquals(apiResult.success, true);
      const apiRemoteUrl = new TextDecoder().decode(apiResult.stdout).trim();
      assertEquals(apiRemoteUrl.includes(GITHUB_ORG), true);
      assertEquals(apiRemoteUrl.includes(`${workspaceName}-api`), true);

      // Check Admin UI remote
      const adminRemoteCmd = new Deno.Command("git", {
        args: ["remote", "get-url", "origin"],
        cwd: adminUiPath,
        stdout: "piped",
      });
      const adminResult = await adminRemoteCmd.output();
      assertEquals(adminResult.success, true);
      const adminRemoteUrl = new TextDecoder()
        .decode(adminResult.stdout)
        .trim();
      assertEquals(adminRemoteUrl.includes(GITHUB_ORG), true);
      assertEquals(adminRemoteUrl.includes(`${workspaceName}-admin-ui`), true);

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
  name: "createWorkspace - creates admin-ui only with --with-admin-ui",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = "test-admin-only";

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        withAdminUi: true, // Only admin-ui
        skipRemote: true,
      });

      // Verify workspace metadata
      const workspace = await getWorkspace(workspaceName);
      assertExists(workspace);
      assertEquals(workspace!.name, workspaceName);
      assertEquals(workspace!.components.api, false);
      assertEquals(workspace!.components.adminUi, true);
      assertEquals(workspace!.projects.length, 1); // admin-ui only

      // Verify only admin-ui folder exists
      const workspacePath = join(tempDir, workspaceName);
      const apiPath = join(workspacePath, `${workspaceName}-api`);
      const adminUiPath = join(workspacePath, `${workspaceName}-admin-ui`);

      assertEquals(
        await Deno.stat(apiPath)
          .then(() => true)
          .catch(() => false),
        false,
      ); // API should NOT exist

      assertEquals(
        await Deno.stat(adminUiPath)
          .then(() => true)
          .catch(() => false),
        true,
      ); // Admin UI should exist

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
        true,
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
        false,
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
  name:
    "destroyWorkspace - removes folders when called from different directory (relative path fix)",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = "test-destroy-relative";

    try {
      // Create workspace in tempDir
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        withApi: true,
        skipRemote: true,
      });

      const workspacePath = join(tempDir, workspaceName);
      const apiPath = join(workspacePath, `${workspaceName}-api`);

      // Verify folders exist
      assertEquals(
        await Deno.stat(workspacePath)
          .then(() => true)
          .catch(() => false),
        true,
        "Workspace folder should exist",
      );
      assertEquals(
        await Deno.stat(apiPath)
          .then(() => true)
          .catch(() => false),
        true,
        "API folder should exist",
      );

      // Change to a DIFFERENT directory before destroying
      // This simulates the bug where relative paths fail
      const originalCwd = Deno.cwd();
      const homeDir = Deno.env.get("HOME") || "/tmp";
      Deno.chdir(homeDir);

      try {
        // Destroy from different directory
        await destroyWorkspace({
          name: workspaceName,
          force: true,
          deleteRemote: false,
        });

        // Verify workspace folder is actually removed
        assertEquals(
          await Deno.stat(workspacePath)
            .then(() => true)
            .catch(() => false),
          false,
          "Workspace folder should be removed even when called from different directory",
        );

        // Verify API folder is also removed
        assertEquals(
          await Deno.stat(apiPath)
            .then(() => true)
            .catch(() => false),
          false,
          "API folder should be removed even when called from different directory",
        );

        // Verify metadata removed
        const workspace = await getWorkspace(workspaceName);
        assertEquals(workspace, null);
      } finally {
        // Restore original directory
        Deno.chdir(originalCwd);
      }
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

Deno.test({
  name:
    "destroyWorkspace - destroys workspace with BOTH projects + GitHub repos",
  ignore: SKIP_GITHUB,
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      // Create workspace with both api and admin-ui + GitHub
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        githubOrg: GITHUB_ORG, // Creates 2 repos
      });

      // Verify both repos exist
      const apiCheckCmd = new Deno.Command("gh", {
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
      const apiCheckResult = await apiCheckCmd.output();
      assertEquals(apiCheckResult.success, true);

      const adminCheckCmd = new Deno.Command("gh", {
        args: [
          "repo",
          "view",
          `${GITHUB_ORG}/${workspaceName}-admin-ui`,
          "--json",
          "name",
        ],
        stdout: "piped",
        stderr: "piped",
      });
      const adminCheckResult = await adminCheckCmd.output();
      assertEquals(adminCheckResult.success, true);

      // Destroy workspace with remote deletion
      await destroyWorkspace({
        name: workspaceName,
        force: true,
        deleteRemote: true, // Should delete both repos
      });

      // Verify both repos deleted
      const apiVerifyCmd = new Deno.Command("gh", {
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
      const apiVerifyResult = await apiVerifyCmd.output();
      assertEquals(apiVerifyResult.success, false); // Should fail

      const adminVerifyCmd = new Deno.Command("gh", {
        args: [
          "repo",
          "view",
          `${GITHUB_ORG}/${workspaceName}-admin-ui`,
          "--json",
          "name",
        ],
        stdout: "piped",
        stderr: "piped",
      });
      const adminVerifyResult = await adminVerifyCmd.output();
      assertEquals(adminVerifyResult.success, false); // Should fail

      // Verify metadata removed
      const workspace = await getWorkspace(workspaceName);
      assertEquals(workspace, null);
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

// ============================================================================
// Workspace Scope Tests
// ============================================================================

Deno.test({
  name:
    "createWorkspace - --scope=core creates workspace with core-only API entities",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        skipRemote: true,
        scope: "core",
      });

      const workspacePath = join(tempDir, workspaceName);
      const apiPath = join(workspacePath, `${workspaceName}-api`);
      const entitiesPath = join(apiPath, "src", "entities");

      // Should have core entities
      assertEquals(
        await Deno.stat(join(entitiesPath, "articles"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have articles directory",
      );
      assertEquals(
        await Deno.stat(join(entitiesPath, "site_settings"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have site_settings directory",
      );

      // Should NOT have listing entities
      assertEquals(
        await Deno.stat(join(entitiesPath, "brands"))
          .then(() => true)
          .catch(() => false),
        false,
        "Should not have brands directory",
      );
      assertEquals(
        await Deno.stat(join(entitiesPath, "products"))
          .then(() => true)
          .catch(() => false),
        false,
        "Should not have products directory",
      );

      // Should NOT have commerce entities
      assertEquals(
        await Deno.stat(join(entitiesPath, "carts"))
          .then(() => true)
          .catch(() => false),
        false,
        "Should not have carts directory",
      );
      assertEquals(
        await Deno.stat(join(entitiesPath, "orders"))
          .then(() => true)
          .catch(() => false),
        false,
        "Should not have orders directory",
      );
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

Deno.test({
  name:
    "createWorkspace - --scope=listing creates workspace with listing entities (no commerce)",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        skipRemote: true,
        scope: "listing",
      });

      const workspacePath = join(tempDir, workspaceName);
      const apiPath = join(workspacePath, `${workspaceName}-api`);
      const entitiesPath = join(apiPath, "src", "entities");

      // Should have core entities
      assertEquals(
        await Deno.stat(join(entitiesPath, "articles"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have articles directory",
      );

      // Should have listing entities
      assertEquals(
        await Deno.stat(join(entitiesPath, "brands"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have brands directory",
      );
      assertEquals(
        await Deno.stat(join(entitiesPath, "products"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have products directory",
      );
      assertEquals(
        await Deno.stat(join(entitiesPath, "categories"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have categories directory",
      );

      // Should NOT have commerce entities
      assertEquals(
        await Deno.stat(join(entitiesPath, "carts"))
          .then(() => true)
          .catch(() => false),
        false,
        "Should not have carts directory",
      );
      assertEquals(
        await Deno.stat(join(entitiesPath, "orders"))
          .then(() => true)
          .catch(() => false),
        false,
        "Should not have orders directory",
      );
      assertEquals(
        await Deno.stat(join(entitiesPath, "payments"))
          .then(() => true)
          .catch(() => false),
        false,
        "Should not have payments directory",
      );
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
    }
  },
});

Deno.test({
  name:
    "createWorkspace - --scope=commerce creates workspace with all entities (default)",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const workspaceName = generateWorkspaceName();

    try {
      await createWorkspace({
        name: workspaceName,
        targetDir: tempDir,
        skipRemote: true,
        scope: "commerce",
      });

      const workspacePath = join(tempDir, workspaceName);
      const apiPath = join(workspacePath, `${workspaceName}-api`);
      const entitiesPath = join(apiPath, "src", "entities");

      // Should have core entities
      assertEquals(
        await Deno.stat(join(entitiesPath, "articles"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have articles directory",
      );

      // Should have listing entities
      assertEquals(
        await Deno.stat(join(entitiesPath, "brands"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have brands directory",
      );
      assertEquals(
        await Deno.stat(join(entitiesPath, "products"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have products directory",
      );

      // Should have commerce entities
      assertEquals(
        await Deno.stat(join(entitiesPath, "carts"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have carts directory",
      );
      assertEquals(
        await Deno.stat(join(entitiesPath, "orders"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have orders directory",
      );
      assertEquals(
        await Deno.stat(join(entitiesPath, "payments"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have payments directory",
      );
      assertEquals(
        await Deno.stat(join(entitiesPath, "addresses"))
          .then(() => true)
          .catch(() => false),
        true,
        "Should have addresses directory",
      );
    } finally {
      await cleanupTempDir(tempDir);
      closeKv();
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

// ============================================================================
// Database Cleanup (Always runs at the end)
// ============================================================================

Deno.test({
  name: "CLEANUP - Remove all test databases",
  sanitizeResources: false,
  async fn() {
    const result = await cleanupTestDatabases();
    if (result.success > 0) {
      console.log(`[CLEANUP] Dropped ${result.success} test database(s)`);
    }
    if (result.failed > 0) {
      console.log(`[CLEANUP] Failed to drop ${result.failed} database(s)`);
    }
    closeKv();
  },
});
