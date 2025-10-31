import { dirname, join } from "@std/path";
import { copy, ensureDir, exists } from "@std/fs";
import { Logger } from "../utils/logger.ts";

// TODO: Rework with-auth and without-auth flag and make any mode default
// Currently auth is optional (--with-auth flag), consider making it default
// or providing both --with-auth and --without-auth flags for clarity
export interface CreateOptions {
  projectName: string;
  targetDir?: string;
  withAuth?: boolean;
}

function promptForCredentials(
  projectName: string,
): { dbName: string; dbUser: string; dbPassword: string } {
  // Convert project name to database name: shoes-be -> shoes_be_db
  const defaultDbName = projectName.replace(/-/g, "_") + "_db";

  Logger.subtitle("Database Configuration:");
  Logger.newLine();
  Logger.info(
    `Database: ${defaultDbName} (created per project)`,
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

export async function createProject(options: CreateOptions): Promise<void> {
  const { projectName, targetDir = Deno.cwd(), withAuth = false } = options;

  Logger.title(`Creating new project: ${projectName}`);
  if (withAuth) {
    Logger.info(" Authentication system will be included");
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

  Logger.step("Copying starter template...");
  Logger.newLine();

  try {
    // Walk through the starter directory and copy files
    for await (const entry of Deno.readDir(starterPath)) {
      const sourcePath = join(starterPath, entry.name);
      const destPath = join(projectPath, entry.name);

      Logger.info(`Copying ${entry.name}...`);
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

    // If --with-auth flag is set, add JWT configuration to .env.example
    if (withAuth) {
      Logger.info("Adding authentication configuration...");
      const envExamplePath = join(projectPath, ".env.example");
      let envExampleContent = await Deno.readTextFile(envExamplePath);

      // Add JWT configuration if not already present
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
    }

    // Create migrations meta/_journal.json file
    const migrationsMetaPath = join(projectPath, "migrations", "meta");
    await ensureDir(migrationsMetaPath);
    const journalPath = join(migrationsMetaPath, "_journal.json");
    const journalContent = {
      version: "7",
      dialect: "postgresql",
      entries: [],
    };
    await Deno.writeTextFile(
      journalPath,
      JSON.stringify(journalContent, null, 2) + "\n",
    );
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
  const testDbName = `${dbName}_test`;
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

  // 4. Keep .env.production.local as template (no modifications)
  const envProdPath = join(projectPath, ".env.production.local");
  try {
    if (await exists(envProdPath)) {
      Logger.info(
        ".env.production.local template ready (requires configuration)",
      );
    }
  } catch {
    // File doesn't exist, skip
  }

  Logger.newLine();

  // Try to create databases automatically (dev + test)
  Logger.step("Setting up databases...");
  const databaseUrl =
    `postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`;

  try {
    // Create development database
    const createDbCmd = new Deno.Command("sudo", {
      args: ["-u", "postgres", "psql", "-c", `CREATE DATABASE ${dbName}`],
      stdout: "piped",
      stderr: "piped",
    });

    const { success: devSuccess } = await createDbCmd.output();

    if (devSuccess) {
      Logger.success(`Development database "${dbName}" created!`);
    } else {
      Logger.warning(
        `Database "${dbName}" may already exist or PostgreSQL is not accessible`,
      );
    }

    // Create test database
    const createTestDbCmd = new Deno.Command("sudo", {
      args: ["-u", "postgres", "psql", "-c", `CREATE DATABASE ${testDbName}`],
      stdout: "piped",
      stderr: "piped",
    });

    const { success: testSuccess } = await createTestDbCmd.output();

    if (testSuccess) {
      Logger.success(`Test database "${testDbName}" created!`);
    } else {
      Logger.warning(
        `Database "${testDbName}" may already exist or PostgreSQL is not accessible`,
      );
    }
  } catch {
    Logger.warning("Could not auto-create databases");
    Logger.info("Options to create databases:");
    Logger.code(`1. Docker: cd ${projectName} && docker compose up -d`);
    Logger.code(
      `2. Manual: sudo -u postgres psql -c "CREATE DATABASE ${dbName}"`,
    );
    Logger.code(
      `3. Test DB: sudo -u postgres psql -c "CREATE DATABASE ${testDbName}"`,
    );
  }

  Logger.newLine();
  Logger.divider();
  Logger.newLine();

  Logger.subtitle("[SUCCESS] Setup Complete!");
  Logger.newLine();
  Logger.subtitle("Database Configuration:");
  Logger.code(`Database: ${dbName}`);
  Logger.code(`User: ${dbUser}`);
  Logger.code(`Password: ${dbPassword}`);
  Logger.code(`URL: ${databaseUrl}`);
  Logger.newLine();

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

  if (withAuth) {
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
    Logger.code("POST /api/auth/register - Create new user");
    Logger.code("POST /api/auth/login - Login user");
    Logger.code("POST /api/auth/logout - Logout (requires token)");
    Logger.code("GET /api/auth/me - Get current user (requires token)");
    Logger.code(
      "PUT /api/auth/change-password - Change password (requires token)",
    );
    Logger.newLine();
    Logger.info("Admin management endpoints:");
    Logger.code("POST /api/admin/users - Create admin user");
    Logger.code("GET /api/admin/users - List all users");
    Logger.code("GET /api/admin/users/:id - Get user by ID");
    Logger.code("PUT /api/admin/users/:id - Update user");
    Logger.code("DELETE /api/admin/users/:id - Delete user");
    Logger.newLine();
    Logger.warning("[WARNING]  Change superadmin password in production!");
    Logger.newLine();
  }

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
