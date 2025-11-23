#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { parseArgs } from "@std/cli/parse-args";
import { Logger } from "./src/utils/logger.ts";
import { scaffoldEntity } from "./src/commands/scaffold.ts";
import { createProject } from "./src/commands/create.ts";
import { destroyProject } from "./src/commands/destroy.ts";
import { createWorkspace } from "./src/commands/workspace.ts";
import denoConfig from "./deno.json" with { type: "json" };

const VERSION = denoConfig.version;

function showHelp() {
  Logger.banner();
  Logger.subtitle("Usage:");
  Logger.code("tstack <command> [options]");
  Logger.newLine();

  Logger.subtitle("Commands:");
  Logger.code(
    "create <project-name>      Create a new project from starter template",
  );
  Logger.code(
    "workspace create <name>    Create a multi-project workspace",
  );
  Logger.code(
    "scaffold <entity-name>     Generate a new entity with all MVC files",
  );
  Logger.code(
    "destroy <project-name>     Remove project and drop its databases",
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
  Logger.code("tstack create my-backend");
  Logger.code("tstack create my-api --latest");
  Logger.code("tstack workspace create vega-groups --with-api --with-ui");
  Logger.code("tstack workspace create acme-corp --with-api --with-infra");
  Logger.code("tstack scaffold products");
  Logger.code("tstack scaffold blog-posts");
  Logger.code("tstack scaffold orders --force");
  Logger.code("tstack scaffold users --skip-admin");
  Logger.code("tstack destroy my-backend");
  Logger.newLine();
  Logger.subtitle("Documentation:");
  Logger.code("https://github.com/yourusername/tonystack");
  Logger.newLine();
}

function showVersion() {
  Logger.plain(`TonyStack CLI v${VERSION}`);
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
      "with-ui",
      "with-infra",
      "with-mobile",
      "with-admin",
      "no-git",
    ],
    string: ["dir", "namespace"],
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
        const projectName = args._[1]?.toString();

        if (!projectName) {
          Logger.error("Project name is required");
          Logger.info("Usage: tstack create <project-name>");
          Logger.info("Example: tstack create my-backend");
          Deno.exit(1);
        }

        await createProject({
          projectName,
          targetDir: args.dir,
          latest: args.latest,
        });
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
        const subCommand = args._[1]?.toString().toLowerCase();

        if (subCommand === "create") {
          const workspaceName = args._[2]?.toString();

          if (!workspaceName) {
            Logger.error("Workspace name is required");
            Logger.info("Usage: tstack workspace create <name> [options]");
            Logger.info(
              "Example: tstack workspace create vega-groups --with-api --with-ui",
            );
            Deno.exit(1);
          }

          await createWorkspace({
            name: workspaceName,
            targetDir: args.dir,
            namespace: args.namespace,
            withApi: args["with-api"],
            withUi: args["with-ui"],
            withInfra: args["with-infra"],
            withMobile: args["with-mobile"],
            withAdmin: args["with-admin"],
            withGit: !args["no-git"],
          });
        } else {
          Logger.error(`Unknown workspace subcommand: ${subCommand}`);
          Logger.info("Available: create");
          Deno.exit(1);
        }
        break;
      }

      case "destroy": {
        const projectName = args._[1]?.toString();

        if (!projectName) {
          Logger.error("Project name is required");
          Logger.info("Usage: tstack destroy <project-name>");
          Logger.info("Example: tstack destroy my-backend");
          Deno.exit(1);
        }

        await destroyProject({
          projectName,
          force: args.force,
        });
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
