#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --unstable-kv

import { parseArgs } from "@std/cli/parse-args";
import { Logger } from "./src/utils/logger.ts";
import { scaffoldEntity } from "./src/commands/scaffold.ts";
import { createProject } from "./src/commands/create.ts";
import { destroyProject } from "./src/commands/destroy.ts";
import { createWorkspace } from "./src/commands/workspace.ts";
import { listTrackedProjects } from "./src/commands/list.ts";
import denoConfig from "./deno.json" with { type: "json" };

const VERSION = denoConfig.version;

function showHelp() {
  Logger.banner(VERSION);
  Logger.subtitle("Usage:");
  Logger.code("tstack <command> [options]");
  Logger.newLine();

  Logger.subtitle("Commands:");
  Logger.code(
    "create <type> <name>       Create a new project (types: api, admin-ui, workspace)",
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
  Logger.code("tstack scaffold products");
  Logger.code("tstack scaffold blog-posts");
  Logger.code("tstack scaffold orders --force");
  Logger.code("tstack scaffold users --skip-admin");
  Logger.code("tstack destroy api my-shop    # Destroy my-shop-api");
  Logger.code("tstack destroy my-shop        # Find and select from matches");
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
      "with-api",
      "with-admin-ui",
      "with-ui",
      "with-infra",
      "with-mobile",
      "with-metrics",
      "skip-api",
      "skip-admin-ui",
      "skip-ui",
      "skip-infra",
      "skip-mobile",
      "skip-metrics",
      "skip-remote",
    ],
    string: ["dir", "namespace", "github-org", "github-token", "visibility"],
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
        const typeOrName = args._[1]?.toString();
        const maybeName = args._[2]?.toString();

        // Support both patterns:
        // New: tstack create api my-project
        // Old: tstack create my-project (defaults to api)
        const validTypes = ["api", "admin-ui", "workspace"];
        let type: string;
        let projectName: string;

        if (validTypes.includes(typeOrName)) {
          // New pattern: tstack create <type> <name>
          type = typeOrName;
          projectName = maybeName || "";
        } else {
          // Old pattern: tstack create <name> (backward compatibility)
          type = "api";
          projectName = typeOrName || "";
          Logger.warning(
            "⚠️  Deprecated syntax. Use: tstack create api <name>",
          );
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
            withMetrics: args["with-metrics"],
            skipApi: args["skip-api"],
            skipAdminUi: args["skip-admin-ui"],
            skipUi: args["skip-ui"],
            skipInfra: args["skip-infra"],
            skipMobile: args["skip-mobile"],
            skipMetrics: args["skip-metrics"],
            skipRemote: args["skip-remote"],
            githubOrg: args["github-org"],
            githubToken: args["github-token"],
            visibility: args.visibility as "private" | "public" | undefined,
          });
        } else if (type === "api") {
          await createProject({
            projectName,
            projectType: "api",
            targetDir: args.dir,
            latest: args.latest,
          });
        } else if (type === "admin-ui") {
          await createProject({
            projectName,
            projectType: "admin-ui",
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
        });
        break;
      }

      case "workspace": {
        // Deprecated: redirect to new syntax
        Logger.warning("⚠️  'tstack workspace create' is deprecated");
        Logger.info("Use: tstack create workspace <name>");

        const subCommand = args._[1]?.toString().toLowerCase();
        if (subCommand === "create") {
          const workspaceName = args._[2]?.toString();
          if (!workspaceName) {
            Logger.error("Workspace name is required");
            Deno.exit(1);
          }

          await createWorkspace({
            name: workspaceName,
            targetDir: args.dir,
            namespace: args.namespace,
            withApi: args["with-api"],
            withAdminUi: args["with-admin-ui"],
            withUi: args["with-ui"],
            withInfra: args["with-infra"],
            withMobile: args["with-mobile"],
            withMetrics: args["with-metrics"],
            skipApi: args["skip-api"],
            skipAdminUi: args["skip-admin-ui"],
            skipUi: args["skip-ui"],
            skipInfra: args["skip-infra"],
            skipMobile: args["skip-mobile"],
            skipMetrics: args["skip-metrics"],
            skipRemote: args["skip-remote"],
            githubOrg: args["github-org"],
            githubToken: args["github-token"],
            visibility: args.visibility as "private" | "public" | undefined,
          });
        } else {
          Logger.error(`Unknown workspace subcommand: ${subCommand}`);
          Deno.exit(1);
        }
        break;
      }

      case "destroy": {
        // Check if first arg is a type (api, admin-ui, workspace)
        const firstArg = args._[1]?.toString();
        const secondArg = args._[2]?.toString();

        const validTypes = ["api", "admin-ui", "workspace"];
        let projectType: "api" | "admin-ui" | "workspace" | undefined;
        let projectName: string;

        if (firstArg && validTypes.includes(firstArg)) {
          // New syntax: tstack destroy <type> <name>
          projectType = firstArg as "api" | "admin-ui" | "workspace";
          projectName = secondArg || "";
        } else {
          // Old syntax: tstack destroy <folder-name> (backward compatibility)
          projectName = firstArg || "";
        }

        if (!projectName) {
          Logger.error("Project name is required");
          Logger.info("Usage: tstack destroy [type] <name>");
          Logger.info("Examples:");
          Logger.info("  tstack destroy api my-shop");
          Logger.info("  tstack destroy admin-ui my-shop");
          Logger.info("  tstack destroy my-shop-api  (backward compatible)");
          Deno.exit(1);
        }

        await destroyProject({
          projectName,
          projectType,
          force: args.force,
        });
        break;
      }

      case "list": {
        await listTrackedProjects();
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
