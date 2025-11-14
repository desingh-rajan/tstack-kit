import { join } from "@std/path";
import { getEntityNames, isValidEntityName } from "../utils/stringUtils.ts";
import { Logger } from "../utils/logger.ts";
import {
  dirExists,
  type FileToWrite,
  writeFiles,
} from "../utils/fileWriter.ts";
import { generateModelTemplate } from "../templates/model.ts";
import { generateDtoTemplate } from "../templates/dto.ts";
import { generateServiceTemplate } from "../templates/service.ts";
import { generateControllerTemplate } from "../templates/controller.ts";
import { generateRouteTemplate } from "../templates/route.ts";
import { generateTestTemplate } from "../templates/test.ts";
import { generateAdminRouteTemplate } from "../templates/admin-route.ts";
import { generateAdminTestTemplate } from "../templates/admin-test.ts";

export interface ScaffoldOptions {
  entityName: string;
  targetDir?: string;
  force?: boolean;
  skipAdmin?: boolean;
}

export async function scaffoldEntity(options: ScaffoldOptions): Promise<void> {
  const {
    entityName,
    targetDir = Deno.cwd(),
    force = false,
    skipAdmin = false,
  } = options;

  Logger.title(`Scaffolding entity: ${entityName}`);
  Logger.newLine();

  if (!isValidEntityName(entityName)) {
    Logger.error(
      `Invalid entity name: "${entityName}". Use only letters, numbers, hyphens, and underscores.`,
    );
    Deno.exit(1);
  }

  const names = getEntityNames(entityName);
  Logger.info(`Entity variations:`);
  Logger.code(`Singular: ${names.singular}`);
  Logger.code(`Plural: ${names.plural}`);
  Logger.code(`PascalCase: ${names.pascalSingular}`);
  Logger.code(`Folder: ${names.snakePlural}/`);
  Logger.code(`Files: ${names.kebabSingular}.*.ts`);
  Logger.code(`Routes: /${names.kebabPlural}`);
  Logger.code(`Table name: ${names.tableName}`);
  Logger.newLine();

  const entityDir = join(targetDir, "src", "entities", names.snakePlural);
  const exists = await dirExists(entityDir);

  if (exists && !force) {
    Logger.error(
      `Entity "${names.snakePlural}" already exists at ${entityDir}`,
    );
    Logger.info(`Use --force to overwrite existing files`);
    Deno.exit(1);
  }

  if (exists && force) {
    Logger.warning(`Overwriting existing entity: ${names.snakePlural}`);
  }

  Logger.step("Generating files...");
  Logger.newLine();

  const files: FileToWrite[] = [
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
      content: generateDtoTemplate(names),
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
    {
      path: join(
        "src",
        "entities",
        names.snakePlural,
        `${names.kebabSingular}.test.ts`,
      ),
      content: generateTestTemplate(names),
      description: "API tests",
    },
  ];

  // Add admin route and tests if not skipped (Rails-style: include by default, opt-out with --skip-admin)
  if (!skipAdmin) {
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

    files.push({
      path: join(
        "src",
        "entities",
        names.snakePlural,
        `${names.kebabSingular}.admin.test.ts`,
      ),
      content: generateAdminTestTemplate(names),
      description: "Admin API tests (HTML & JSON)",
    });
  }

  await writeFiles(targetDir, files);

  Logger.newLine();
  Logger.divider();
  Logger.success(`Entity "${names.pascalSingular}" scaffolded successfully!`);
  Logger.divider();
  Logger.newLine();

  Logger.subtitle("Next Steps:");
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
  Logger.code("Example:");
  Logger.code(`import { text, integer } from "drizzle-orm/pg-core";`);
  Logger.code("");
  Logger.code(`export const ${names.plural} = pgTable("${names.tableName}", {`);
  Logger.code("  id: integer().primaryKey().generatedAlwaysAsIdentity(),");
  Logger.code("  title: text().notNull(),        // Add your fields here");
  Logger.code("  content: text(),");
  Logger.code('  createdAt: timestamp("created_at").defaultNow().notNull(),');
  Logger.code('  updatedAt: timestamp("updated_at").defaultNow().notNull(),');
  Logger.code("});");
  Logger.newLine();

  Logger.info("2. Generate and run database migration:");
  Logger.code("deno task migrate:generate");
  Logger.code("deno task migrate:run");
  Logger.newLine();
  Logger.info(
    "   This reads ALL *.model.ts files and generates SQL migrations",
  );
  Logger.newLine();

  Logger.info("3. Update validation schemas:");
  Logger.code(
    `- Update DTOs in ${names.kebabSingular}.dto.ts to match your fields`,
  );
  Logger.newLine();

  Logger.info("4. Routes are auto-registered! ");
  Logger.code(
    `[SUCCESS] Routes automatically available (no manual imports needed)`,
  );
  Logger.code(` Auto-discovery: entities/*/*.route.ts files`);
  Logger.newLine();

  Logger.info("5. Start development server:");
  Logger.code("deno task dev");
  Logger.newLine();

  Logger.subtitle("Your API endpoints will be available at:");
  Logger.code(`GET /${names.kebabPlural} → List all ${names.plural}`);
  Logger.code(
    `GET /${names.kebabPlural}/:id → Get ${names.singular} by ID`,
  );
  Logger.code(`POST /${names.kebabPlural} → Create ${names.singular}`);
  Logger.code(`PUT /${names.kebabPlural}/:id → Update ${names.singular}`);
  Logger.code(`DELETE /${names.kebabPlural}/:id → Delete ${names.singular}`);
  Logger.newLine();

  if (!skipAdmin) {
    Logger.subtitle("Admin panel endpoints (requires superadmin/admin role):");
    Logger.code(`GET /ts-admin/${names.kebabPlural} → Admin list view`);
    Logger.code(`GET /ts-admin/${names.kebabPlural}/new → Create form`);
    Logger.code(
      `POST /ts-admin/${names.kebabPlural} → Create ${names.singular}`,
    );
    Logger.code(`GET /ts-admin/${names.kebabPlural}/:id/edit → Edit form`);
    Logger.code(
      `PUT /ts-admin/${names.kebabPlural}/:id → Update ${names.singular}`,
    );
    Logger.code(
      `DELETE /ts-admin/${names.kebabPlural}/:id → Delete ${names.singular}`,
    );
    Logger.newLine();
    Logger.info("Admin panel features:");
    Logger.code("• Tailwind CSS + htmx UI (works without JavaScript)");
    Logger.code("• Pagination, search, and sorting");
    Logger.code("• HTML & JSON responses (content negotiation)");
    Logger.code("• Role-based access control");
    Logger.newLine();
  } else {
    Logger.info("⚠️  Admin routes skipped (--skip-admin flag used)");
    Logger.newLine();
  }

  Logger.info(
    "Note: Routes are clean (no /api prefix). Deployment path prefix handled by proxy.",
  );
  Logger.newLine();

  Logger.subtitle("Test your API:");
  Logger.code(`deno task test  # Run all tests`);
  Logger.code(
    `ENVIRONMENT=test deno test --allow-all src/entities/${names.snakePlural}/${names.kebabSingular}.test.ts  # Run specific tests`,
  );
  Logger.newLine();
  Logger.info("[INFO]  Test file created with:");
  Logger.code("• Basic CRUD tests (ready to run)");
  Logger.code(
    "• Validation test (SKIPPED - enable after adding DTO validation)",
  );
  Logger.code("• Sample data (TODO - update to match your model fields)");
  Logger.newLine();
}
