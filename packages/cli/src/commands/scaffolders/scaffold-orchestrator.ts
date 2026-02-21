import { Logger } from "../../utils/logger.ts";
import { getEntityNames, isValidEntityName } from "../../utils/stringUtils.ts";
import { dirExists, writeFiles } from "../../utils/fileWriter.ts";
import type { IScaffolder } from "./base-scaffolder.ts";
import { ApiScaffolder } from "./api-scaffolder.ts";
import { AdminUiScaffolder } from "./admin-ui-scaffolder.ts";

/**
 * TODO: Add support for column/field definitions in scaffold command
 *
 * Similar to Rails scaffold syntax:
 *   tstack scaffold product name:string description:text price:number isActive:boolean
 *
 * This would:
 * 1. Auto-generate model fields in product.model.ts
 * 2. Auto-generate DTO validation in product.dto.ts
 * 3. Auto-generate type definitions in product.types.ts (admin-ui)
 * 4. Auto-generate form fields in entity config (admin-ui)
 *
 * Supported types could be:
 *   - string, text (varchar, text)
 *   - number, integer, float (numeric types)
 *   - boolean (boolean)
 *   - date, datetime (timestamp)
 *   - json (jsonb)
 *   - references:entity (foreign key)
 *
 * Example implementation:
 *   parseFieldDefinitions("name:string description:text price:number")
 *   => [{ name: "name", type: "string" }, { name: "description", type: "text" }, ...]
 */

export interface ScaffoldOptions {
  entityName: string;
  targetDir?: string;
  force?: boolean;

  // Existing API flags
  skipAdmin?: boolean;
  skipTests?: boolean;
  skipAuth?: boolean;
  skipValidation?: boolean;

  // NEW: Admin-UI control flags
  skipAdminUi?: boolean; // Skip admin-ui scaffolding
  onlyApi?: boolean; // Create API files only
  onlyAdminUi?: boolean; // Create admin-ui files only
}

/**
 * Scaffold Orchestrator
 * Coordinates API and Admin-UI scaffolding
 */
export class ScaffoldOrchestrator {
  private options: ScaffoldOptions;
  private scaffolders: IScaffolder[] = [];
  private entityName: string;

  constructor(options: ScaffoldOptions) {
    this.options = options;
    this.entityName = options.entityName;
  }

  /**
   * Main orchestration method
   */
  async execute(): Promise<void> {
    // 1. Validate
    this.validateOptions();
    this.validateEntityName();

    // 2. Get entity names
    const names = getEntityNames(this.entityName);

    // 3. Show entity info
    this.showEntityInfo(names);

    // 4. Check for existing entity
    await this.checkExistingEntity(names);

    // 5. Initialize scaffolders based on flags
    await this.initializeScaffolders(names);

    // 6. Check if any scaffolders will run
    if (this.scaffolders.length === 0) {
      Logger.warning("No files to generate (all scaffolders skipped)");
      Logger.info(
        "Note: Admin-UI scaffolding is automatic if admin-ui project exists",
      );
      return; // Don't exit in tests
    }

    // 7. Generate and write files
    await this.generateAndWriteFiles();

    // 8. Show success message
    this.showSuccessMessage();
  }

  /**
   * Validate command-line options
   */
  private validateOptions(): void {
    const { onlyApi, onlyAdminUi } = this.options;

    // Cannot use both --only-api and --only-admin-ui
    if (onlyApi && onlyAdminUi) {
      throw new Error("Cannot use --only-api and --only-admin-ui together");
    }
  }

  /**
   * Validate entity name
   */
  private validateEntityName(): void {
    if (!isValidEntityName(this.entityName)) {
      throw new Error(
        `Invalid entity name: "${this.entityName}". Use only letters, numbers, hyphens, and underscores.`,
      );
    }
  }

  /**
   * Show entity naming variations
   */
  private showEntityInfo(names: ReturnType<typeof getEntityNames>): void {
    Logger.title(`Scaffolding entity: ${this.entityName}`);
    Logger.newLine();

    Logger.info(`Entity variations:`);
    Logger.code(`Singular: ${names.singular}`);
    Logger.code(`Plural: ${names.plural}`);
    Logger.code(`PascalCase: ${names.pascalSingular}`);
    Logger.code(`Folder: ${names.snakePlural}/`);
    Logger.code(`Files: ${names.kebabSingular}.*.ts`);
    Logger.code(`Routes: /${names.kebabPlural}`);
    Logger.code(`Table name: ${names.tableName}`);
    Logger.newLine();
  }

  /**
   * Check if entity already exists
   */
  private async checkExistingEntity(
    names: ReturnType<typeof getEntityNames>,
  ): Promise<void> {
    const { targetDir = Deno.cwd(), force, onlyAdminUi } = this.options;

    // Only check API directory if we're scaffolding API files
    if (!onlyAdminUi) {
      const entityDir = join(targetDir, "src", "entities", names.snakePlural);
      const exists = await dirExists(entityDir);

      if (exists && !force) {
        throw new Error(
          `Entity "${names.snakePlural}" already exists at ${entityDir}`,
        );
      }

      if (exists && force) {
        Logger.warning(`Overwriting existing entity: ${names.snakePlural}`);
      }
    }
  }

  /**
   * Initialize scaffolders based on options
   */
  private async initializeScaffolders(
    names: ReturnType<typeof getEntityNames>,
  ): Promise<void> {
    const {
      targetDir = Deno.cwd(),
      force,
      skipAdmin,
      skipTests,
      skipAuth,
      skipValidation,
      skipAdminUi,
      onlyApi,
      onlyAdminUi,
    } = this.options;

    // Initialize API scaffolder (unless --only-admin-ui)
    if (!onlyAdminUi) {
      const apiScaffolder = new ApiScaffolder({
        entityNames: names,
        targetDir,
        force,
        skipAdmin,
        skipTests,
        skipAuth,
        skipValidation,
      });

      if (await apiScaffolder.shouldRun()) {
        this.scaffolders.push(apiScaffolder);
      }
    }

    // Initialize Admin-UI scaffolder (unless --skip-admin-ui or --only-api)
    if (!skipAdminUi && !onlyApi) {
      const adminUiScaffolder = new AdminUiScaffolder({
        entityNames: names,
        apiProjectPath: targetDir,
        force,
      });

      if (await adminUiScaffolder.shouldRun()) {
        this.scaffolders.push(adminUiScaffolder);
      }
    }
  }

  /**
   * Generate files from all active scaffolders.
   * If any step fails, previously written files are deleted in reverse order (compensation).
   */
  private async generateAndWriteFiles(): Promise<void> {
    Logger.step("Generating files...");
    Logger.newLine();

    const writtenPaths: string[] = [];

    try {
      for (const scaffolder of this.scaffolders) {
        const typeName = scaffolder.getTypeName();
        const targetDir = scaffolder.getTargetDir();
        const files = await scaffolder.generateFiles();

        Logger.info(`${typeName} files (${files.length} files):`);
        await writeFiles(targetDir, files);

        // Record written paths for rollback if a later step fails
        for (const file of files) {
          writtenPaths.push(join(targetDir, file.path));
        }

        // Call post-process hook if available (e.g., update sidebar menu)
        if (scaffolder.postProcess) {
          await scaffolder.postProcess();
        }

        Logger.newLine();
      }
    } catch (error) {
      // Roll back by deleting files written so far, in reverse order
      if (writtenPaths.length > 0) {
        Logger.warning(
          `Scaffolding failed — rolling back ${writtenPaths.length} written file(s)...`,
        );
        for (const filePath of writtenPaths.reverse()) {
          try {
            await Deno.remove(filePath);
          } catch {
            // Best-effort; file may not exist if the write itself failed
          }
        }
      }
      throw error;
    }
  }

  /**
   * Show success message with next steps
   */
  private showSuccessMessage(): void {
    const names = getEntityNames(this.entityName);
    const hasApiScaffolder = this.scaffolders.some((s) =>
      s.getTypeName() === "API"
    );
    const hasAdminUiScaffolder = this.scaffolders.some((s) =>
      s.getTypeName() === "Admin-UI"
    );

    Logger.divider();
    Logger.success(`Entity "${names.pascalSingular}" scaffolded successfully!`);
    Logger.divider();
    Logger.newLine();

    // API-specific instructions
    if (hasApiScaffolder) {
      this.showApiInstructions(names);
    }

    // Admin-UI-specific instructions
    if (hasAdminUiScaffolder) {
      this.showAdminUiInstructions(names);
    }
  }

  /**
   * Show API next steps
   */
  private showApiInstructions(names: ReturnType<typeof getEntityNames>): void {
    const { skipValidation, skipTests, skipAdmin } = this.options;

    Logger.subtitle("API Next Steps:");
    Logger.newLine();

    Logger.warning(
      "[WARNING]  IMPORTANT: The model has only id, createdAt, updatedAt by default!",
    );
    Logger.newLine();

    Logger.info("1. Add your custom fields to the model:");
    Logger.code(
      `src/entities/${names.snakePlural}/${names.kebabSingular}.model.ts`,
    );
    Logger.newLine();

    Logger.info("2. Generate and run database migration:");
    Logger.code("deno task migrate:generate");
    Logger.code("deno task migrate:run");
    Logger.newLine();

    Logger.info("3. Update validation schemas:");
    if (!skipValidation) {
      Logger.code(
        `Update DTOs in ${names.kebabSingular}.dto.ts to match your fields`,
      );
    } else {
      Logger.code(
        `[WARNING] Validation skipped - Add Zod schemas manually`,
      );
    }
    Logger.newLine();

    Logger.info("4. Start development server:");
    Logger.code("deno task dev");
    Logger.newLine();

    Logger.subtitle("API endpoints:");
    Logger.code(`GET /${names.kebabPlural}`);
    Logger.code(`GET /${names.kebabPlural}/:id`);
    Logger.code(`POST /${names.kebabPlural}`);
    Logger.code(`PUT /${names.kebabPlural}/:id`);
    Logger.code(`DELETE /${names.kebabPlural}/:id`);
    Logger.newLine();

    if (!skipAdmin) {
      Logger.subtitle("Admin endpoints:");
      Logger.code(`GET /ts-admin/${names.kebabPlural} (JSON list)`);
      Logger.code(`POST /ts-admin/${names.kebabPlural} (Create)`);
      Logger.code(`PUT /ts-admin/${names.kebabPlural}/:id (Update)`);
      Logger.code(`DELETE /ts-admin/${names.kebabPlural}/:id (Delete)`);
      Logger.newLine();
    }

    if (!skipTests) {
      Logger.subtitle("Run tests:");
      Logger.code(
        `ENVIRONMENT=test deno test --allow-all src/entities/${names.snakePlural}/${names.kebabSingular}.test.ts`,
      );
      Logger.newLine();
    }
  }

  /**
   * Show Admin-UI next steps
   */
  private showAdminUiInstructions(
    names: ReturnType<typeof getEntityNames>,
  ): void {
    Logger.subtitle("Admin-UI Next Steps:");
    Logger.newLine();

    Logger.warning(
      "[TODO]  Customize entity configuration to match your model fields!",
    );
    Logger.newLine();

    Logger.info("1. Update entity configuration:");
    Logger.code(`config/entities/${names.snakePlural}.config.tsx`);
    Logger.code("  → Add your entity fields");
    Logger.code("  → Set displayField (e.g., 'title', 'name')");
    Logger.code("  → Configure field types, validation, visibility");
    Logger.newLine();

    Logger.info("2. Create service file (if not exists):");
    Logger.code(
      `entities/${names.snakePlural}/${names.kebabSingular}.service.ts`,
    );
    Logger.code("  → Implement CRUD methods that call your API");
    Logger.newLine();

    Logger.info("3. Create types file (if not exists):");
    Logger.code(
      `entities/${names.snakePlural}/${names.kebabSingular}.types.ts`,
    );
    Logger.code(`  → Export ${names.pascalSingular} type`);
    Logger.newLine();

    Logger.info("4. Start dev server:");
    Logger.code("deno task dev");
    Logger.newLine();

    Logger.subtitle("Admin-UI routes:");
    Logger.code(`/admin/${names.snakePlural} (List)`);
    Logger.code(`/admin/${names.snakePlural}/new (Create)`);
    Logger.code(`/admin/${names.snakePlural}/:id (Show)`);
    Logger.code(`/admin/${names.snakePlural}/:id/edit (Edit)`);
    Logger.newLine();

    Logger.info("Features:");
    Logger.code("• Generic components (DataTable, GenericForm, ShowPage)");
    Logger.code("• Automatic pagination, search, sorting");
    Logger.code("• Type-safe configuration");
    Logger.code("• Role-based access control");
    Logger.newLine();
  }
}

function join(...args: string[]): string {
  return args.join("/").replace(/\/+/g, "/");
}
