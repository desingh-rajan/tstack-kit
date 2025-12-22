import { isAbsolute, join, resolve } from "@std/path";
import { Logger } from "../utils/logger.ts";
import {
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "../utils/projectStore.ts";

export interface DestroyOptions {
  projectName: string;
  projectType?: "api" | "admin-ui" | "store" | "workspace";
  force?: boolean;
  skipDbSetup?: boolean; // Skip database operations (for testing)
  interactive?: boolean; // Allow interactive prompts (default: true)
}

/**
 * Try to drop database using PGPASSWORD environment variable
 */
async function dropDatabaseWithPassword(
  dbName: string,
  dbUser: string,
  dbPassword: string,
): Promise<boolean> {
  try {
    const cmd = new Deno.Command("psql", {
      args: [
        "-U",
        dbUser,
        "-h",
        "localhost",
        "-c",
        `DROP DATABASE IF EXISTS ${dbName}`,
      ],
      env: { PGPASSWORD: dbPassword },
      stdout: "piped",
      stderr: "piped",
    });

    const { success } = await cmd.output();
    return success;
  } catch {
    return false;
  }
}

/**
 * Check if PostgreSQL is running in Docker
 */
async function isDockerPostgresRunning(): Promise<boolean> {
  try {
    const cmd = new Deno.Command("docker", {
      args: ["ps", "--filter", "name=postgres", "--format", "{{.Names}}"],
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stdout } = await cmd.output();
    if (!success) return false;

    const output = new TextDecoder().decode(stdout).trim();
    return output.includes("postgres");
  } catch {
    return false;
  }
}

/**
 * Try to drop database using Docker exec
 */
async function dropDatabaseWithDocker(dbName: string): Promise<boolean> {
  try {
    const cmd = new Deno.Command("docker", {
      args: [
        "exec",
        "-i",
        "postgres",
        "psql",
        "-U",
        "postgres",
        "-c",
        `DROP DATABASE IF EXISTS ${dbName}`,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { success } = await cmd.output();
    return success;
  } catch {
    return false;
  }
}

/**
 * Try to drop database using sudo (allows interactive password prompt)
 */
async function dropDatabaseWithSudo(dbName: string): Promise<boolean> {
  try {
    const cmd = new Deno.Command("sudo", {
      args: [
        "-u",
        "postgres",
        "psql",
        "-c",
        `DROP DATABASE IF EXISTS ${dbName}`,
      ],
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    const { success } = await cmd.output();
    return success;
  } catch {
    return false;
  }
}

/**
 * Drop databases using multiple fallback methods
 */
async function dropDatabases(
  dbName: string,
  testDbName: string,
  prodDbName: string,
): Promise<void> {
  const databases = [
    { name: dbName, label: "Development database" },
    { name: testDbName, label: "Test database" },
    { name: prodDbName, label: "Production database" },
  ];

  const dbUser = "postgres";
  const dbPassword = "password";

  for (const { name, label } of databases) {
    let dropped = false;

    // Method 1: Try PGPASSWORD
    dropped = await dropDatabaseWithPassword(name, dbUser, dbPassword);
    if (dropped) {
      Logger.success(`${label} "${name}" dropped!`);
      continue;
    }

    // Method 2: Try Docker
    if (await isDockerPostgresRunning()) {
      dropped = await dropDatabaseWithDocker(name);
      if (dropped) {
        Logger.success(`${label} "${name}" dropped via Docker!`);
        continue;
      }
    }

    // Method 3: Try sudo
    dropped = await dropDatabaseWithSudo(name);
    if (dropped) {
      Logger.success(`${label} "${name}" dropped via sudo!`);
      continue;
    }

    // All methods failed
    Logger.warning(`Could not drop ${name} (may not exist)`);
  }
}

export async function destroyProject(options: DestroyOptions): Promise<void> {
  const {
    projectName,
    projectType,
    force,
    skipDbSetup = false,
    interactive = true,
  } = options;

  // Step 1: Determine what we're looking for
  let targetFolderName: string;
  let shouldSearchForMatches = false;

  if (projectType) {
    // Case 1: Type is provided - calculate exact folder name
    const typeSuffix = projectType === "workspace" ? "" : `-${projectType}`;
    const alreadyHasSuffix = projectName.endsWith(typeSuffix);
    targetFolderName = alreadyHasSuffix
      ? projectName
      : `${projectName}${typeSuffix}`;
  } else {
    // Case 2 & 3: No type provided
    // First try exact match, then search for multiple matches
    targetFolderName = projectName;
    shouldSearchForMatches = true;
  }

  // Step 2: Try exact match first
  let metadata = await getProject(targetFolderName);

  // Step 3: If no exact match and we should search, look for projects starting with the name
  if (!metadata && shouldSearchForMatches) {
    const allProjects = await listProjects();
    const matches = allProjects.filter((p) =>
      p.folderName.startsWith(projectName) ||
      p.name === projectName
    );

    if (matches.length === 1) {
      // Exactly one match found - auto-select it (works in both interactive and non-interactive)
      targetFolderName = matches[0].folderName;
      metadata = matches[0];
      Logger.info(`Found matching project: ${targetFolderName}`);
    } else if (matches.length > 1) {
      if (!interactive) {
        // Multiple matches in non-interactive mode - cannot proceed
        Logger.error(
          `Multiple projects found matching "${projectName}". Please specify the exact folder name or use a type parameter.`,
        );
        matches.forEach((project) => {
          Logger.info(`  - ${project.folderName} (${project.type})`);
        });
        throw new Error(`Ambiguous project name: ${projectName}`);
      }

      // Multiple matches found - prompt user in interactive mode
      Logger.warning(`Multiple projects found matching "${projectName}":`);
      Logger.newLine();

      matches.forEach((project, index) => {
        Logger.info(`  ${index + 1}. ${project.folderName} (${project.type})`);
        Logger.info(`     Path: ${project.path}`);
        Logger.newLine();
      });

      const choice = prompt(
        `Select project to destroy (1-${matches.length}, or 'all' (case-insensitive) to destroy all):`,
      );

      if (choice === null) {
        Logger.info("Destruction cancelled.");
        return;
      }

      if (choice.toLowerCase() === "all") {
        // Destroy all matches
        for (const match of matches) {
          await destroyProject({
            projectName: match.folderName,
            force: true, // Skip individual prompts since we already confirmed
            skipDbSetup,
            interactive: false, // Disable nested prompts
          });
        }
        return;
      }

      const selectedIndex = parseInt(choice) - 1;
      if (
        isNaN(selectedIndex) || selectedIndex < 0 ||
        selectedIndex >= matches.length
      ) {
        Logger.error("Invalid selection. Destruction cancelled.");
        Deno.exit(1);
      }

      // Update target to the selected project
      targetFolderName = matches[selectedIndex].folderName;
      metadata = matches[selectedIndex];
    }
  }

  Logger.subtitle(`Destroying project: ${targetFolderName}`);
  Logger.newLine();

  // Check project status
  if (metadata) {
    if (metadata.status === "destroyed") {
      Logger.warning(`Project "${targetFolderName}" is already destroyed.`);
      Logger.info(
        `Destroyed at: ${new Date(metadata.updatedAt).toLocaleString()}`,
      );
      Logger.newLine();

      if (!force) {
        const cleanup = prompt(
          "Do you want to clean up the metadata? (yes/no):",
        );
        if (cleanup?.toLowerCase() === "yes") {
          await deleteProject(targetFolderName);
          Logger.success("Metadata cleaned up.");
        } else {
          Logger.info("Operation cancelled.");
        }
      } else {
        await deleteProject(targetFolderName);
        Logger.success("Metadata cleaned up.");
      }
      return;
    }

    if (metadata.status === "creating") {
      Logger.warning(
        `Project "${targetFolderName}" has incomplete creation (status: creating).`,
      );
      Logger.info("Proceeding with cleanup...");
      Logger.newLine();
    }
  }

  // Mark as destroying
  if (metadata) {
    await updateProject(targetFolderName, { status: "destroying" });
  }

  let projectPath: string | null = null;
  let dbName: string | undefined;
  let testDbName: string | undefined;
  let prodDbName: string | undefined;

  if (metadata) {
    // Use metadata from KV store
    // Resolve to absolute path in case it's stored as relative
    projectPath = isAbsolute(metadata.path)
      ? metadata.path
      : resolve(Deno.cwd(), metadata.path);

    // Only extract database names for API projects
    if (metadata.type === "api" && metadata.databases) {
      dbName = metadata.databases.dev || "";
      testDbName = metadata.databases.test || "";
      prodDbName = metadata.databases.prod || "";
    }

    Logger.info(`Found tracked project: ${metadata.folderName}`);
    Logger.info(`Type: ${metadata.type}`);
    Logger.info(`Path: ${projectPath}`);
  } else {
    // Fallback: Search in common locations
    Logger.warning(
      `Project "${targetFolderName}" not found in tracking database`,
    );
    Logger.info("Searching in common locations...");

    const currentDirPath = join(Deno.cwd(), targetFolderName);
    const projectsDirPath = join(
      Deno.env.get("HOME") || "",
      "projects",
      targetFolderName,
    );

    let projectExists = false;

    try {
      await Deno.stat(currentDirPath);
      projectPath = currentDirPath;
      projectExists = true;
    } catch {
      try {
        await Deno.stat(projectsDirPath);
        projectPath = projectsDirPath;
        projectExists = true;
      } catch {
        projectExists = false;
      }
    }

    if (!projectExists || !projectPath) {
      Logger.error(`Project "${targetFolderName}" not found`);
      Logger.info("Searched in:");
      Logger.info(`  - ${currentDirPath}`);
      Logger.info(`  - ${projectsDirPath}`);
      throw new Error(`Project "${targetFolderName}" not found`);
    }

    // Derive database names from folder name
    dbName = targetFolderName.replace(/-/g, "_") + "_dev";
    testDbName = targetFolderName.replace(/-/g, "_") + "_test";
    prodDbName = targetFolderName.replace(/-/g, "_") + "_prod";

    Logger.info(`Found project at: ${projectPath}`);
  }

  // Check if folder exists and handle missing folder case
  const folderExists = projectPath ? await dirExists(projectPath) : false;

  if (metadata && !folderExists) {
    Logger.warning(`Project folder is missing at: ${projectPath}`);
    Logger.info(
      "The project was likely deleted manually. Cleaning up metadata and databases...",
    );
    Logger.newLine();
  }

  Logger.newLine();

  // Confirm destruction unless --force flag is used
  // Skip prompt in test mode (skipDbSetup=true) - require explicit force flag
  const isTestMode = skipDbSetup === true;

  if (!force && !isTestMode) {
    Logger.warning("[WARNING]  This will permanently delete:");
    Logger.info(`   - Project directory: ${projectPath}`);

    // Only show database info for API projects
    if (dbName || testDbName || prodDbName) {
      Logger.info(`   - Development database: ${dbName}`);
      Logger.info(`   - Test database: ${testDbName}`);
      Logger.info(`   - Production database: ${prodDbName}`);
    }
    Logger.newLine();

    const confirmation = prompt(
      "Type the folder name to confirm destruction:",
    );
    if (confirmation !== targetFolderName) {
      Logger.error("Folder name doesn't match. Destruction cancelled.");
      throw new Error("Folder name confirmation failed");
    }
    Logger.newLine();
  }

  // Step 1: Drop databases (only for API projects)
  if (!skipDbSetup && (dbName || testDbName || prodDbName)) {
    Logger.step("Dropping databases...");
    await dropDatabases(dbName!, testDbName!, prodDbName!);
    Logger.newLine();
  }

  Logger.newLine();

  // Step 2: Remove project directory
  Logger.step("Removing project directory...");

  if (projectPath && await dirExists(projectPath)) {
    try {
      await Deno.remove(projectPath, { recursive: true });
      Logger.success(`[OK] Removed: ${projectPath}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to remove project directory: ${errorMsg}`);
      throw new Error(`Failed to remove project directory: ${errorMsg}`);
    }
  } else {
    Logger.info(`Project directory already removed (or never existed)`);
  }

  // Step 3: Mark status as destroyed (keep in KV for history)
  if (metadata) {
    await updateProject(targetFolderName, { status: "destroyed" });
    Logger.success("Marked as destroyed in tracking database");
  }

  Logger.newLine();
  Logger.success("  Project destroyed successfully!");
  Logger.newLine();
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch {
    return false;
  }
}
