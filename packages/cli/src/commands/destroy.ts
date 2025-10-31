import { join } from "@std/path";
import { Logger } from "../utils/logger.ts";

export interface DestroyOptions {
  projectName: string;
  force?: boolean;
}

export async function destroyProject(options: DestroyOptions): Promise<void> {
  const { projectName, force } = options;

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
    Deno.exit(1);
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
      `   - Test database: ${projectName.replace(/-/g, "_")}_test_db`,
    );
    Logger.newLine();

    const confirmation = prompt(
      "Type the project name to confirm destruction:",
    );
    if (confirmation !== projectName) {
      Logger.error("Project name doesn't match. Destruction cancelled.");
      Deno.exit(1);
    }
    Logger.newLine();
  }

  // Extract database names from project name
  const dbName = projectName.replace(/-/g, "_") + "_db";
  const testDbName = projectName.replace(/-/g, "_") + "_test_db";

  // Step 1: Drop databases
  Logger.step("Dropping databases...");

  try {
    // Drop development database
    const dropDevDb = new Deno.Command("sudo", {
      args: [
        "-u",
        "postgres",
        "psql",
        "-c",
        `DROP DATABASE IF EXISTS ${dbName}`,
      ],
      stdout: "piped",
      stderr: "piped",
    });
    const devResult = await dropDevDb.output();

    if (devResult.success) {
      Logger.info(`[OK] Dropped development database: ${dbName}`);
    } else {
      Logger.warning(`Could not drop ${dbName} (may not exist)`);
    }

    // Drop test database
    const dropTestDb = new Deno.Command("sudo", {
      args: [
        "-u",
        "postgres",
        "psql",
        "-c",
        `DROP DATABASE IF EXISTS ${testDbName}`,
      ],
      stdout: "piped",
      stderr: "piped",
    });
    const testResult = await dropTestDb.output();

    if (testResult.success) {
      Logger.info(`[OK] Dropped test database: ${testDbName}`);
    } else {
      Logger.warning(`Could not drop ${testDbName} (may not exist)`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    Logger.warning(`Failed to drop databases: ${errorMsg}`);
    Logger.info("You may need to drop them manually:");
    Logger.info(
      `  sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${dbName}"`,
    );
    Logger.info(
      `  sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${testDbName}"`,
    );
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
    Deno.exit(1);
  }

  Logger.newLine();
  Logger.success("  Project destroyed successfully!");
  Logger.newLine();
}
