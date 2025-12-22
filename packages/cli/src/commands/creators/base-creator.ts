import { dirname, join } from "@std/path";
import { copy } from "@std/fs";
import { Logger } from "../../utils/logger.ts";
import {
  extractVersion,
  fetchAllLatestVersions,
} from "../../utils/versionFetcher.ts";
import { getProject, updateProject } from "../../utils/projectStore.ts";

export interface BaseCreateOptions {
  projectName: string;
  projectType: "api" | "admin-ui" | "store" | "workspace";
  targetDir?: string;
  latest?: boolean;
  skipDbSetup?: boolean;
  forceOverwrite?: boolean;
  skipListing?: boolean;
}

export interface ProjectCreatorResult {
  folderName: string;
  projectPath: string;
  success: boolean;
}

/**
 * Base class for project creators
 * Contains common functionality shared across all project types
 */
export abstract class BaseProjectCreator {
  protected options: BaseCreateOptions;
  protected folderName: string;
  protected projectPath: string;
  protected existingCreatedAt?: number; // Preserve original createdAt when recreating

  constructor(options: BaseCreateOptions) {
    this.options = options;

    // Determine folder name based on type
    const typeSuffix = options.projectType === "workspace"
      ? ""
      : `-${options.projectType}`;
    const alreadyHasSuffix = options.projectName.endsWith(typeSuffix);
    this.folderName = alreadyHasSuffix
      ? options.projectName
      : `${options.projectName}${typeSuffix}`;

    this.projectPath = join(options.targetDir || Deno.cwd(), this.folderName);
  }

  /**
   * Main creation flow - Template Method Pattern
   */
  async create(): Promise<ProjectCreatorResult> {
    try {
      // Step 1: Validate project name
      this.validateProjectName();

      // Step 2: Handle existing project
      await this.handleExistingProject();

      // Step 3: Get starter template path
      const starterPath = this.getStarterPath();

      // Step 4: Copy template files
      await this.copyTemplate(starterPath);

      // Step 5: Configure project (type-specific)
      await this.configureProject();

      // Step 6: Update dependencies if --latest flag
      if (this.options.latest) {
        await this.updateDependencies();
      }

      // Step 7: Post-creation setup (type-specific)
      await this.postCreationSetup();

      // Step 8: Save project metadata
      await this.saveProjectMetadata();

      // Step 9: Show success message
      this.showSuccessMessage();

      return {
        folderName: this.folderName,
        projectPath: this.projectPath,
        success: true,
      };
    } catch (error) {
      Logger.error(`Failed to create project: ${error}`);
      throw error;
    }
  }

  /**
   * Validate project name
   */
  protected validateProjectName(): void {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(this.options.projectName)) {
      throw new Error(
        `Invalid project name: "${this.options.projectName}". Use only letters, numbers, hyphens, and underscores.`,
      );
    }
  }

  /**
   * Handle existing project (prompt or error)
   */
  protected async handleExistingProject(): Promise<void> {
    const existingProject = await getProject(this.folderName);
    const folderExists = await this.dirExists(this.projectPath);

    // Preserve original createdAt if project is being recreated
    if (existingProject) {
      this.existingCreatedAt = existingProject.createdAt;
    }

    if (existingProject) {
      if (existingProject.status === "created" && folderExists) {
        Logger.warning(`Project "${this.folderName}" already exists.`);
        Logger.info(`Path: ${this.projectPath}`);
        Logger.info(`Status: ${existingProject.status}`);
        Logger.info(
          `Created: ${new Date(existingProject.createdAt).toLocaleString()}`,
        );
        Logger.newLine();

        const isTestMode = this.options.skipDbSetup === true;

        if (!this.options.forceOverwrite) {
          if (isTestMode) {
            throw new Error("Project already exists");
          }

          const overwrite = prompt("Do you want to overwrite it? (yes/no):");
          if (overwrite?.toLowerCase() !== "yes") {
            Logger.info("Operation cancelled.");
            Deno.exit(0);
          }
        }

        Logger.warning("Overwriting existing project...");
        Logger.newLine();

        await updateProject(this.folderName, { status: "destroying" });
        await Deno.remove(this.projectPath, { recursive: true });
        await updateProject(this.folderName, { status: "destroyed" });
      } else if (existingProject.status === "created" && !folderExists) {
        Logger.warning(
          `Metadata exists for "${this.folderName}" but folder is missing.`,
        );
        Logger.info("Recreating project with existing metadata...");
        Logger.newLine();
        await updateProject(this.folderName, { status: "creating" });
      } else if (existingProject.status === "destroyed") {
        Logger.info(
          `Recreating previously destroyed project "${this.folderName}"...`,
        );
        Logger.newLine();
        await updateProject(this.folderName, { status: "creating" });
      } else if (existingProject.status === "creating") {
        Logger.warning(
          `Project "${this.folderName}" has incomplete creation (status: creating).`,
        );
        Logger.info("Cleaning up and starting fresh...");
        Logger.newLine();
        if (folderExists) {
          await Deno.remove(this.projectPath, { recursive: true });
        }
        await updateProject(this.folderName, { status: "creating" });
      }
    } else if (folderExists) {
      throw new Error(
        `Directory "${this.folderName}" already exists at ${this.projectPath} but is not tracked by TStack CLI.\n` +
          `Please remove it manually or choose a different name.`,
      );
    }
  }

  /**
   * Get starter template path
   */
  protected getStarterPath(): string {
    // Get CLI root: packages/cli/src/commands/creators/base-creator.ts
    // -> dirname 5 times to get to packages/
    const currentFilePath = new URL(import.meta.url).pathname;
    const packagesDir = dirname(
      dirname(dirname(dirname(dirname(currentFilePath)))),
    );

    // Join with starter name
    const starterName = this.getStarterTemplateName();
    const starterPath = join(packagesDir, starterName);

    try {
      if (!Deno.statSync(starterPath).isDirectory) {
        throw new Error(
          `${starterName} template not found. Make sure TStack is installed correctly.\n` +
            `Expected path: ${starterPath}`,
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("template not found")) {
        throw err;
      }
      throw new Error(
        `${starterName} template not found. Make sure TStack is installed correctly.\n` +
          `Expected path: ${starterPath}\n` +
          `Original error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return starterPath;
  }

  /**
   * Product listing entity directories to exclude when --skip-listing is used
   */
  protected static readonly LISTING_ENTITIES = [
    "brands",
    "categories",
    "products",
    "product_images",
    "product_variants",
    "variant_options",
  ];

  /**
   * Copy template files
   */
  protected async copyTemplate(starterPath: string): Promise<void> {
    Logger.step(`Cooking your ${this.options.projectType} starter template...`);
    Logger.newLine();

    // Create project directory if it doesn't exist
    await Deno.mkdir(this.projectPath, { recursive: true });

    for await (const entry of Deno.readDir(starterPath)) {
      const sourcePath = join(starterPath, entry.name);
      const destPath = join(this.projectPath, entry.name);

      Logger.info(`Cooking ${entry.name}...`);

      if (this.options.skipListing && entry.name === "src") {
        // Special handling for src directory to filter out listing entities
        await this.copyDirectoryWithFilter(sourcePath, destPath);
      } else {
        await copy(sourcePath, destPath, { overwrite: false });
      }
    }
  }

  /**
   * Copy directory with filtering for listing entities
   */
  protected async copyDirectoryWithFilter(
    srcPath: string,
    destPath: string,
  ): Promise<void> {
    await Deno.mkdir(destPath, { recursive: true });

    for await (const entry of Deno.readDir(srcPath)) {
      const sourcePath = join(srcPath, entry.name);
      const targetPath = join(destPath, entry.name);

      if (entry.name === "entities" && this.options.skipListing) {
        // Filter entities directory
        await this.copyEntitiesWithFilter(sourcePath, targetPath);
      } else if (entry.isDirectory) {
        await copy(sourcePath, targetPath, { overwrite: false });
      } else {
        await Deno.copyFile(sourcePath, targetPath);
      }
    }
  }

  /**
   * Copy entities directory excluding listing entities
   */
  protected async copyEntitiesWithFilter(
    srcPath: string,
    destPath: string,
  ): Promise<void> {
    await Deno.mkdir(destPath, { recursive: true });

    for await (const entry of Deno.readDir(srcPath)) {
      const sourcePath = join(srcPath, entry.name);
      const targetPath = join(destPath, entry.name);

      // Skip listing entities
      if (BaseProjectCreator.LISTING_ENTITIES.includes(entry.name)) {
        Logger.info(`  Skipping listing entity: ${entry.name}`);
        continue;
      }

      if (entry.isDirectory) {
        await copy(sourcePath, targetPath, { overwrite: false });
      } else {
        // Handle index.ts - need to filter out listing entity exports
        if (entry.name === "index.ts") {
          await this.copyFilteredIndexFile(sourcePath, targetPath);
        } else {
          await Deno.copyFile(sourcePath, targetPath);
        }
      }
    }
  }

  /**
   * Copy index.ts file with listing entity exports filtered out
   */
  protected async copyFilteredIndexFile(
    srcPath: string,
    destPath: string,
  ): Promise<void> {
    const content = await Deno.readTextFile(srcPath);
    const lines = content.split("\n");

    const filteredLines = lines.filter((line) => {
      // Check if line exports a listing entity
      for (const entity of BaseProjectCreator.LISTING_ENTITIES) {
        if (
          line.includes(`from "./${entity}`) ||
          line.includes(`from './${entity}`)
        ) {
          Logger.info(`  Filtering export: ${entity}`);
          return false;
        }
      }
      return true;
    });

    await Deno.writeTextFile(destPath, filteredLines.join("\n"));
  }

  /**
   * Update dependencies with latest versions
   */
  protected async updateDependencies(): Promise<void> {
    const denoJsonPath = join(this.projectPath, "deno.json");
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

    // Update imports (type-specific)
    if (denoJson.imports) {
      this.updateImports(denoJson.imports, latestVersions);
    }

    await Deno.writeTextFile(
      denoJsonPath,
      JSON.stringify(denoJson, null, 2) + "\n",
    );

    Logger.info("Updated deno.json with latest stable versions");
  }

  /**
   * Helper: Check if directory exists
   */
  protected async dirExists(path: string): Promise<boolean> {
    try {
      const stat = await Deno.stat(path);
      return stat.isDirectory;
    } catch {
      return false;
    }
  }

  // ========== Abstract methods (must be implemented by subclasses) ==========

  /**
   * Get the starter template name (e.g., "api-starter", "admin-ui-starter")
   */
  protected abstract getStarterTemplateName(): string;

  /**
   * Configure project-specific files (env, docker-compose, etc.)
   */
  protected abstract configureProject(): Promise<void>;

  /**
   * Update dependency imports with latest versions
   */
  protected abstract updateImports(
    imports: Record<string, unknown>,
    latestVersions: Record<string, string>,
  ): void;

  /**
   * Post-creation setup (env files, databases, etc.)
   */
  protected abstract postCreationSetup(): Promise<void>;

  /**
   * Save project metadata to KV store
   */
  protected abstract saveProjectMetadata(): Promise<void>;

  /**
   * Show success message with next steps
   */
  protected abstract showSuccessMessage(): void;
}
