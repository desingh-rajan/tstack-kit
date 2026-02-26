import { join } from "@std/path";

import { Logger } from "../../utils/logger.ts";
import { saveProject } from "../../utils/projectStore.ts";
import { BaseProjectCreator } from "./base-creator.ts";

/**
 * Status Page Project Creator
 * Handles creation of TStack Status Page projects (Hono + Deno KV)
 */
export class StatusProjectCreator extends BaseProjectCreator {
  protected getStarterTemplateName(): string {
    return "status-starter";
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  protected async configureProject(): Promise<void> {
    // Copy .env.example to .env and configure service URLs
    const envExamplePath = join(this.projectPath, ".env.example");
    const envPath = join(this.projectPath, ".env");
    if (await this.fileExists(envExamplePath)) {
      let envContent = await Deno.readTextFile(envExamplePath);

      // Update the site title based on project name
      const titleName = this.options.projectName
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      envContent = envContent.replace(
        /SITE_TITLE=.*/,
        `SITE_TITLE=${titleName} Status`,
      );

      await Deno.writeTextFile(envPath, envContent);
      Logger.info("Status page environment configured");
    }
  }

  protected updateImports(
    _imports: Record<string, unknown>,
    _latestVersions: Record<string, string>,
  ): void {
    // No special version updates needed for the status starter
  }

  protected postCreationSetup(): Promise<void> {
    Logger.newLine();
    Logger.success("Status page project created successfully!");
    Logger.newLine();
    return Promise.resolve();
  }

  protected async saveProjectMetadata(): Promise<void> {
    const now = Date.now();
    await saveProject({
      name: this.options.projectName,
      type: "status",
      folderName: this.folderName,
      path: this.projectPath,
      databases: undefined, // Status page uses Deno KV, no external DB
      status: "created",
      createdAt: this.existingCreatedAt || now,
      updatedAt: now,
    });
  }

  protected showSuccessMessage(): void {
    Logger.newLine();
    Logger.divider();
    Logger.newLine();

    Logger.subtitle("[SUCCESS] Status Page Created!");
    Logger.newLine();

    Logger.subtitle("Next Steps:");
    Logger.newLine();

    Logger.info("1. Navigate to your project:");
    Logger.code(`cd ${this.folderName}`);
    Logger.newLine();

    Logger.info("2. Update .env with your service URLs:");
    Logger.code("API_URL=http://localhost:8000");
    Logger.code("STOREFRONT_URL=http://localhost:3000");
    Logger.code("ADMIN_URL=http://localhost:3001");
    Logger.newLine();

    Logger.info("3. Start the status page:");
    Logger.code("deno task dev");
    Logger.newLine();

    Logger.subtitle("Status Page Features:");
    Logger.newLine();
    Logger.info("-- Monitors API, Storefront, and Admin UI health");
    Logger.info("-- 90-day uptime history with daily resolution");
    Logger.info("-- Deno KV storage (persistent, zero dependencies)");
    Logger.info("-- Auto-refreshes every 60 seconds");
    Logger.newLine();

    Logger.subtitle("Your Status Page will be available at:");
    Logger.code("http://localhost:8001");
    Logger.newLine();
  }
}
