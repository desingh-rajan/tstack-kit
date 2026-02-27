import { isAbsolute, join, resolve } from "@std/path";
import { Logger } from "../utils/logger.ts";
import { dirExists } from "../utils/fileWriter.ts";
import { createProject } from "./create.ts";
import {
  getWorkspace,
  type ProjectType,
  saveWorkspace,
  updateWorkspace,
  type WorkspaceMetadata,
} from "../utils/workspaceStore.ts";
import { getProject } from "../utils/projectStore.ts";
import type { ProjectScope } from "./creators/base-creator.ts";
import { generateWorkspaceDocker } from "./workspace-docker.ts";
import denoConfig from "../../deno.json" with { type: "json" };

const VERSION = denoConfig.version;

export interface WorkspaceOptions {
  name: string;
  targetDir?: string;
  namespace?: string;

  // Inclusive flags (only create specified components)
  withApi?: boolean;
  withAdminUi?: boolean;
  withStore?: boolean;
  withStatus?: boolean;
  withUi?: boolean;
  withInfra?: boolean;
  withMobile?: boolean;
  withMetrics?: boolean;

  // Exclusive flags (skip specific components, create all others)
  skipApi?: boolean;
  skipAdminUi?: boolean;
  skipStore?: boolean;
  skipStatus?: boolean;
  skipUi?: boolean;
  skipInfra?: boolean;
  skipMobile?: boolean;
  skipMetrics?: boolean;

  // Remote setup options
  skipRemote?: boolean; // Explicitly skip remote setup (local only)
  githubOrg?: string; // If provided, remote setup is automatic unless skipRemote=true
  githubToken?: string;
  visibility?: "private" | "public";

  // Database setup
  skipDbSetup?: boolean; // Skip database creation (useful for tests)

  // Entity scope (API only)
  scope?: ProjectScope; // core | listing | commerce (default: commerce)
  // Legacy flags (still supported)
  skipListing?: boolean;
  skipCommerce?: boolean;
}

// Reserved suffixes that cannot be used as workspace names
const RESERVED_SUFFIXES = [
  "-api",
  "-admin-ui",
  "-status",
  "-ui",
  "-infra",
  "-mobile",
  "-metrics",
];

// Available component types
type ComponentType =
  | "api"
  | "admin-ui"
  | "store"
  | "status"
  | "ui"
  | "infra"
  | "mobile"
  | "metrics";

const AVAILABLE_COMPONENTS: ComponentType[] = [
  "api",
  "admin-ui",
  "store",
  "status",
  // Future components (not yet implemented)
  // "ui",
  // "infra",
  // "mobile",
  // "metrics",
];

/**
 * Validate workspace name
 */
function validateWorkspaceName(name: string): void {
  // Check for reserved suffixes
  for (const suffix of RESERVED_SUFFIXES) {
    if (name.endsWith(suffix)) {
      throw new Error(
        `Workspace name cannot end with '${suffix}' as it's reserved for project types.\n` +
          `Suggestion: Use '${name.replace(suffix, "")}' instead.`,
      );
    }
  }

  // Basic name validation (alphanumeric, hyphens only)
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error(
      "Workspace name must contain only lowercase letters, numbers, and hyphens",
    );
  }

  if (name.startsWith("-") || name.endsWith("-")) {
    throw new Error("Workspace name cannot start or end with a hyphen");
  }
}

/**
 * Determine which components to create based on flags
 * Logic:
 * 1. If any --with-* flag is specified, ONLY create those components
 * 2. If any --skip-* flag is specified, create ALL except skipped ones
 * 3. If no flags, create ALL available components by default
 */
function determineComponents(options: WorkspaceOptions): ComponentType[] {
  const hasWithFlags = options.withApi || options.withAdminUi ||
    options.withStore || options.withStatus ||
    options.withUi || options.withInfra ||
    options.withMobile || options.withMetrics;

  const hasSkipFlags = options.skipApi || options.skipAdminUi ||
    options.skipStore || options.skipStatus ||
    options.skipUi || options.skipInfra ||
    options.skipMobile || options.skipMetrics;

  if (hasWithFlags && hasSkipFlags) {
    throw new Error(
      "Cannot use both --with-* and --skip-* flags together. " +
        "Use --with-* to include specific components, or --skip-* to exclude specific ones.",
    );
  }

  let components: ComponentType[] = [];

  if (hasWithFlags) {
    // Only create specified components
    if (options.withApi) components.push("api");
    if (options.withAdminUi) components.push("admin-ui");
    if (options.withStore) components.push("store");
    if (options.withStatus) components.push("status");
    if (options.withUi) components.push("ui");
    if (options.withInfra) components.push("infra");
    if (options.withMobile) components.push("mobile");
    if (options.withMetrics) components.push("metrics");
  } else if (hasSkipFlags) {
    // Create all except skipped
    components = [...AVAILABLE_COMPONENTS];
    if (options.skipApi) components = components.filter((c) => c !== "api");
    if (options.skipAdminUi) {
      components = components.filter((c) => c !== "admin-ui");
    }
    if (options.skipUi) components = components.filter((c) => c !== "ui");
    if (options.skipInfra) components = components.filter((c) => c !== "infra");
    if (options.skipMobile) {
      components = components.filter((c) => c !== "mobile");
    }
    if (options.skipMetrics) {
      components = components.filter((c) => c !== "metrics");
    }
    if (options.skipStore) {
      components = components.filter((c) => c !== "store");
    }
    if (options.skipStatus) {
      components = components.filter((c) => c !== "status");
    }
  } else {
    // Default: create all available components
    components = [...AVAILABLE_COMPONENTS];
  }

  // Filter to only implemented components
  const implementedComponents = components.filter((c) =>
    c === "api" || c === "admin-ui" || c === "store" || c === "status"
  );

  if (implementedComponents.length === 0) {
    throw new Error(
      "No components selected for creation. " +
        "Currently available: api, admin-ui, store, status. " +
        "Future: ui, infra, mobile, metrics.",
    );
  }

  // Warn about future components
  const futureComponents = components.filter((c) =>
    c !== "api" && c !== "admin-ui" && c !== "store" && c !== "status"
  );
  if (futureComponents.length > 0) {
    Logger.warning(
      `⚠️  Components not yet implemented: ${futureComponents.join(", ")}. ` +
        `Only creating: ${implementedComponents.join(", ")}`,
    );
  }

  return implementedComponents;
}

/**
 * Initialize Git repository for a project
 */
async function initializeGit(
  projectPath: string,
  projectName: string,
): Promise<void> {
  try {
    Logger.info(`  🔧 Initializing Git repository...`);

    // Check if git is already initialized
    const gitDir = join(projectPath, ".git");
    if (await dirExists(gitDir)) {
      Logger.info(`  ℹ️  Git already initialized, skipping`);
      return;
    }

    // Initialize git
    const initCmd = new Deno.Command("git", {
      args: ["init"],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    const initResult = await initCmd.output();

    if (!initResult.success) {
      throw new Error(
        `Git init failed: ${new TextDecoder().decode(initResult.stderr)}`,
      );
    }

    // Set default branch to main
    const branchCmd = new Deno.Command("git", {
      args: ["branch", "-M", "main"],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    await branchCmd.output();

    // Create initial commit
    const addCmd = new Deno.Command("git", {
      args: ["add", "."],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    await addCmd.output();

    const commitCmd = new Deno.Command("git", {
      args: ["commit", "-m", `Initial commit: ${projectName} scaffolding`],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    const commitResult = await commitCmd.output();

    if (!commitResult.success) {
      throw new Error(
        `Git commit failed: ${new TextDecoder().decode(commitResult.stderr)}`,
      );
    }

    // Create staging branch from main
    const stagingCmd = new Deno.Command("git", {
      args: ["checkout", "-b", "staging"],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    const stagingResult = await stagingCmd.output();

    if (!stagingResult.success) {
      throw new Error(
        `Failed to create staging branch: ${
          new TextDecoder().decode(stagingResult.stderr)
        }`,
      );
    }

    // Create dev branch from staging
    const devCmd = new Deno.Command("git", {
      args: ["checkout", "-b", "dev"],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    const devResult = await devCmd.output();

    if (!devResult.success) {
      throw new Error(
        `Failed to create dev branch: ${
          new TextDecoder().decode(devResult.stderr)
        }`,
      );
    }

    // Switch back to main as the default working branch
    const checkoutMainCmd = new Deno.Command("git", {
      args: ["checkout", "main"],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    await checkoutMainCmd.output();

    Logger.success(
      `  ✅ Git initialized with branches: main, staging, dev`,
    );
  } catch (error) {
    Logger.warning(
      `  ⚠️  Failed to initialize Git: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Create remote GitHub repository
 */
async function createRemoteRepo(
  projectName: string,
  projectPath: string,
  options: {
    githubOrg?: string;
    githubToken?: string;
    visibility?: "private" | "public";
    push?: boolean;
  },
): Promise<string | null> {
  const { githubOrg, githubToken, visibility = "public", push = false } =
    options;

  try {
    Logger.info(`  🌐 Creating remote GitHub repository...`);

    const repoFullName = githubOrg
      ? `${githubOrg}/${projectName}`
      : projectName;
    let repoUrl: string | null = null;

    // Priority: GitHub Token (explicit) > gh CLI (convenience)
    if (githubToken) {
      Logger.info(`  📡 Using GitHub API with token...`);
      repoUrl = await createRepoUsingApi(
        projectName,
        githubOrg,
        githubToken,
        visibility,
      );
    } else {
      const ghAvailable = await checkGhCliAvailable();
      if (ghAvailable) {
        Logger.info(`  📡 Using gh CLI...`);
        repoUrl = await createRepoUsingGhCli(repoFullName, visibility);
      } else {
        throw new Error(
          "Neither GITHUB_TOKEN nor gh CLI available. " +
            "Set GITHUB_TOKEN environment variable or install gh CLI.",
        );
      }
    }

    if (!repoUrl) {
      throw new Error("Failed to create remote repository");
    }

    // Add remote (use plain HTTPS URL -- token passed via GIT_ASKPASS for security)
    const remoteCmd = new Deno.Command("git", {
      args: ["remote", "add", "origin", repoUrl],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    await remoteCmd.output();

    Logger.success(`  ✅ Remote repository created: ${repoUrl}`);

    // Push all branches if requested
    if (push) {
      Logger.info(`  📤 Pushing branches to remote...`);

      // Build env with GIT_ASKPASS for secure token-based auth
      // This avoids embedding the token in .git/config or remote URL
      const gitEnv: Record<string, string> = {};
      if (githubToken) {
        // Create a temporary script that echoes the token for git auth
        const askPassScript = await Deno.makeTempFile({ suffix: ".sh" });
        await Deno.writeTextFile(
          askPassScript,
          `#!/bin/sh\necho "${githubToken}"\n`,
        );
        await Deno.chmod(askPassScript, 0o700);
        gitEnv.GIT_ASKPASS = askPassScript;
        gitEnv.GIT_TERMINAL_PROMPT = "0";
      }

      for (const branch of ["main", "staging", "dev"]) {
        const pushCmd = new Deno.Command("git", {
          args: ["push", "-u", "origin", branch],
          cwd: projectPath,
          env: { ...Deno.env.toObject(), ...gitEnv },
          stdout: "piped",
          stderr: "piped",
        });
        const pushResult = await pushCmd.output();

        if (pushResult.success) {
          Logger.success(`  ✅ Pushed ${branch} to remote`);
        } else {
          Logger.warning(
            `  ⚠️  Push failed for ${branch}: ${
              new TextDecoder().decode(pushResult.stderr)
            }`,
          );
        }
      }

      // Clean up temp askpass script
      if (gitEnv.GIT_ASKPASS) {
        try {
          await Deno.remove(gitEnv.GIT_ASKPASS);
        } catch { /* ignore cleanup failure */ }
      }
    }

    return repoUrl;
  } catch (error) {
    Logger.error(
      `  ❌ Failed to create remote repo: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

/**
 * Check if gh CLI is available
 */
async function checkGhCliAvailable(): Promise<boolean> {
  try {
    const cmd = new Deno.Command("gh", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });
    const result = await cmd.output();
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Create repo using gh CLI
 */
async function createRepoUsingGhCli(
  repoFullName: string,
  visibility: "private" | "public",
): Promise<string> {
  const visibilityFlag = visibility === "private" ? "--private" : "--public";

  const cmd = new Deno.Command("gh", {
    args: ["repo", "create", repoFullName, visibilityFlag, "--confirm"],
    stdout: "piped",
    stderr: "piped",
  });

  const result = await cmd.output();

  if (!result.success) {
    const error = new TextDecoder().decode(result.stderr);
    throw new Error(`gh CLI failed: ${error}`);
  }

  // Extract repo URL from output
  const output = new TextDecoder().decode(result.stdout);
  const match = output.match(/https:\/\/github\.com\/[^\s]+/);

  if (match) {
    return match[0] + ".git";
  }

  // Construct URL from repo name
  return `https://github.com/${repoFullName}.git`;
}

/**
 * Create repo using GitHub API
 */
async function createRepoUsingApi(
  projectName: string,
  githubOrg: string | undefined,
  githubToken: string,
  visibility: "private" | "public",
): Promise<string> {
  const apiUrl = githubOrg
    ? `https://api.github.com/orgs/${githubOrg}/repos`
    : "https://api.github.com/user/repos";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${githubToken}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName,
      private: visibility === "private",
      auto_init: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API failed: ${error}`);
  }

  const data = await response.json();
  return data.clone_url;
}

/**
 * Create a new workspace with multiple projects
 */
export async function createWorkspace(
  options: WorkspaceOptions,
): Promise<void> {
  const {
    name,
    targetDir = Deno.cwd(),
    namespace,
    skipRemote = false,
    githubOrg,
    githubToken = Deno.env.get("GITHUB_TOKEN"),
    visibility = "public",
  } = options;

  // Auto-enable remote creation if githubOrg is provided (unless explicitly skipped)
  const shouldCreateRemote = !skipRemote && githubOrg ? true : false;
  const shouldPush = shouldCreateRemote; // Always push if creating remote

  // Validate GitHub token is set when --github-org is used
  if (shouldCreateRemote && !githubToken) {
    throw new Error(
      "GITHUB_TOKEN is required when using --github-org flag.\n" +
        "  Set it in your shell:\n" +
        "    export GITHUB_TOKEN=ghp_your_token_here\n" +
        "  Or add to ~/.bashrc:\n" +
        "    echo 'export GITHUB_TOKEN=ghp_your_token' >> ~/.bashrc\n" +
        "  Create token at: https://github.com/settings/tokens\n" +
        "  Required scopes: repo, delete_repo",
    );
  }

  // Show warning based on remote setup choice
  if (skipRemote && githubOrg) {
    Logger.warning(
      "⚠️  Remote repository creation skipped (--skip-remote flag).",
    );
    Logger.warning(
      "   You'll need to create and link GitHub repos manually.",
    );
    Logger.newLine();
  } else if (!githubOrg) {
    Logger.warning(
      "⚠️  No --github-org flag specified, creating local workspace only.",
    );
    Logger.info(
      "   To create GitHub repos, use: --github-org=your-org",
    );
    Logger.newLine();
  }

  try {
    // Step 1: Validate workspace name
    Logger.info(`🔍 Validating workspace name: ${name}`);
    validateWorkspaceName(name);

    // Step 2: Determine components to create
    const componentTypes = determineComponents(options);
    Logger.info(
      `📦 Creating workspace with components: ${componentTypes.join(", ")}`,
    );

    // Step 3: Check if workspace already exists
    const existing = await getWorkspace(name);
    if (existing) {
      throw new Error(
        `Workspace "${name}" already exists at: ${existing.path}\n` +
          `  Use a different name or destroy the existing workspace first.`,
      );
    }

    // Step 4: Create workspace directory
    const workspacePath = join(targetDir, name);
    if (await dirExists(workspacePath)) {
      throw new Error(
        `Directory "${workspacePath}" already exists\n` +
          `  Choose a different location or name`,
      );
    }

    Logger.info(`📁 Creating workspace directory: ${workspacePath}`);
    await Deno.mkdir(workspacePath, { recursive: true });

    // Step 5: Initialize workspace metadata
    const workspaceNamespace = namespace || name;
    const metadata: WorkspaceMetadata = {
      name,
      path: workspacePath,
      namespace: workspaceNamespace,
      status: "creating",
      githubOrg,
      githubRepos: [],
      projects: [],
      components: {
        api: componentTypes.includes("api"),
        adminUi: componentTypes.includes("admin-ui"),
        store: componentTypes.includes("store"),
        status: componentTypes.includes("status"),
        ui: componentTypes.includes("ui"),
        infra: componentTypes.includes("infra"),
        mobile: componentTypes.includes("mobile"),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveWorkspace(metadata);

    // Step 6: Create each component project
    const failedComponents: string[] = [];
    for (const type of componentTypes) {
      Logger.newLine();
      const projectName = `${name}-${type}`;
      Logger.info(`🚀 Creating ${type} project: ${projectName}`);

      try {
        await createProject({
          projectName: name,
          projectType: type as "api" | "admin-ui" | "store" | "status",
          targetDir: workspacePath,
          skipDbSetup: type !== "api", // Only API needs database
          // Pass scope to both API and admin-ui so the sidebar is filtered correctly
          scope: type === "api" || type === "admin-ui"
            ? options.scope
            : undefined,
          skipListing: type === "api" || type === "admin-ui"
            ? options.skipListing
            : undefined,
          skipCommerce: type === "api" || type === "admin-ui"
            ? options.skipCommerce
            : undefined,
        });

        const projectPath = join(workspacePath, projectName);
        const project = await getProject(projectName);

        if (project) {
          metadata.projects.push({
            folderName: projectName,
            path: projectPath,
            type: type as "api" | "admin-ui" | "store",
            projectKey: projectName,
            addedBy: "workspace-init",
            addedAt: new Date(),
          });

          // Always initialize Git (required for remote tracking)
          await initializeGit(projectPath, projectName);

          // Create remote repo if should create
          if (shouldCreateRemote) {
            const repoUrl = await createRemoteRepo(projectName, projectPath, {
              githubOrg,
              githubToken,
              visibility,
              push: shouldPush,
            });

            if (repoUrl) {
              metadata.githubRepos.push({
                name: projectName,
                url: repoUrl,
                type: type as ProjectType,
              });
            }
          }
        }

        Logger.success(`${type} project created successfully`);
      } catch (error) {
        failedComponents.push(type);
        Logger.error(
          `Failed to create ${type} project: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    // Step 7: Generate Docker configuration and workspace deno.json
    const successfulComponents = componentTypes.filter(
      (c) => !failedComponents.includes(c),
    );
    if (successfulComponents.length > 0) {
      try {
        // Get DB credentials from PGUSER/PGPASSWORD (same source as api-creator)
        const dbUser = Deno.env.get("PGUSER") || "postgres";
        const dbPassword = Deno.env.get("PGPASSWORD") || "password";

        await generateWorkspaceDocker({
          workspacePath,
          workspaceName: name,
          components: successfulComponents as (
            | "api"
            | "admin-ui"
            | "store"
            | "status"
          )[],
          dbUser,
          dbPassword,
        });
      } catch (error) {
        Logger.warning(
          `Failed to generate Docker configuration: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    // Step 8: Update workspace status based on result
    if (failedComponents.length > 0) {
      metadata.status = "partial";
      metadata.updatedAt = new Date();
      await updateWorkspace(name, metadata);
      Logger.warning(
        `Workspace "${name}" created with failures in: ${
          failedComponents.join(", ")
        }`,
      );
    } else {
      metadata.status = "created";
      metadata.updatedAt = new Date();
      await updateWorkspace(name, metadata);
    }

    // Step 9: Success message
    Logger.newLine();
    Logger.banner(VERSION);
    Logger.success(`Workspace "${name}" created successfully!`);
    Logger.newLine();
    Logger.subtitle("Workspace Structure:");
    Logger.code(`${workspacePath}/`);
    for (const project of metadata.projects) {
      Logger.code(`  |-- ${project.folderName}/`);
      Logger.code(`  |   +-- .git/ (initialized)`);
      const repo = metadata.githubRepos.find((r) =>
        r.name === project.folderName
      );
      if (repo) {
        Logger.code(`  |   +-- remote: ${repo.url}`);
      }
    }
    Logger.code(`  |-- docker-compose.dev.yml`);
    Logger.code(`  |-- docker-compose.test.yml`);
    Logger.code(`  |-- docker-compose.yml`);
    Logger.code(`  |-- start-dev.sh`);
    Logger.code(`  |-- start-test.sh`);
    Logger.code(`  |-- start-prod.sh`);
    Logger.code(`  |-- stop.sh`);
    Logger.code(`  +-- deno.json`);
    Logger.newLine();
    Logger.subtitle("Quick Start:");
    Logger.code(`cd ${name}`);
    Logger.newLine();
    Logger.info("Without Docker (local dev):");
    Logger.code(`deno task dev`);
    Logger.newLine();
    Logger.info("With Docker (hot reload):");
    Logger.code(`./start-dev.sh`);
    Logger.newLine();
    Logger.info("With Docker (production mode):");
    Logger.code(`./start-prod.sh`);
    Logger.newLine();
  } catch (error) {
    // Update workspace status to partial on failure
    try {
      await updateWorkspace(name, { status: "partial", updatedAt: new Date() });
    } catch {
      // Ignore KV update failure during error handling
    }
    Logger.error(
      `Failed to create workspace: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
}

/**
 * Destroy a workspace and optionally its GitHub repos
 */
export async function destroyWorkspace(options: {
  name: string;
  force?: boolean;
  deleteRemote?: boolean;
}): Promise<void> {
  const { name, force: _force = false, deleteRemote = true } = options;

  try {
    // Get workspace metadata
    const workspace = await getWorkspace(name);
    if (!workspace) {
      Logger.error(`Workspace "${name}" not found`);
      return;
    }

    Logger.info(`🗑️  Destroying workspace: ${name}`);
    Logger.info(`   Path: ${workspace.path}`);

    // Delete all GitHub repos if requested
    if (deleteRemote && workspace.githubRepos.length > 0) {
      Logger.newLine();
      Logger.info(
        `🌐 Deleting ${workspace.githubRepos.length} GitHub repositories...`,
      );

      for (const repo of workspace.githubRepos) {
        try {
          const fullName = workspace.githubOrg
            ? `${workspace.githubOrg}/${repo.name}`
            : repo.name;

          // Priority: GitHub Token (explicit) > gh CLI (convenience)
          const githubToken = Deno.env.get("GITHUB_TOKEN");

          if (githubToken) {
            // Use GitHub API
            const [owner, repoName] = fullName.includes("/")
              ? fullName.split("/")
              : [null, fullName];

            if (!owner) {
              Logger.warning(
                `  ⚠️  Cannot delete ${fullName}: No owner specified`,
              );
              continue;
            }

            const response = await fetch(
              `https://api.github.com/repos/${owner}/${repoName}`,
              {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${githubToken}`,
                  "Accept": "application/vnd.github.v3+json",
                  "X-GitHub-Api-Version": "2022-11-28",
                },
              },
            );

            if (response.status === 204) {
              Logger.success(`  ✅ Deleted: ${fullName}`);
            } else {
              const errorText = await response.text();
              Logger.warning(
                `  ⚠️  Failed to delete ${fullName}: ${errorText}`,
              );
            }
          } else {
            // Fallback to gh CLI
            const ghAvailable = await checkGhCliAvailable();
            if (ghAvailable) {
              const deleteCmd = new Deno.Command("gh", {
                args: ["repo", "delete", fullName, "--yes"],
                stdout: "piped",
                stderr: "piped",
              });

              const result = await deleteCmd.output();
              if (result.success) {
                Logger.success(`  ✅ Deleted: ${fullName}`);
              } else {
                Logger.warning(`  ⚠️  Failed to delete: ${fullName}`);
              }
            } else {
              Logger.warning(
                `  ⚠️  Neither GITHUB_TOKEN nor gh CLI available, skipping: ${repo.name}`,
              );
            }
          }
        } catch (error) {
          Logger.warning(
            `  ⚠️  Error deleting ${repo.name}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    // Destroy all projects
    if (workspace.projects.length > 0) {
      Logger.newLine();
      Logger.info(`📦 Destroying ${workspace.projects.length} projects...`);

      const { destroyProject } = await import("./destroy.ts");

      for (const project of workspace.projects) {
        try {
          Logger.info(`  🗑️  ${project.folderName}`);
          await destroyProject({
            projectName: project.folderName,
            force: true,
          });
        } catch (error) {
          Logger.warning(
            `  ⚠️  Error destroying ${project.folderName}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    // Remove workspace directory
    Logger.newLine();
    Logger.info(`📁 Removing workspace directory...`);

    // Resolve to absolute path in case it's stored as relative
    const workspacePath = isAbsolute(workspace.path)
      ? workspace.path
      : resolve(Deno.cwd(), workspace.path);

    try {
      await Deno.remove(workspacePath, { recursive: true });
      Logger.success(`  ✅ Directory removed`);
    } catch (error) {
      if ((error as Error).name === "NotFound") {
        Logger.warning(`  ⚠️  Directory already removed`);
      } else {
        throw error;
      }
    }

    // Delete workspace metadata
    const { deleteWorkspace } = await import("../utils/workspaceStore.ts");
    await deleteWorkspace(name);

    Logger.newLine();
    Logger.success(`✅ Workspace "${name}" destroyed successfully!`);
  } catch (error) {
    Logger.error(
      `Failed to destroy workspace: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
}

/**
 * TODO: Update remote configuration for an existing workspace
 * Retroactively adds GitHub remotes to projects that don't have them
 *
 * Usage: tstack workspace <name> update-remote --github-org=<org>
 *
 * This will:
 * - Check each project in the workspace
 * - Initialize Git if not present
 * - Create GitHub repos if they don't exist
 * - Add remote origin to local Git config
 * - Push initial commit
 */
/*
export async function updateWorkspaceRemote(options: {
  name: string;
  githubOrg: string;
  githubToken?: string;
  visibility?: "private" | "public";
  push?: boolean;
}): Promise<void> {
  // Implementation coming soon...
}
*/
