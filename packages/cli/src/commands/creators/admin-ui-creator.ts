import { join } from "@std/path";

import { Logger } from "../../utils/logger.ts";
import { saveProject } from "../../utils/projectStore.ts";
import { BaseProjectCreator } from "./base-creator.ts";

/**
 * Admin UI Project Creator
 * Handles creation of TStack Admin UI projects (Fresh-based)
 */
export class AdminUiProjectCreator extends BaseProjectCreator {
  protected getStarterTemplateName(): string {
    return "admin-ui-starter";
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
    // Update .env.example with API URL if needed (already has defaults)
    const envPath = join(this.projectPath, ".env.example");
    if (await this.fileExists(envPath)) {
      Logger.info("Admin UI environment configured");
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
    if (latestVersions["daisyui"]) {
      imports["daisyui"] = `npm:daisyui@^${latestVersions["daisyui"]}`;
    }
    if (latestVersions["autoprefixer"]) {
      imports["autoprefixer"] = `npm:autoprefixer@^${
        latestVersions["autoprefixer"]
      }`;
    }
    if (latestVersions["postcss"]) {
      imports["postcss"] = `npm:postcss@^${latestVersions["postcss"]}`;
    }
  }

  protected async postCreationSetup(): Promise<void> {
    Logger.newLine();
    Logger.success("Admin UI project created successfully!");
    Logger.newLine();

    Logger.step("Setting up admin UI environment...");

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
      type: "admin-ui",
      folderName: this.folderName,
      path: this.projectPath,
      databases: undefined, // Admin UI doesn't have its own database
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

    Logger.subtitle("Next Steps:");
    Logger.newLine();

    Logger.info("1. Navigate to your project:");
    Logger.code(`cd ${this.folderName}`);
    Logger.newLine();

    Logger.info("2. Start development server:");
    Logger.code("deno task dev");
    Logger.newLine();

    Logger.subtitle("Admin UI Features:");
    Logger.newLine();
    Logger.info("✅ Config-driven CRUD system");
    Logger.info("✅ Generic DataTable, ShowPage, and GenericForm components");
    Logger.info("✅ Auto-generated admin routes from entity configs");
    Logger.info("✅ DaisyUI + Tailwind CSS styling");
    Logger.info("✅ Fresh 2.2.0 with Preact");
    Logger.info("✅ Rails ActiveAdmin-style architecture");
    Logger.newLine();

    Logger.subtitle("📚 Documentation:");
    Logger.newLine();
    Logger.info("Read the following guides in your project:");
    Logger.code("cat DRY_ADMIN_ARCHITECTURE.md");
    Logger.code("cat FRESH_UI_SCAFFOLD_PATTERN.md");
    Logger.newLine();

    Logger.subtitle("🔗 Connect to Backend API:");
    Logger.newLine();
    Logger.info("Update API_BASE_URL in .env:");
    Logger.code("API_BASE_URL=http://localhost:8000");
    Logger.newLine();

    Logger.subtitle("Your Admin UI will be available at:");
    Logger.code("http://localhost:5173");
    Logger.newLine();
  }
}
