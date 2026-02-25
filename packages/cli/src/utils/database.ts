import { Logger } from "./logger.ts";

/**
 * Database utility functions for PostgreSQL setup
 */

export interface DatabaseCredentials {
  dbName: string;
  dbUser: string;
  dbPassword: string;
}

/**
 * Prompt for database credentials
 */
export function promptForCredentials(
  projectName: string,
): DatabaseCredentials {
  // Convert project name to database name: blog-api -> blog_api_dev
  const defaultDbName = projectName.replace(/-/g, "_") + "_dev";

  const dbUser = Deno.env.get("PGUSER") || "postgres";
  const dbPassword = Deno.env.get("PGPASSWORD") || "password";

  Logger.subtitle("Database Configuration:");
  Logger.newLine();
  Logger.info(`Development: ${defaultDbName}`);
  Logger.info(`Test: ${projectName.replace(/-/g, "_")}_test`);
  Logger.info(`User: ${dbUser}`);
  Logger.newLine();

  return {
    dbName: defaultDbName,
    dbUser,
    dbPassword,
  };
}

/**
 * Try to create database using PGPASSWORD environment variable
 */
async function createDatabaseWithPassword(
  dbName: string,
  dbUser: string,
  dbPassword: string,
): Promise<boolean> {
  try {
    const cmd = new Deno.Command("psql", {
      args: [
        "-U",
        dbUser,
        "-d",
        "postgres",
        "-h",
        "localhost",
        "-c",
        `CREATE DATABASE ${dbName}`,
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
 * Try to create database using Docker exec
 */
async function createDatabaseWithDocker(dbName: string): Promise<boolean> {
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
        `CREATE DATABASE ${dbName}`,
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
 * Try to create database using sudo (allows interactive password prompt)
 */
async function createDatabaseWithSudo(dbName: string): Promise<boolean> {
  try {
    Logger.info(
      "Attempting to create database with sudo (you may be prompted for your password)...",
    );

    const cmd = new Deno.Command("sudo", {
      args: ["-u", "postgres", "psql", "-c", `CREATE DATABASE ${dbName}`],
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
 * Main database setup orchestrator - tries multiple methods
 */
export async function setupDatabases(
  dbName: string,
  testDbName: string,
  prodDbName: string,
  dbUser: string,
  dbPassword: string,
): Promise<void> {
  const databases = [
    { name: dbName, label: "Development database" },
    { name: testDbName, label: "Test database" },
    { name: prodDbName, label: "Production database" },
  ];

  for (const { name, label } of databases) {
    let created = false;

    // Method 1: Try PGPASSWORD (fastest, no prompts)
    created = await createDatabaseWithPassword(name, dbUser, dbPassword);
    if (created) {
      Logger.success(`${label} "${name}" created!`);
      continue;
    }

    // Method 2: Try Docker (if running)
    if (await isDockerPostgresRunning()) {
      created = await createDatabaseWithDocker(name);
      if (created) {
        Logger.success(`${label} "${name}" created via Docker!`);
        continue;
      }
    }

    // Method 3: Try sudo (interactive, may prompt for password)
    created = await createDatabaseWithSudo(name);
    if (created) {
      Logger.success(`${label} "${name}" created via sudo!`);
      continue;
    }

    // All methods failed
    Logger.warning(
      `Could not create ${label} "${name}" (may already exist or PostgreSQL is not accessible)`,
    );
  }

  Logger.newLine();
  Logger.info("If databases were not created, you have these options:");
  Logger.code(
    `1. Docker: cd ${dbName.replace(/_dev$/, "")} && docker compose up -d`,
  );
  Logger.code(
    `2. Manual: PGPASSWORD=${dbPassword} psql -U ${dbUser} -h localhost -c "CREATE DATABASE ${dbName}"`,
  );
  Logger.code(
    `3. Manual: PGPASSWORD=${dbPassword} psql -U ${dbUser} -h localhost -c "CREATE DATABASE ${testDbName}"`,
  );
  Logger.code(
    `4. Manual: PGPASSWORD=${dbPassword} psql -U ${dbUser} -h localhost -c "CREATE DATABASE ${prodDbName}"`,
  );
}
