import { join } from "@std/path";
import { getEntityNames, isValidEntityName } from "../utils/stringUtils.ts";
import { Logger } from "../utils/logger.ts";
import {
  dirExists,
  type FileToWrite,
  writeFiles,
} from "../utils/fileWriter.ts";
import { generateModelTemplate } from "../templates/model.ts";
import { generateInterfaceTemplate } from "../templates/interface.ts";
import { generateDtoTemplate } from "../templates/dto.ts";
import { generateServiceTemplate } from "../templates/service.ts";
import { generateControllerTemplate } from "../templates/controller.ts";
import { generateRouteTemplate } from "../templates/route.ts";

export interface ScaffoldOptions {
  entityName: string;
  targetDir?: string;
  force?: boolean;
}

export async function scaffoldEntity(options: ScaffoldOptions): Promise<void> {
  const { entityName, targetDir = Deno.cwd(), force = false } = options;

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
  Logger.code(`Table name: ${names.tableName}`);
  Logger.newLine();

  const entityDir = join(targetDir, "src", "entities", names.plural);
  const exists = await dirExists(entityDir);

  if (exists && !force) {
    Logger.error(
      `Entity "${names.plural}" already exists at ${entityDir}`,
    );
    Logger.info(`Use --force to overwrite existing files`);
    Deno.exit(1);
  }

  if (exists && force) {
    Logger.warning(`Overwriting existing entity: ${names.plural}`);
  }

  Logger.step("Generating files...");
  Logger.newLine();

  const files: FileToWrite[] = [
    {
      path: join("src", "entities", names.plural, `${names.singular}.model.ts`),
      content: generateModelTemplate(names),
      description: "Database schema",
    },
    {
      path: join(
        "src",
        "entities",
        names.plural,
        `${names.singular}.interface.ts`,
      ),
      content: generateInterfaceTemplate(names),
      description: "TypeScript interfaces",
    },
    {
      path: join("src", "entities", names.plural, `${names.singular}.dto.ts`),
      content: generateDtoTemplate(names),
      description: "Data Transfer Objects",
    },
    {
      path: join(
        "src",
        "entities",
        names.plural,
        `${names.singular}.service.ts`,
      ),
      content: generateServiceTemplate(names),
      description: "Business logic",
    },
    {
      path: join(
        "src",
        "entities",
        names.plural,
        `${names.singular}.controller.ts`,
      ),
      content: generateControllerTemplate(names),
      description: "HTTP handlers",
    },
    {
      path: join("src", "entities", names.plural, `${names.singular}.route.ts`),
      content: generateRouteTemplate(names),
      description: "Route definitions",
    },
  ];

  await writeFiles(targetDir, files);

  Logger.newLine();
  Logger.divider();
  Logger.success(`Entity "${names.pascalSingular}" scaffolded successfully!`);
  Logger.divider();
  Logger.newLine();

  Logger.subtitle("Next Steps:");
  Logger.newLine();

  Logger.warning(
    "⚠️  IMPORTANT: The model has only id, createdAt, updatedAt by default!",
  );
  Logger.newLine();

  Logger.info("1. Add your custom fields to the model:");
  Logger.code(`src/entities/${names.plural}/${names.singular}.model.ts`);
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
  Logger.code(`- Update DTOs in ${names.singular}.dto.ts to match your fields`);
  Logger.newLine();

  Logger.info("4. Routes are auto-registered! 🎉");
  Logger.code(`✅ Routes automatically available (no manual imports needed)`);
  Logger.code(`📁 Auto-discovery: entities/*/*.route.ts files`);
  Logger.newLine();

  Logger.info("5. Start development server:");
  Logger.code("deno task dev");
  Logger.newLine();

  Logger.subtitle("Your API endpoints will be available at:");
  Logger.code(`GET /api/${names.plural} → List all ${names.plural}`);
  Logger.code(
    `GET /api/${names.plural}/:id → Get ${names.singular} by ID`,
  );
  Logger.code(`POST /api/${names.plural} → Create ${names.singular}`);
  Logger.code(`PUT /api/${names.plural}/:id → Update ${names.singular}`);
  Logger.code(`DELETE /api/${names.plural}/:id → Delete ${names.singular}`);
  Logger.newLine();
}
