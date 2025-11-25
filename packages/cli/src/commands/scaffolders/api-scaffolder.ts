import { join } from "@std/path";
import {
  BaseScaffolder,
  type BaseScaffolderOptions,
} from "./base-scaffolder.ts";
import type { FileToWrite } from "../../utils/fileWriter.ts";
import { generateModelTemplate } from "../../templates/model.ts";
import { generateDtoTemplate } from "../../templates/dto.ts";
import { generateServiceTemplate } from "../../templates/service.ts";
import { generateControllerTemplate } from "../../templates/controller.ts";
import { generateRouteTemplate } from "../../templates/route.ts";
import { generateTestTemplate } from "../../templates/test.ts";
import { generateAdminRouteTemplate } from "../../templates/admin-route.ts";
import { generateAdminTestTemplate } from "../../templates/admin-test.ts";

export interface ApiScaffolderOptions extends BaseScaffolderOptions {
  targetDir: string;
  skipAdmin?: boolean;
  skipTests?: boolean;
  skipAuth?: boolean;
  skipValidation?: boolean;
}

/**
 * API Scaffolder - Generates backend API files
 */
export class ApiScaffolder extends BaseScaffolder {
  private targetDir: string;
  private skipAdmin: boolean;
  private skipTests: boolean;
  private skipAuth: boolean;
  private skipValidation: boolean;

  constructor(options: ApiScaffolderOptions) {
    super(options);
    this.targetDir = options.targetDir;
    this.skipAdmin = options.skipAdmin ?? false;
    this.skipTests = options.skipTests ?? false;
    this.skipAuth = options.skipAuth ?? false;
    this.skipValidation = options.skipValidation ?? false;
  }

  shouldRun(): Promise<boolean> {
    // Always run for API scaffolding unless explicitly disabled
    return Promise.resolve(true);
  }

  getTargetDir(): string {
    return this.targetDir;
  }

  getTypeName(): string {
    return "API";
  }

  generateFiles(): Promise<FileToWrite[]> {
    const names = this.entityNames;
    const files: FileToWrite[] = [];

    // Core files (always generated)
    files.push(
      {
        path: join(
          "src",
          "entities",
          names.snakePlural,
          `${names.kebabSingular}.model.ts`,
        ),
        content: generateModelTemplate(names),
        description: "Database schema",
      },
      {
        path: join(
          "src",
          "entities",
          names.snakePlural,
          `${names.kebabSingular}.dto.ts`,
        ),
        content: generateDtoTemplate(names, !this.skipValidation),
        description: "Data Transfer Objects",
      },
      {
        path: join(
          "src",
          "entities",
          names.snakePlural,
          `${names.kebabSingular}.service.ts`,
        ),
        content: generateServiceTemplate(names),
        description: "Business logic",
      },
      {
        path: join(
          "src",
          "entities",
          names.snakePlural,
          `${names.kebabSingular}.controller.ts`,
        ),
        content: generateControllerTemplate(names),
        description: "HTTP handlers",
      },
      {
        path: join(
          "src",
          "entities",
          names.snakePlural,
          `${names.kebabSingular}.route.ts`,
        ),
        content: generateRouteTemplate(names),
        description: "Route definitions",
      },
    );

    // Test file (optional)
    if (!this.skipTests) {
      files.push({
        path: join(
          "src",
          "entities",
          names.snakePlural,
          `${names.kebabSingular}.test.ts`,
        ),
        content: generateTestTemplate(names),
        description: "API tests",
      });
    }

    // Admin files (optional)
    if (!this.skipAdmin) {
      files.push({
        path: join(
          "src",
          "entities",
          names.snakePlural,
          `${names.kebabSingular}.admin.route.ts`,
        ),
        content: generateAdminRouteTemplate(names),
        description: "Admin CRUD interface",
      });

      if (!this.skipTests) {
        files.push({
          path: join(
            "src",
            "entities",
            names.snakePlural,
            `${names.kebabSingular}.admin.test.ts`,
          ),
          content: generateAdminTestTemplate(names),
          description: "Admin API tests (JSON)",
        });
      }
    }

    return Promise.resolve(files);
  }
}
