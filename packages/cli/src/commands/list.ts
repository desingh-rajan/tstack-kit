import { Logger } from "../utils/logger.ts";
import {
  listProjects,
  ProjectMetadata,
  ProjectStatus,
} from "../utils/projectStore.ts";

export interface ListOptions {
  status?: ProjectStatus | "all"; // Filter by status, or "all" to show everything
}

/**
 * Filter projects by status
 * @param projects - Array of projects to filter
 * @param status - Status to filter by, "all" to show everything, or undefined to hide destroyed
 */
function filterByStatus(
  projects: ProjectMetadata[],
  status?: ProjectStatus | "all",
): ProjectMetadata[] {
  if (status === "all") {
    return projects;
  }
  if (status) {
    return projects.filter((p) => p.status === status);
  }
  // Default: filter out destroyed projects - only show active ones
  return projects.filter((p) => p.status !== "destroyed");
}

/**
 * List all tracked projects
 */
export async function listTrackedProjects(
  options: ListOptions = {},
): Promise<void> {
  Logger.title("Tracked Projects");
  Logger.newLine();

  const allProjects = await listProjects();
  const projects = filterByStatus(allProjects, options.status);

  if (projects.length === 0) {
    const statusMsg = options.status && options.status !== "all"
      ? ` with status "${options.status}"`
      : "";
    Logger.info(`No projects tracked${statusMsg}.`);
    Logger.info("Create a project with: tstack create api my-project");
    Logger.newLine();
    return;
  }

  const statusMsg = options.status ? ` (status: ${options.status})` : "";
  Logger.info(
    `Found ${projects.length} project${
      projects.length > 1 ? "s" : ""
    }${statusMsg}:`,
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
