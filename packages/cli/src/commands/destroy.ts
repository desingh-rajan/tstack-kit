import { join } from "@std/path";
import { Logger } from "../utils/logger.ts";

export interface DestroyOptions {
  projectName: string;
  force?: boolean;
  skipDbSetup?: boolean; // Skip database operations (for testing)
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
): Promise<void> {
  const databases = [
    { name: dbName, label: "Development database" },
    { name: testDbName, label: "Test database" },
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
  const { projectName, force, skipDbSetup = false } = options;

  Logger.title(`Destroying project: ${projectName}`);
  Logger.newLine();

  // Get project path (check current directory and ~/projects)
  const currentDirPath = join(Deno.cwd(), projectName);
  const projectsDirPath = join(
    Deno.env.get("HOME") || "",
    "projects",
    projectName,
  );

  let projectPath: string | null = null;
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
    Logger.error(`Project "${projectName}" not found`);
    Logger.info("Searched in:");
    Logger.info(`  - ${currentDirPath}`);
    Logger.info(`  - ${projectsDirPath}`);
    throw new Error(`Project "${projectName}" not found`);
  }

  Logger.info(`Found project at: ${projectPath}`);
  Logger.newLine();

  // Confirm destruction unless --force flag is used
  if (!force) {
    Logger.warning("[WARNING]  This will permanently delete:");
    Logger.info(`   - Project directory: ${projectPath}`);
    Logger.info(
      `   - Development database: ${projectName.replace(/-/g, "_")}_db`,
    );
    Logger.info(
      `   - Test database: ${projectName.replace(/-/g, "_")}_db_test`,
    );
    Logger.newLine();

    const confirmation = prompt(
      "Type the project name to confirm destruction:",
    );
    if (confirmation !== projectName) {
      Logger.error("Project name doesn't match. Destruction cancelled.");
      throw new Error("Project name confirmation failed");
    }
    Logger.newLine();
  }

  // Extract database names from project name
  const dbName = projectName.replace(/-/g, "_") + "_db";
  const testDbName = projectName.replace(/-/g, "_") + "_db_test";

  // Step 1: Drop databases
  if (!skipDbSetup) {
    Logger.step("Dropping databases...");
    await dropDatabases(dbName, testDbName);
    Logger.newLine();
  }

  Logger.newLine();

  // Step 2: Remove project directory
  Logger.step("Removing project directory...");

  try {
    await Deno.remove(projectPath, { recursive: true });
    Logger.success(`[OK] Removed: ${projectPath}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    Logger.error(`Failed to remove project directory: ${errorMsg}`);
    throw new Error(`Failed to remove project directory: ${errorMsg}`);
  }

  Logger.newLine();
  Logger.success("  Project destroyed successfully!");
  Logger.newLine();
}
