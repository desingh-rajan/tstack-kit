#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { parseArgs } from "@std/cli/parse-args";
import { Logger } from "./src/utils/logger.ts";
import { scaffoldEntity } from "./src/commands/scaffold.ts";
import { createProject } from "./src/commands/create.ts";

const VERSION = "0.1.0";

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
    "scaffold <entity-name>     Generate a new entity with all MVC files",
  );
  Logger.code("--help, -h                 Show this help message");
  Logger.code("--version, -v              Show version number");
  Logger.newLine();
  Logger.subtitle("Options:");
  Logger.code("--force, -f Overwrite existing files");
  Logger.code(
    "--dir <path> Target directory (default: current directory)",
  );
  Logger.newLine();

  Logger.subtitle("Examples:");
  Logger.code("tstack create my-backend");
  Logger.code("tstack create acme-api --dir ~/projects");
  Logger.code("tstack scaffold products");
  Logger.code("tstack scaffold blog-posts");
  Logger.code("tstack scaffold orders --force");
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
    boolean: ["help", "version", "force"],
    string: ["dir"],
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
