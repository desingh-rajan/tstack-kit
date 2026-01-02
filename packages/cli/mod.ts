#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --unstable-kv

import { parseArgs } from "@std/cli/parse-args";
import "@std/dotenv/load"; // Auto-load .env file
import { Logger } from "./src/utils/logger.ts";
import { scaffoldEntity } from "./src/commands/scaffold.ts";
import { createProject } from "./src/commands/create.ts";
import { destroyProject } from "./src/commands/destroy.ts";
import { createWorkspace, destroyWorkspace } from "./src/commands/workspace.ts";
import { listTrackedProjects } from "./src/commands/list.ts";
import { listVersionsCommand, upgradeCommand } from "./src/commands/upgrade.ts";
import { listTemplatesCommand } from "./src/commands/templates.ts";
import denoConfig from "./deno.json" with { type: "json" };

const VERSION = denoConfig.version;

function showHelp() {
  Logger.banner(VERSION);
  Logger.subtitle("Usage:");
  Logger.code("tstack <command> [options]");
  Logger.newLine();

  Logger.subtitle("Commands:");
  Logger.code(
    "create <type> <name>       Create a new project (types: api, admin-ui, store, workspace)",
  );
  Logger.code(
    "scaffold <entity-name>     Generate a new entity with all MVC files",
  );
  Logger.code(
    "destroy [type] <name>      Remove project and drop its databases",
  );
  Logger.code(
    "list                       Show all tracked projects",
  );
  Logger.code(
    "                           Options: --status <created|destroyed|all>",
  );
  Logger.code(
    "upgrade [version]          Upgrade to latest or specific version",
  );
  Logger.code(
    "versions                   List available versions",
  );
  Logger.code(
    "templates                  List available starter templates",
  );
  Logger.code("--help, -h                 Show this help message");
  Logger.code("--version, -v              Show version number");
  Logger.newLine();
  Logger.subtitle("Options:");
  Logger.code("--force, -f                Overwrite existing files");
  Logger.code(
    "--dir <path>               Target directory (default: current directory)",
  );
  Logger.code(
    "--latest                   Fetch latest stable dependency versions (create only)",
  );
  Logger.code(
    "--skip-admin               Don't generate admin CRUD interface (scaffold only)",
  );
  Logger.code(
    "--skip-tests               Don't generate test files (scaffold only)",
  );
  Logger.code(
    "--skip-auth                Don't add authentication middleware (scaffold only)",
  );
  Logger.code(
    "--skip-validation          Don't add Zod validation schemas (scaffold only)",
  );
  Logger.code(
    "--skip-admin-ui            Skip admin-UI scaffolding (scaffold only)",
  );
  Logger.code(
    "--only-api                 Scaffold API files only (scaffold only)",
  );
  Logger.code(
    "--only-admin-ui            Scaffold admin-UI files only (scaffold only)",
  );
  Logger.newLine();
  Logger.subtitle("Entity Scope Options (api/workspace):");
  Logger.code(
    "--scope=<level>            Set entity scope: core, listing, commerce",
  );
  Logger.code(
    "                           core     = articles, site_settings only",
  );
  Logger.code(
    "                           listing  = + products, brands, categories",
  );
  Logger.code(
    "                           commerce = + carts, orders, payments (default)",
  );
  Logger.code(
    "--skip-listing             Legacy: equivalent to --scope=core",
  );
  Logger.code(
    "--skip-commerce            Legacy: equivalent to --scope=listing",
  );
  Logger.code(
    "--skip-db-setup            Skip database setup (create api only)",
  );
  Logger.newLine();
  Logger.subtitle("Workspace Options:");
  Logger.code(
    "--with-api                 Create API project (workspace only)",
  );
  Logger.code(
    "--with-ui                  Create UI project (workspace only)",
  );
  Logger.code(
    "--with-infra               Create infrastructure project (workspace only)",
  );
  Logger.code(
    "--with-mobile              Create mobile project (workspace only)",
  );
  Logger.code(
    "--with-admin               Create admin project (workspace only)",
  );
  Logger.code(
    "--with-store               Create storefront project (workspace only)",
  );
  Logger.code(
    "--namespace <name>         Custom namespace (workspace only)",
  );
  Logger.code(
    "--no-git                   Skip Git initialization (workspace only)",
  );
  Logger.newLine();

  Logger.subtitle("Examples:");
  Logger.code("tstack create api my-backend");
  Logger.code("tstack create api my-api --latest");
  Logger.code("tstack create admin-ui my-admin");
  Logger.code("tstack create workspace vega-groups");
  Logger.code("tstack create store my-store");
  Logger.code("tstack scaffold products");
  Logger.code("tstack scaffold products --skip-admin-ui");
  Logger.code("tstack scaffold products --only-api");
  Logger.code("tstack scaffold products --only-admin-ui");
  Logger.code("tstack scaffold orders --force");
  Logger.code("tstack destroy api my-shop    # Destroy my-shop-api");
  Logger.code("tstack destroy my-shop        # Find and select from matches");
  Logger.code("tstack upgrade                # Upgrade to latest version");
  Logger.code("tstack upgrade 1.3.0          # Upgrade to specific version");
  Logger.code("tstack versions               # List available versions");
  Logger.newLine();
  Logger.subtitle("Documentation:");
  Logger.code("https://github.com/yourusername/tonystack");
  Logger.newLine();
}

function showVersion() {
  Logger.plain(`TStack CLI v${VERSION}`);
}

async function main() {
  const args = parseArgs(Deno.args, {
    boolean: [
      "help",
      "version",
      "force",
      "latest",
      "skip-admin",
      "skip-tests",
      "skip-auth",
      "skip-validation",
      "skip-admin-ui", // NEW: Skip admin-UI scaffolding
      "only-api", // NEW: Only scaffold API
      "only-admin-ui", // NEW: Only scaffold admin-UI
      "skip-listing", // Skip product listing entities
      "skip-commerce", // Skip e-commerce entities
      "skip-db-setup", // Skip database setup
      "with-api",
      "with-admin-ui",
      "with-ui",
      "with-infra",
      "with-mobile",
      "with-store",
      "with-metrics",
      "skip-api",
      "skip-ui",
      "skip-infra",
      "skip-mobile",
      "skip-store",
      "skip-metrics",
      "skip-remote",
    ],
    string: [
      "dir",
      "namespace",
      "github-org",
      "github-token",
      "visibility",
      "scope",
    ],
    alias: {
      h: "help",
      v: "version",
      f: "force",
      d: "dir",
    },
  });

  if (args.version) {
    showVersion();
    Deno.exit(0);
  }

  if (args.help || args._.length === 0) {
    showHelp();
    Deno.exit(0);
  }

  const command = args._[0]?.toString().toLowerCase();

  try {
    switch (command) {
      case "create": {
        const type = args._[1]?.toString();
        const projectName = args._[2]?.toString();

        const validTypes = ["api", "admin-ui", "store", "workspace"];

        if (!type || !validTypes.includes(type)) {
          Logger.error("Project type is required");
          Logger.info("Usage: tstack create <type> <name>");
          Logger.info("Types: api, admin-ui, store, workspace");
          Logger.info("Example: tstack create api my-backend");
          Deno.exit(1);
        }

        if (!projectName) {
          Logger.error("Project name is required");
          Logger.info("Usage: tstack create <type> <name>");
          Logger.info("Types: api, admin-ui, workspace");
          Logger.info("Example: tstack create api my-backend");
          Deno.exit(1);
        }

        if (type === "workspace") {
          await createWorkspace({
            name: projectName,
            targetDir: args.dir,
            namespace: args.namespace,
            withApi: args["with-api"],
            withAdminUi: args["with-admin-ui"],
            withUi: args["with-ui"],
            withInfra: args["with-infra"],
            withMobile: args["with-mobile"],
            withStore: args["with-store"],
            withMetrics: args["with-metrics"],
            skipApi: args["skip-api"],
            skipAdminUi: args["skip-admin-ui"],
            skipUi: args["skip-ui"],
            skipInfra: args["skip-infra"],
            skipMobile: args["skip-mobile"],
            skipStore: args["skip-store"],
            skipMetrics: args["skip-metrics"],
            skipRemote: args["skip-remote"],
            githubOrg: args["github-org"],
            githubToken: args["github-token"],
            visibility: args.visibility as "private" | "public" | undefined,
            scope: args.scope as "core" | "listing" | "commerce" | undefined,
            skipListing: args["skip-listing"],
            skipCommerce: args["skip-commerce"],
          });
        } else if (type === "api") {
          await createProject({
            projectName,
            projectType: "api",
            targetDir: args.dir,
            latest: args.latest,
            scope: args.scope as "core" | "listing" | "commerce" | undefined,
            skipListing: args["skip-listing"],
            skipCommerce: args["skip-commerce"],
            skipDbSetup: args["skip-db-setup"],
          });
        } else if (type === "admin-ui") {
          await createProject({
            projectName,
            projectType: "admin-ui",
            targetDir: args.dir,
            latest: args.latest,
          });
        } else if (type === "store") {
          await createProject({
            projectName,
            projectType: "store",
            targetDir: args.dir,
            latest: args.latest,
          });
        }
        break;
      }

      case "scaffold": {
        const entityName = args._[1]?.toString();

        if (!entityName) {
          Logger.error("Entity name is required");
          Logger.info("Usage: tstack scaffold <entity-name>");
          Logger.info("Example: tstack scaffold products");
          Deno.exit(1);
        }

        await scaffoldEntity({
          entityName,
          targetDir: args.dir,
          force: args.force,
          skipAdmin: args["skip-admin"],
          skipTests: args["skip-tests"],
          skipAuth: args["skip-auth"],
          skipValidation: args["skip-validation"],
          skipAdminUi: args["skip-admin-ui"],
          onlyApi: args["only-api"],
          onlyAdminUi: args["only-admin-ui"],
        });
        break;
      }

      case "workspace": {
        // Removed: use 'tstack create workspace <name>' instead
        Logger.error("⚠️  'tstack workspace' command has been removed");
        Logger.info("Use: tstack create workspace <name>");
        Logger.info("Example: tstack create workspace my-shop");
        Deno.exit(1);
        break;
      }

      case "destroy": {
        // Check if first arg is a type (api, admin-ui, workspace)
        const firstArg = args._[1]?.toString();
        const secondArg = args._[2]?.toString();

        const validTypes = ["api", "admin-ui", "store", "workspace"];
        let projectType: "api" | "admin-ui" | "store" | "workspace" | undefined;
        let projectName: string;

        if (firstArg && validTypes.includes(firstArg)) {
          // New syntax: tstack destroy <type> <name>
          projectType = firstArg as "api" | "admin-ui" | "store" | "workspace";
          projectName = secondArg || "";
        } else {
          // Old syntax: tstack destroy <folder-name> (backward compatibility)
          projectName = firstArg || "";
        }

        if (!projectName) {
          Logger.error("Project name is required");
          Logger.info("Usage: tstack destroy [type] <name>");
          Logger.info("Examples:");
          Logger.info("  tstack destroy workspace my-shop");
          Logger.info("  tstack destroy api my-shop");
          Logger.info("  tstack destroy admin-ui my-shop");
          Logger.info("  tstack destroy my-shop-api  (backward compatible)");
          Deno.exit(1);
        }

        // Handle workspace destruction separately
        if (projectType === "workspace") {
          await destroyWorkspace({
            name: projectName,
            force: args.force,
            deleteRemote: !args["skip-remote"],
          });
        } else {
          await destroyProject({
            projectName,
            projectType,
            force: args.force,
          });
        }
        break;
      }

      case "list": {
        const status = args.status as string | undefined;
        const validStatuses = [
          "created",
          "creating",
          "destroyed",
          "destroying",
          "all",
        ];

        if (status && !validStatuses.includes(status)) {
          Logger.error(`Invalid status: ${status}`);
          Logger.info(
            "Valid statuses: created, creating, destroyed, destroying, all",
          );
          Deno.exit(1);
        }

        await listTrackedProjects({
          status: status as
            | "created"
            | "creating"
            | "destroyed"
            | "destroying"
            | "all"
            | undefined,
        });
        break;
      }

      case "upgrade": {
        const targetVersion = args._[1]?.toString();
        await upgradeCommand(targetVersion);
        break;
      }

      case "versions": {
        await listVersionsCommand();
        break;
      }

      case "templates": {
        listTemplatesCommand();
        break;
      }

      default:
        Logger.error(`Unknown command: ${command}`);
        Logger.info("Run 'tstack --help' for usage information");
        Deno.exit(1);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.error(`Failed to execute command: ${errorMessage}`);
    if (Deno.env.get("DEBUG")) {
      console.error(error);
    }
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
