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

  /**
   * Admin paths that are only available in listing scope and above
   */
  private static readonly LISTING_MENU_PATHS = [
    "/admin/products",
    "/admin/categories",
    "/admin/brands",
    "/admin/variant-options",
    "/admin/product-images",
    "/admin/product-variants",
  ];

  /**
   * Admin paths that are only available in commerce scope
   */
  private static readonly COMMERCE_MENU_PATHS = [
    "/admin/orders",
  ];

  /**
   * Remove out-of-scope menu items from AdminLayout.tsx after template copy.
   * core     → removes listing + commerce items
   * listing  → removes commerce items only
   * commerce → no changes (default template keeps all items)
   */
  private async patchAdminLayoutScope(): Promise<void> {
    const scope = this.resolveScope();
    if (scope === "commerce") return; // Default template already has everything

    const layoutPath = join(
      this.projectPath,
      "components",
      "layout",
      "AdminLayout.tsx",
    );

    try {
      await Deno.stat(layoutPath);
    } catch {
      Logger.warning(
        "AdminLayout.tsx not found — skipping sidebar scope patch",
      );
      return;
    }

    const pathsToRemove: string[] = [
      ...AdminUiProjectCreator.COMMERCE_MENU_PATHS,
    ];
    if (scope === "core") {
      pathsToRemove.push(...AdminUiProjectCreator.LISTING_MENU_PATHS);
    }

    let content = await Deno.readTextFile(layoutPath);

    // Remove each out-of-scope menu item line (matches the { path: "...", ... } pattern)
    for (const adminPath of pathsToRemove) {
      // Match the whole object literal line for this path, including trailing comma
      const linePattern = new RegExp(
        `\\s*\\{\\s*path:\\s*"${adminPath.replace(/\//g, "\\/")}",.*?\\},?\\n`,
        "g",
      );
      content = content.replace(linePattern, "\n");
    }

    await Deno.writeTextFile(layoutPath, content);
    Logger.info(
      `Sidebar filtered for scope "${scope}" (removed ${pathsToRemove.length} menu item(s))`,
    );
  }

  protected async postCreationSetup(): Promise<void> {
    Logger.newLine();
    Logger.success("Admin UI project created successfully!");
    Logger.newLine();

    Logger.step("Setting up admin UI environment...");

    // Patch AdminLayout.tsx sidebar to match the requested scope
    await this.patchAdminLayoutScope();

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
