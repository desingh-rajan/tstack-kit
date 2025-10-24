import { dirname, join } from "@std/path";
import { copy } from "@std/fs";
import { Logger } from "../utils/logger.ts";

export interface CreateOptions {
  projectName: string;
  targetDir?: string;
}

export async function createProject(options: CreateOptions): Promise<void> {
  const { projectName, targetDir = Deno.cwd() } = options;

  Logger.title(`Creating new project: ${projectName}`);
  Logger.newLine();

  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(projectName)) {
    Logger.error(
      `Invalid project name: "${projectName}". Use only letters, numbers, hyphens, and underscores.`,
    );
    Deno.exit(1);
  }

  const projectPath = join(targetDir, projectName);

  if (await dirExists(projectPath)) {
    Logger.error(`Directory "${projectName}" already exists at ${projectPath}`);
    Deno.exit(1);
  }

  const cliPath = dirname(dirname(dirname(new URL(import.meta.url).pathname)));
  const starterPath = join(dirname(cliPath), "starter");

  if (!await dirExists(starterPath)) {
    Logger.error(
      "Starter template not found. Make sure TonyStack is installed correctly.",
    );
    Logger.info("Expected path: " + starterPath);
    Deno.exit(1);
  }

  Logger.step("Copying starter template...");
  Logger.newLine();

  try {
    // Walk through the starter directory and copy files
    for await (const entry of Deno.readDir(starterPath)) {
      const sourcePath = join(starterPath, entry.name);
      const destPath = join(projectPath, entry.name);

      Logger.info(`Copying ${entry.name}...`);
      await copy(sourcePath, destPath, { overwrite: false });
    }
  } catch (error) {
    Logger.error(`Failed to copy starter template: ${error}`);
    Deno.exit(1);
  }

  Logger.newLine();
  Logger.success("Project created successfully!");
  Logger.newLine();
  Logger.divider();
  Logger.newLine();

  Logger.subtitle("Next Steps:");
  Logger.newLine();

  Logger.info("1. Navigate to your project:");
  Logger.code(`cd ${projectName}`);
  Logger.newLine();

  Logger.info("2. Configure environment:");
  Logger.code("cp .env.example .env");
  Logger.code("nano .env  # Update database and other settings");
  Logger.newLine();

  Logger.info("3. Start development server:");
  Logger.code("deno task dev");
  Logger.newLine();

  Logger.info("4. Generate entities:");
  Logger.code("tstack scaffold products");
  Logger.code("tstack scaffold orders");
  Logger.newLine();

  Logger.subtitle("Your API will be available at:");
  Logger.code("http://localhost:8000");
  Logger.newLine();
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch {
    return false;
  }
}
