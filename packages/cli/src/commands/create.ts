import { dirname, join } from "@std/path";
import { copy, exists } from "@std/fs";
import { Logger } from "../utils/logger.ts";
import {
  extractVersion,
  fetchAllLatestVersions,
} from "../utils/versionFetcher.ts";

export interface CreateOptions {
  projectName: string;
  targetDir?: string;
  latest?: boolean; // Fetch latest stable versions from registries (default: false, uses template versions)
  skipDbSetup?: boolean; // Skip database creation (for testing)
}

function promptForCredentials(
  projectName: string,
): { dbName: string; dbUser: string; dbPassword: string } {
  // Convert project name to database name: blog-api -> blog_api_dev
  const defaultDbName = projectName.replace(/-/g, "_") + "_dev";

  Logger.subtitle("Database Configuration:");
  Logger.newLine();
  Logger.info(
    `Development: ${defaultDbName}`,
  );
  Logger.info(
    `Test: ${projectName.replace(/-/g, "_")}_test`,
  );
  Logger.info(
    `User: postgres (shared for all projects)`,
  );
  Logger.info(
    `Password: password (default for local dev)`,
  );
  Logger.newLine();

  return {
    dbName: defaultDbName,
    dbUser: "postgres",
    dbPassword: "password",
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
      stdin: "inherit", // Allow interactive password input
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
async function setupDatabases(
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
    `4. Manual: PGPASSWORD=${dbPassword} psql -U ${dbUser} -h localhost -c "CREATE DATABASE ${
      databases[2].name
    }"`,
  );
}

export async function createProject(options: CreateOptions): Promise<void> {
  const {
    projectName,
    targetDir = Deno.cwd(),
    latest = false,
    skipDbSetup = false,
  } = options;

  Logger.title(`Creating new project: ${projectName}`);
  Logger.info(" Authentication system is included by default");
  if (latest) {
    Logger.info(" Latest stable dependency versions will be fetched");
  }
  Logger.newLine();

  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(projectName)) {
    Logger.error(
      `Invalid project name: "${projectName}". Use only letters, numbers, hyphens, and underscores.`,
    );
    Deno.exit(1);
  }

  const projectPath = join(targetDir, projectName);

  if (await dirExists(projectPath)) {
    Logger.error(`Directory "${projectName}" already exists at ${projectPath}`);
    Deno.exit(1);
  }

  // Set database credentials
  const { dbName, dbUser, dbPassword } = promptForCredentials(projectName);
  const testDbName = projectName.replace(/-/g, "_") + "_test"; // Derive from projectName, not dbName
  const prodDbName = projectName.replace(/-/g, "_") + "_prod"; // Derive from projectName for production
  Logger.newLine();

  const cliPath = dirname(dirname(dirname(new URL(import.meta.url).pathname)));
  const starterPath = join(dirname(cliPath), "starter");

  if (!await dirExists(starterPath)) {
    Logger.error(
      "Starter template not found. Make sure TonyStack is installed correctly.",
    );
    Logger.info("Expected path: " + starterPath);
    Deno.exit(1);
  }

  Logger.step("Cooking your starter template...");
  Logger.newLine();

  try {
    // Walk through the starter directory and copy files
    for await (const entry of Deno.readDir(starterPath)) {
      const sourcePath = join(starterPath, entry.name);
      const destPath = join(projectPath, entry.name);

      Logger.info(`Cooking ${entry.name}...`);
      await copy(sourcePath, destPath, { overwrite: false });
    }

    // Update .env.example with custom database credentials
    const envPath = join(projectPath, ".env.example");
    let envContent = await Deno.readTextFile(envPath);
    envContent = envContent.replace(
      /DATABASE_URL=postgresql:\/\/tonystack:password@localhost:5432\/tonystack/g,
      `DATABASE_URL=postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`,
    );
    await Deno.writeTextFile(envPath, envContent);

    // Update docker-compose.yml with custom database credentials
    const dockerComposePath = join(projectPath, "docker-compose.yml");
    let dockerComposeContent = await Deno.readTextFile(dockerComposePath);
    dockerComposeContent = dockerComposeContent.replace(
      /POSTGRES_DB: tonystack/g,
      `POSTGRES_DB: ${dbName}`,
    );
    dockerComposeContent = dockerComposeContent.replace(
      /POSTGRES_USER: tonystack/g,
      `POSTGRES_USER: ${dbUser}`,
    );
    dockerComposeContent = dockerComposeContent.replace(
      /POSTGRES_PASSWORD: password/g,
      `POSTGRES_PASSWORD: ${dbPassword}`,
    );
    dockerComposeContent = dockerComposeContent.replace(
      /pg_isready -U tonystack -d tonystack/g,
      `pg_isready -U ${dbUser} -d ${dbName}`,
    );
    await Deno.writeTextFile(dockerComposePath, dockerComposeContent);

    // Authentication is always included - JWT configuration is already in template
    Logger.info("Authentication system configured");
    const envExamplePath = join(projectPath, ".env.example");
    let envExampleContent = await Deno.readTextFile(envExamplePath);

    // Verify JWT configuration exists
    if (!envExampleContent.includes("JWT_SECRET")) {
      envExampleContent += `\n# JWT Authentication Configuration
JWT_SECRET=change-this-to-random-secret-in-production-${
        Math.random().toString(36).substring(2, 15)
      }
JWT_ISSUER=tonystack
JWT_EXPIRY=7d
`;
      await Deno.writeTextFile(envExamplePath, envExampleContent);
    }

    // Add jose to deno.json imports
    const denoJsonPath = join(projectPath, "deno.json");
    const denoJsonContent = await Deno.readTextFile(denoJsonPath);
    const denoJson = JSON.parse(denoJsonContent);

    if (!denoJson.imports) {
      denoJson.imports = {};
    }

    if (!denoJson.imports["jose"]) {
      denoJson.imports["jose"] = "npm:jose@^5.9.6";
      await Deno.writeTextFile(
        denoJsonPath,
        JSON.stringify(denoJson, null, 2) + "\n",
      );
    }

    // Add db:seed task if not present
    if (!denoJson.tasks) {
      denoJson.tasks = {};
    }

    if (!denoJson.tasks["db:seed"]) {
      denoJson.tasks["db:seed"] =
        "deno run --allow-all scripts/seed-superadmin.ts";
      await Deno.writeTextFile(
        denoJsonPath,
        JSON.stringify(denoJson, null, 2) + "\n",
      );
    }

    // migrations meta/_journal.json is already copied from starter template
    // No need to overwrite it - starter template contains the initial migration entry
    // Related fix: https://github.com/desingh-rajan/tstack-kit/issues/31

    // Update deno.json with latest versions if --latest flag is set
    if (latest) {
      const denoJsonPath = join(projectPath, "deno.json");
      const denoJsonContent = await Deno.readTextFile(denoJsonPath);
      const denoJson = JSON.parse(denoJsonContent);

      // Extract current versions as fallbacks
      const fallbackVersions: Record<string, string> = {};
      if (denoJson.imports) {
        for (const [key, value] of Object.entries(denoJson.imports)) {
          if (typeof value === "string") {
            fallbackVersions[key] = extractVersion(value);
          }
        }
      }

      // Fetch latest versions
      const latestVersions = await fetchAllLatestVersions(fallbackVersions);

      // Update imports with latest versions
      if (denoJson.imports) {
        denoJson.imports["@std/dotenv"] = `jsr:@std/dotenv@^${
          latestVersions["@std/dotenv"]
        }`;
        denoJson.imports["@std/dotenv/load"] = `jsr:@std/dotenv@^${
          latestVersions["@std/dotenv"]
        }/load`;
        denoJson.imports["hono"] = `jsr:@hono/hono@^${latestVersions["hono"]}`;
        denoJson.imports["hono/cors"] = `jsr:@hono/hono@^${
          latestVersions["hono"]
        }/cors`;
        denoJson.imports["hono/logger"] = `jsr:@hono/hono@^${
          latestVersions["hono"]
        }/logger`;
        denoJson.imports["hono/jwt"] = `jsr:@hono/hono@^${
          latestVersions["hono"]
        }/jwt`;
        denoJson.imports["drizzle-orm"] = `npm:drizzle-orm@^${
          latestVersions["drizzle-orm"]
        }`;
        denoJson.imports["drizzle-orm/pg-core"] = `npm:drizzle-orm@^${
          latestVersions["drizzle-orm"]
        }/pg-core`;
        denoJson.imports["drizzle-orm/postgres-js"] = `npm:drizzle-orm@^${
          latestVersions["drizzle-orm"]
        }/postgres-js`;
        denoJson.imports["drizzle-kit"] = `npm:drizzle-kit@^${
          latestVersions["drizzle-kit"]
        }`;
        denoJson.imports["drizzle-zod"] = `npm:drizzle-zod@^${
          latestVersions["drizzle-zod"]
        }`;
        denoJson.imports["postgres"] = `npm:postgres@^${
          latestVersions["postgres"]
        }`;
        denoJson.imports["zod"] = `npm:zod@^${latestVersions["zod"]}`;

        // Update jose (auth is always included)
        if (latestVersions["jose"]) {
          denoJson.imports["jose"] = `npm:jose@^${latestVersions["jose"]}`;
        }
      }

      await Deno.writeTextFile(
        denoJsonPath,
        JSON.stringify(denoJson, null, 2) + "\n",
      );

      Logger.info("Updated deno.json with latest stable versions");
    }
  } catch (error) {
    Logger.error(`Failed to copy starter template: ${error}`);
    Deno.exit(1);
  }

  Logger.newLine();
  Logger.success("Project created successfully!");
  Logger.newLine();

  // Setup environment files
  Logger.step("Setting up environment...");

  // 1. Copy .env.example to .env automatically
  const envExamplePath = join(projectPath, ".env.example");
  const envPath = join(projectPath, ".env");
  await Deno.copyFile(envExamplePath, envPath);

  // Update DATABASE_URL with correct database name
  let envContent = await Deno.readTextFile(envPath);
  envContent = envContent.replace(
    /DATABASE_URL=postgresql:\/\/[^:]+:[^@]+@[^/]+\/\w+/,
    `DATABASE_URL=postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`,
  );
  await Deno.writeTextFile(envPath, envContent);
  Logger.info(".env file created");

  // 2. Setup .env.development.local (if exists in starter)
  const envDevPath = join(projectPath, ".env.development.local");
  try {
    if (await exists(envDevPath)) {
      let envDevContent = await Deno.readTextFile(envDevPath);
      envDevContent = envDevContent.replace(
        /DATABASE_URL=postgresql:\/\/[^:]+:[^@]+@[^/]+\/\w+/,
        `DATABASE_URL=postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`,
      );
      await Deno.writeTextFile(envDevPath, envDevContent);
      Logger.info(".env.development.local configured");
    }
  } catch {
    // File doesn't exist, skip
  }

  // 3. Setup .env.test.local with test database name
  const envTestPath = join(projectPath, ".env.test.local");
  try {
    if (await exists(envTestPath)) {
      let envTestContent = await Deno.readTextFile(envTestPath);
      envTestContent = envTestContent.replace(
        /DATABASE_URL=postgresql:\/\/[^:]+:[^@]+@[^/]+\/\w+/,
        `DATABASE_URL=postgresql://${dbUser}:${dbPassword}@localhost:5432/${testDbName}`,
      );
      await Deno.writeTextFile(envTestPath, envTestContent);
      Logger.info(`.env.test.local configured (database: ${testDbName})`);
    }
  } catch {
    // File doesn't exist, skip
  }

  // 4. Setup .env.production.local template with correct database name
  const envProdPath = join(projectPath, ".env.production.local");
  try {
    if (await exists(envProdPath)) {
      let envProdContent = await Deno.readTextFile(envProdPath);
      const prodDbName = projectName.replace(/-/g, "_") + "_prod";
      envProdContent = envProdContent.replace(
        /your_project_prod/g,
        prodDbName,
      );
      await Deno.writeTextFile(envProdPath, envProdContent);
      Logger.info(
        `.env.production.local template ready (database: ${prodDbName})`,
      );
    }
  } catch {
    // File doesn't exist, skip
  }

  Logger.newLine();

  // Try to create databases automatically (dev + test + prod)
  if (!skipDbSetup) {
    Logger.step("Setting up databases...");
    await setupDatabases(dbName, testDbName, prodDbName, dbUser, dbPassword);
  }

  Logger.newLine();
  Logger.divider();
  Logger.newLine();

  Logger.subtitle("[SUCCESS] Setup Complete!");
  Logger.newLine();
  if (!skipDbSetup) {
    Logger.subtitle("Database Configuration:");
    Logger.code(`Database: ${dbName}`);
    Logger.code(`User: ${dbUser}`);
    Logger.code(`Password: ${dbPassword}`);
    Logger.code(
      `URL: postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`,
    );
    Logger.newLine();
  }

  Logger.subtitle("Next Steps:");
  Logger.newLine();

  Logger.info("1. Navigate to your project:");
  Logger.code(`cd ${projectName}`);
  Logger.newLine();

  Logger.info("2. Scaffold entities:");
  Logger.code("tstack scaffold articles");
  Logger.code("tstack scaffold comments");
  Logger.newLine();

  Logger.info("3. Generate and run migrations:");
  Logger.code("deno task migrate:generate");
  Logger.code("deno task migrate:run");
  Logger.newLine();

  Logger.info("4. Start development server:");
  Logger.code("deno task dev");
  Logger.newLine();

  Logger.subtitle(" Authentication System Included:");
  Logger.newLine();
  Logger.info("Seed superadmin user:");
  Logger.code("deno task db:seed");
  Logger.newLine();
  Logger.info("Superadmin credentials (set via environment variables):");
  Logger.code("Email: set via SUPERADMIN_EMAIL environment variable");
  Logger.code("Password: set via SUPERADMIN_PASSWORD environment variable");
  Logger.newLine();
  Logger.info("Available auth endpoints:");
  Logger.code("POST /auth/register - Create new user");
  Logger.code("POST /auth/login - Login user");
  Logger.code("POST /auth/logout - Logout (requires token)");
  Logger.code("GET /auth/me - Get current user (requires token)");
  Logger.code(
    "PUT /auth/change-password - Change password (requires token)",
  );
  Logger.newLine();
  Logger.info("Admin management endpoints:");
  Logger.code("POST /admin/users - Create admin user");
  Logger.code("GET /admin/users - List all users");
  Logger.code("GET /admin/users/:id - Get user by ID");
  Logger.code("PUT /admin/users/:id - Update user");
  Logger.code("DELETE /admin/users/:id - Delete user");
  Logger.newLine();
  Logger.info(
    "Note: Routes are clean (no /api prefix). Deployment path prefix handled by proxy.",
  );
  Logger.newLine();
  Logger.warning("[WARNING]  Change superadmin password in production!");
  Logger.newLine();

  Logger.subtitle("Your API will be available at:");
  Logger.code("http://localhost:8000");
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
