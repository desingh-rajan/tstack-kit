import { join } from "@std/path";
import { exists as _exists } from "@std/fs";
import { Logger } from "../../utils/logger.ts";
import { saveProject } from "../../utils/projectStore.ts";
import {
  type DatabaseCredentials,
  promptForCredentials,
  setupDatabases,
} from "../../utils/database.ts";
import { BaseProjectCreator } from "./base-creator.ts";

/**
 * API Project Creator
 * Handles creation of TStack API projects with database setup
 */
export class ApiProjectCreator extends BaseProjectCreator {
  private credentials?: DatabaseCredentials;
  private testDbName?: string;
  private prodDbName?: string;

  protected getStarterTemplateName(): string {
    return "api-starter";
  }

  protected async configureProject(): Promise<void> {
    // Always compute database names (even if skipDbSetup is true)
    this.testDbName = this.folderName.replace(/-/g, "_") + "_test";
    this.prodDbName = this.folderName.replace(/-/g, "_") + "_prod";

    // Get database credentials if not skipping DB setup
    if (!this.options.skipDbSetup) {
      this.credentials = promptForCredentials(this.folderName);
      Logger.newLine();
    } else {
      // In test mode, still set credentials for metadata but don't prompt
      this.credentials = {
        dbName: this.folderName.replace(/-/g, "_") + "_dev",
        dbUser: "postgres",
        dbPassword: "password",
      };
    }

    // Update .env.example with database credentials
    if (this.credentials) {
      const envPath = join(this.projectPath, ".env.example");
      let envContent = await Deno.readTextFile(envPath);
      envContent = envContent.replace(
        /DATABASE_URL=postgresql:\/\/tonystack:password@localhost:5432\/tonystack/g,
        `DATABASE_URL=postgresql://${this.credentials.dbUser}:${this.credentials.dbPassword}@localhost:5432/${this.credentials.dbName}`,
      );
      await Deno.writeTextFile(envPath, envContent);

      // Update docker-compose.yml with database credentials
      const dockerComposePath = join(this.projectPath, "docker-compose.yml");
      let dockerComposeContent = await Deno.readTextFile(dockerComposePath);
      dockerComposeContent = dockerComposeContent.replace(
        /POSTGRES_DB: tonystack/g,
        `POSTGRES_DB: ${this.credentials.dbName}`,
      );
      dockerComposeContent = dockerComposeContent.replace(
        /POSTGRES_USER: tonystack/g,
        `POSTGRES_USER: ${this.credentials.dbUser}`,
      );
      dockerComposeContent = dockerComposeContent.replace(
        /POSTGRES_PASSWORD: password/g,
        `POSTGRES_PASSWORD: ${this.credentials.dbPassword}`,
      );
      dockerComposeContent = dockerComposeContent.replace(
        /pg_isready -U tonystack -d tonystack/g,
        `pg_isready -U ${this.credentials.dbUser} -d ${this.credentials.dbName}`,
      );
      await Deno.writeTextFile(dockerComposePath, dockerComposeContent);
    }

    // Configure JWT authentication (always included)
    Logger.info("Authentication system configured");
    const envExamplePath = join(this.projectPath, ".env.example");
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

    // Ensure jose dependency is in deno.json
    const denoJsonPath = join(this.projectPath, "deno.json");
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

  protected updateImports(
    imports: Record<string, unknown>,
    latestVersions: Record<string, string>,
  ): void {
    // Update API-specific dependencies

    imports["@std/dotenv"] = `jsr:@std/dotenv@^${
      latestVersions["@std/dotenv"]
    }`;
    imports["@std/dotenv/load"] = `jsr:@std/dotenv@^${
      latestVersions["@std/dotenv"]
    }/load`;
    imports["hono"] = `jsr:@hono/hono@^${latestVersions["hono"]}`;
    imports["hono/cors"] = `jsr:@hono/hono@^${latestVersions["hono"]}/cors`;
    imports["hono/logger"] = `jsr:@hono/hono@^${latestVersions["hono"]}/logger`;
    imports["hono/jwt"] = `jsr:@hono/hono@^${latestVersions["hono"]}/jwt`;

    imports["drizzle-orm"] = `npm:drizzle-orm@^${
      latestVersions["drizzle-orm"]
    }`;
    imports["drizzle-orm/pg-core"] = `npm:drizzle-orm@^${
      latestVersions["drizzle-orm"]
    }/pg-core`;
    imports["drizzle-orm/postgres-js"] = `npm:drizzle-orm@^${
      latestVersions["drizzle-orm"]
    }/postgres-js`;
    imports["drizzle-kit"] = `npm:drizzle-kit@^${
      latestVersions["drizzle-kit"]
    }`;
    imports["drizzle-zod"] = `npm:drizzle-zod@^${
      latestVersions["drizzle-zod"]
    }`;
    imports["postgres"] = `npm:postgres@^${latestVersions["postgres"]}`;
    imports["zod"] = `npm:zod@^${latestVersions["zod"]}`;

    if (latestVersions["jose"]) {
      imports["jose"] = `npm:jose@^${latestVersions["jose"]}`;
    }
  }

  protected async postCreationSetup(): Promise<void> {
    Logger.newLine();
    Logger.success("API project created successfully!");
    Logger.newLine();

    // Setup environment files
    Logger.step("Setting up environment...");

    // Enable migrations tracking for user projects
    // (Template has migrations/ gitignored, but user projects should track them)
    await this.enableMigrationsTracking();

    // 1. Copy .env.example to .env automatically
    const envExamplePath = join(this.projectPath, ".env.example");
    const envPath = join(this.projectPath, ".env");
    await Deno.copyFile(envExamplePath, envPath);

    // Update DATABASE_URL with correct database name
    if (this.credentials) {
      let envContent = await Deno.readTextFile(envPath);
      envContent = envContent.replace(
        /DATABASE_URL=postgresql:\/\/[^:]+:[^@]+@[^/]+\/\w+/,
        `DATABASE_URL=postgresql://${this.credentials.dbUser}:${this.credentials.dbPassword}@localhost:5432/${this.credentials.dbName}`,
      );
      await Deno.writeTextFile(envPath, envContent);
      Logger.info(".env file created");

      // 2. Create/Setup .env.development.local
      const envDevPath = join(this.projectPath, ".env.development.local");
      const envDevContent =
        `# Development environment - auto-generated by tstack CLI\n` +
        `ENVIRONMENT=development\n` +
        `DATABASE_URL=postgresql://${this.credentials.dbUser}:${this.credentials.dbPassword}@localhost:5432/${this.credentials.dbName}\n` +
        `\n` +
        `# S3 Storage (optional - for image uploads)\n` +
        `# AWS_ACCESS_KEY_ID=your_access_key\n` +
        `# AWS_SECRET_ACCESS_KEY=your_secret_key\n` +
        `# S3_BUCKET_NAME=your-bucket\n` +
        `# S3_REGION=us-east-1\n` +
        `# S3_PREFIX=your-app/dev\n`;
      await Deno.writeTextFile(envDevPath, envDevContent);
      Logger.info(".env.development.local configured");

      // 3. Create/Setup .env.test.local with test database name
      const envTestPath = join(this.projectPath, ".env.test.local");
      const envTestContent =
        `# Test environment - auto-generated by tstack CLI\n` +
        `ENVIRONMENT=test\n` +
        `DATABASE_URL=postgresql://${this.credentials.dbUser}:${this.credentials.dbPassword}@localhost:5432/${this.testDbName}\n`;
      await Deno.writeTextFile(envTestPath, envTestContent);
      Logger.info(`.env.test.local configured (database: ${this.testDbName})`);

      // 4. Create/Setup .env.production.local template
      const envProdPath = join(this.projectPath, ".env.production.local");
      const envProdContent =
        `# Production environment - configure before deployment\n` +
        `ENVIRONMENT=production\n` +
        `DATABASE_URL=postgresql://your_user:your_password@your_host:5432/${this.prodDbName}\n` +
        `\n` +
        `# S3 Storage (required for image uploads in production)\n` +
        `# AWS_ACCESS_KEY_ID=your_access_key\n` +
        `# AWS_SECRET_ACCESS_KEY=your_secret_key\n` +
        `# S3_BUCKET_NAME=your-bucket\n` +
        `# S3_REGION=us-east-1\n` +
        `# S3_PREFIX=your-app/prod\n`;
      await Deno.writeTextFile(envProdPath, envProdContent);
      Logger.info(
        `.env.production.local template ready (database: ${this.prodDbName})`,
      );

      Logger.newLine();

      // Try to create databases automatically
      if (!this.options.skipDbSetup) {
        Logger.step("Setting up databases...");
        await setupDatabases(
          this.credentials.dbName,
          this.testDbName!,
          this.prodDbName!,
          this.credentials.dbUser,
          this.credentials.dbPassword,
        );
      }
    } else {
      Logger.info(".env file created");
    }
  }

  protected async saveProjectMetadata(): Promise<void> {
    const now = Date.now();
    await saveProject({
      name: this.options.projectName,
      type: "api",
      folderName: this.folderName,
      path: this.projectPath,
      databases: this.credentials
        ? {
          dev: this.credentials.dbName,
          test: this.testDbName,
          prod: this.prodDbName,
        }
        : undefined,
      status: "created",
      createdAt: this.existingCreatedAt || now, // Preserve original createdAt if recreating
      updatedAt: now,
    });
  }

  protected showSuccessMessage(): void {
    Logger.newLine();
    Logger.divider();
    Logger.newLine();

    Logger.subtitle("[SUCCESS] Setup Complete!");
    Logger.newLine();

    if (this.credentials && !this.options.skipDbSetup) {
      Logger.subtitle("Database Configuration:");
      Logger.code(`Database: ${this.credentials.dbName}`);
      Logger.code(`User: ${this.credentials.dbUser}`);
      Logger.code(`Password: ${this.credentials.dbPassword}`);
      Logger.code(
        `URL: postgresql://${this.credentials.dbUser}:${this.credentials.dbPassword}@localhost:5432/${this.credentials.dbName}`,
      );
      Logger.newLine();
    }

    Logger.subtitle("Next Steps:");
    Logger.newLine();

    Logger.info("1. Navigate to your project:");
    Logger.code(`cd ${this.folderName}`);
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

    Logger.subtitle("🔐 Authentication System Included:");
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
    Logger.code("PUT /auth/change-password - Change password (requires token)");
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
    Logger.warning("[WARNING] Change superadmin password in production!");
    Logger.newLine();

    Logger.subtitle("Your API will be available at:");
    Logger.code("http://localhost:8000");
    Logger.newLine();
  }

  /**
   * Remove migrations/ from .gitignore so user projects track their migrations
   * The template has it gitignored, but scaffolded projects should commit migrations
   */
  private async enableMigrationsTracking(): Promise<void> {
    const gitignorePath = join(this.projectPath, ".gitignore");
    try {
      let content = await Deno.readTextFile(gitignorePath);

      // Remove migrations/ line and its comment
      content = content.replace(
        /# Migrations \(generated fresh from schema for this template\)\n# Note: User projects SHOULD commit their migrations for schema history\nmigrations\/\n\n?/g,
        "",
      );

      // Also handle simpler format if comment is different
      content = content.replace(/migrations\/\n/g, "");

      await Deno.writeTextFile(gitignorePath, content);
      Logger.info("Migrations tracking enabled (removed from .gitignore)");
    } catch {
      // .gitignore doesn't exist or can't be read - not critical
    }
  }
}
