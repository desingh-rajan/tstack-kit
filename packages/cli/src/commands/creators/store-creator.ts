import { join } from "@std/path";

import { Logger } from "../../utils/logger.ts";
import { saveProject } from "../../utils/projectStore.ts";
import { BaseProjectCreator } from "./base-creator.ts";

/**
 * Store Project Creator
 * Handles creation of TStack Storefront projects (Fresh-based)
 */
export class StoreProjectCreator extends BaseProjectCreator {
  protected getStarterTemplateName(): string {
    return "storefront-starter";
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
    // Update .env.example with API URL if needed
    const envPath = join(this.projectPath, ".env.example");
    if (await this.fileExists(envPath)) {
      Logger.info("Storefront environment configured");
    }
  }

  protected updateImports(
    imports: Record<string, unknown>,
    latestVersions: Record<string, string>,
  ): void {
    // Update Fresh and UI-specific dependencies
    if (latestVersions["fresh"]) {
      imports["fresh"] = `jsr:@fresh/core@^${latestVersions["fresh"]}`;
    }
    if (latestVersions["@fresh/plugin-vite"]) {
      imports["@fresh/plugin-vite"] = `jsr:@fresh/plugin-vite@^${
        latestVersions["@fresh/plugin-vite"]
      }`;
    }
    if (latestVersions["preact"]) {
      imports["preact"] = `npm:preact@^${latestVersions["preact"]}`;
    }
    if (latestVersions["@preact/signals"]) {
      imports["@preact/signals"] = `npm:@preact/signals@^${
        latestVersions["@preact/signals"]
      }`;
    }
    if (latestVersions["vite"]) {
      imports["vite"] = `npm:vite@^${latestVersions["vite"]}`;
    }
    if (latestVersions["tailwindcss"]) {
      imports["tailwindcss"] = `npm:tailwindcss@^${
        latestVersions["tailwindcss"]
      }`;
    }
    if (latestVersions["@tailwindcss/vite"]) {
      imports["@tailwindcss/vite"] = `npm:@tailwindcss/vite@^${
        latestVersions["@tailwindcss/vite"]
      }`;
    }
  }

  protected async postCreationSetup(): Promise<void> {
    Logger.newLine();
    Logger.success("Storefront project created successfully!");
    Logger.newLine();

    Logger.step("Setting up storefront environment...");

    // Copy .env.example to .env
    const envExamplePath = join(this.projectPath, ".env.example");
    const envPath = join(this.projectPath, ".env");
    if (await this.fileExists(envExamplePath)) {
      await Deno.copyFile(envExamplePath, envPath);
      Logger.info(".env file created");
    }

    // Install npm dependencies (vite, tailwindcss, etc.)
    Logger.step("Installing dependencies...");
    const installCmd = new Deno.Command("deno", {
      args: ["install"],
      cwd: this.projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    const installResult = await installCmd.output();
    if (installResult.success) {
      Logger.info("Dependencies installed");
    } else {
      Logger.warning(
        "Failed to install dependencies. Run 'deno install' manually.",
      );
    }

    Logger.newLine();
  }

  protected async saveProjectMetadata(): Promise<void> {
    const now = Date.now();
    await saveProject({
      name: this.options.projectName,
      type: "store",
      folderName: this.folderName,
      path: this.projectPath,
      databases: undefined, // Storefront doesn't have its own database
      status: "created",
      createdAt: this.existingCreatedAt || now,
      updatedAt: now,
    });
  }

  protected showSuccessMessage(): void {
    Logger.newLine();
    Logger.divider();
    Logger.newLine();

    Logger.subtitle("[SUCCESS] Setup Complete!");
    Logger.newLine();

    Logger.subtitle("Next Steps:");
    Logger.newLine();

    Logger.info("1. Navigate to your project:");
    Logger.code(`cd ${this.folderName}`);
    Logger.newLine();

    Logger.info("2. Start development server:");
    Logger.code("deno task dev");
    Logger.newLine();

    Logger.subtitle("Storefront Features:");
    Logger.newLine();
    Logger.info("✅ Fresh 2.x + Preact");
    Logger.info("✅ Tailwind CSS 4.x");
    Logger.info("✅ Public-facing e-commerce layout");
    Logger.newLine();

    Logger.subtitle("🔗 Connect to Backend API:");
    Logger.newLine();
    Logger.info("Update API_BASE_URL in .env:");
    Logger.code("API_BASE_URL=http://localhost:8000");
    Logger.newLine();

    Logger.subtitle("Your Storefront will be available at:");
    Logger.code("http://localhost:8000 (proxied) or specific port");
    Logger.newLine();
  }
}
