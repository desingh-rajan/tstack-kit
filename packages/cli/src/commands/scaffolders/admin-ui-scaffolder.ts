import { join } from "@std/path";
import {
  BaseScaffolder,
  type BaseScaffolderOptions,
} from "./base-scaffolder.ts";
import type { FileToWrite } from "../../utils/fileWriter.ts";
import {
  type AdminUiProjectInfo,
  detectAdminUiProject,
} from "../../utils/adminUiDetection.ts";
import { generateEntityConfigTemplate } from "../../templates/admin-ui/entity-config.ts";
import { generateListPageTemplate } from "../../templates/admin-ui/list-page.ts";
import { generateShowPageTemplate } from "../../templates/admin-ui/show-page.ts";
import { generateCreatePageTemplate } from "../../templates/admin-ui/create-page.ts";
import { generateEditPageTemplate } from "../../templates/admin-ui/edit-page.ts";
import { generateEntityServiceTemplate } from "../../templates/admin-ui/entity-service.ts";
import { generateEntityTypesTemplate } from "../../templates/admin-ui/entity-types.ts";
import { Logger } from "../../utils/logger.ts";

export interface AdminUiScaffolderOptions extends BaseScaffolderOptions {
  apiProjectPath: string;
}

/**
 * Admin-UI Scaffolder - Generates Fresh admin UI files
 */
export class AdminUiScaffolder extends BaseScaffolder {
  private apiProjectPath: string;
  private adminUiInfo: AdminUiProjectInfo | null = null;

  constructor(options: AdminUiScaffolderOptions) {
    super(options);
    this.apiProjectPath = options.apiProjectPath;
  }

  async shouldRun(): Promise<boolean> {
    // Detect admin-ui project
    this.adminUiInfo = await detectAdminUiProject(this.apiProjectPath);
    return this.adminUiInfo.exists;
  }

  getTargetDir(): string {
    if (!this.adminUiInfo || !this.adminUiInfo.exists) {
      throw new Error("Admin-UI project not detected");
    }
    return this.adminUiInfo.path;
  }

  getTypeName(): string {
    return "Admin-UI";
  }

  generateFiles(): Promise<FileToWrite[]> {
    const names = this.entityNames;
    const files: FileToWrite[] = [];

    // 1. Entity types (must be first - other files depend on it)
    files.push({
      path: join(
        "entities",
        names.snakePlural,
        `${names.kebabSingular}.types.ts`,
      ),
      content: generateEntityTypesTemplate(names),
      description: "Entity types",
    });

    // 2. Entity service (depends on types)
    files.push({
      path: join(
        "entities",
        names.snakePlural,
        `${names.kebabSingular}.service.ts`,
      ),
      content: generateEntityServiceTemplate(names),
      description: "Entity service",
    });

    // 3. Entity configuration (depends on types and service)
    files.push({
      path: join("config", "entities", `${names.snakePlural}.config.tsx`),
      content: generateEntityConfigTemplate(names),
      description: "Entity configuration",
    });

    // 4. List page
    files.push({
      path: join("routes", "admin", names.snakePlural, "index.tsx"),
      content: generateListPageTemplate(names),
      description: "List page",
    });

    // 5. Show page
    files.push({
      path: join("routes", "admin", names.snakePlural, "[id].tsx"),
      content: generateShowPageTemplate(names),
      description: "Show page",
    });

    // 6. Create page
    files.push({
      path: join("routes", "admin", names.snakePlural, "new.tsx"),
      content: generateCreatePageTemplate(names),
      description: "Create page",
    });

    // 7. Edit page
    files.push({
      path: join("routes", "admin", names.snakePlural, "[id]", "edit.tsx"),
      content: generateEditPageTemplate(names),
      description: "Edit page",
    });

    return Promise.resolve(files);
  }

  /**
   * Add menu item to AdminLayout.tsx sidebar
   */
  async addToSidebarMenu(): Promise<boolean> {
    const names = this.entityNames;
    const layoutPath = join(
      this.getTargetDir(),
      "components",
      "layout",
      "AdminLayout.tsx",
    );

    try {
      const content = await Deno.readTextFile(layoutPath);

      // Check if menu item already exists
      const menuItemPath = `/admin/${names.snakePlural}`;
      if (content.includes(menuItemPath)) {
        Logger.info(
          `Menu item for ${names.pascalPlural} already exists in sidebar`,
        );
        return false;
      }

      // Find the menuItems array and add the new item
      // Pattern: { path: "/admin/xxx", label: "Xxx", icon: "📦" },
      const menuItemsPattern = /const menuItems = \[\s*\n([\s\S]*?)\s*\];/;
      const match = content.match(menuItemsPattern);

      if (!match) {
        Logger.warning("Could not find menuItems array in AdminLayout.tsx");
        return false;
      }

      // Get a suitable icon based on entity name
      const icon = this.getEntityIcon(names.singular);

      // Create the new menu item
      const newMenuItem =
        `    { path: "/admin/${names.snakePlural}", label: "${names.pascalPlural}", icon: "${icon}" },`;

      // Insert new item before the last item (usually Users or Site Settings)
      const existingItems = match[1];
      const itemLines = existingItems.trim().split("\n");

      // Insert before the last two items (Site Settings and Users are usually last)
      const insertIndex = Math.max(0, itemLines.length - 2);
      itemLines.splice(insertIndex, 0, newMenuItem);

      const newMenuItems = `const menuItems = [\n${itemLines.join("\n")}\n  ];`;
      const newContent = content.replace(menuItemsPattern, newMenuItems);

      await Deno.writeTextFile(layoutPath, newContent);
      Logger.success(`Added ${names.pascalPlural} to sidebar menu`);
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        Logger.warning("AdminLayout.tsx not found - skipping sidebar update");
      } else {
        Logger.warning(
          `Could not update sidebar: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      return false;
    }
  }

  /**
   * Get a suitable icon for the entity
   */
  private getEntityIcon(entityName: string): string {
    const iconMap: Record<string, string> = {
      product: "📦",
      article: "📄",
      post: "📝",
      user: "👤",
      order: "🛒",
      category: "📁",
      tag: "🏷️",
      comment: "💬",
      review: "⭐",
      image: "🖼️",
      file: "📎",
      document: "📋",
      setting: "⚙️",
      config: "🔧",
      notification: "🔔",
      message: "✉️",
      payment: "💳",
      invoice: "🧾",
      customer: "🧑",
      vendor: "🏪",
      supplier: "🚚",
      employee: "👔",
      project: "📊",
      task: "✅",
      event: "📅",
      booking: "🗓️",
      appointment: "⏰",
      report: "📈",
      dashboard: "📉",
      log: "📜",
      audit: "🔍",
      permission: "🔐",
      role: "🎭",
      team: "👥",
      organization: "🏢",
      location: "📍",
      address: "🏠",
      country: "🌍",
      currency: "💰",
      language: "🌐",
      media: "🎬",
      video: "🎥",
      audio: "🎵",
      course: "📚",
      lesson: "📖",
      quiz: "❓",
      certificate: "🎓",
      badge: "🏅",
      coupon: "🎟️",
      newsletter: "📰",
      subscription: "📬",
      feature: "✨",
      module: "🧩",
      plugin: "🔌",
      theme: "🎨",
      template: "📐",
      page: "📄",
      menu: "☰",
      link: "🔗",
      webhook: "🪝",
      backup: "💾",
      migration: "🚀",
      feedback: "💭",
      survey: "📋",
      vote: "🗳️",
      contact: "📇",
      lead: "🎯",
      calendar: "📅",
      expense: "💸",
      budget: "💰",
      inventory: "📦",
      stock: "📦",
      warehouse: "🏭",
      shipment: "🚚",
      ticket: "🎫",
      issue: "⚠️",
      bug: "🐛",
      faq: "❓",
      guide: "📖",
      blog: "📝",
      news: "📰",
      alert: "🚨",
    };

    const lowerName = entityName.toLowerCase();
    return iconMap[lowerName] || "📋"; // Default icon
  }

  /**
   * Post-process: Update sidebar menu after files are written
   */
  async postProcess(): Promise<void> {
    await this.addToSidebarMenu();
  }
}
