import { Logger } from "../utils/logger.ts";
import { listProjects } from "../utils/projectStore.ts";

/**
 * List all tracked projects
 */
export async function listTrackedProjects(): Promise<void> {
  Logger.title("Tracked Projects");
  Logger.newLine();

  const allProjects = await listProjects();
  
  // Filter out destroyed projects - only show active ones
  const projects = allProjects.filter((p) => p.status !== "destroyed");

  if (projects.length === 0) {
    Logger.info("No projects tracked yet.");
    Logger.info("Create a project with: tstack create api my-project");
    Logger.newLine();
    return;
  }

  Logger.info(
    `Found ${projects.length} project${projects.length > 1 ? "s" : ""}:`,
  );
  Logger.newLine();

  for (const project of projects) {
    const createdDate = new Date(project.createdAt).toLocaleDateString();

    Logger.subtitle(`${project.folderName}`);
    Logger.code(`Type:    ${project.type}`);
    Logger.code(`Status:  ${project.status}`);
    Logger.code(`Path:    ${project.path}`);
    Logger.code(`Created: ${createdDate}`);

    if (project.databases?.dev || project.databases?.test) {
      Logger.code("Databases:");
      if (project.databases?.dev) {
        Logger.code(`  Dev:  ${project.databases.dev}`);
      }
      if (project.databases?.test) {
        Logger.code(`  Test: ${project.databases.test}`);
      }
      if (project.databases?.prod) {
        Logger.code(`  Prod: ${project.databases.prod}`);
      }
    }

    Logger.newLine();
  }
}
