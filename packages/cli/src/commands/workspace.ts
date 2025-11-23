import { join } from "@std/path";
import { exists } from "@std/fs";
import { Logger } from "../utils/logger.ts";
import { dirExists, writeFiles, type FileToWrite } from "../utils/fileWriter.ts";

export interface WorkspaceOptions {
  name: string;
  targetDir?: string;
  namespace?: string;
  withApi?: boolean;
  withUi?: boolean;
  withInfra?: boolean;
  withMobile?: boolean;
  withAdmin?: boolean;
  withGit?: boolean;
  createRemote?: boolean;
  githubOrg?: string;
  githubToken?: string;
  visibility?: "private" | "public";
  push?: boolean;
}

export interface WorkspaceConfig {
  workspace: {
    name: string;
    namespace: string;
    created_at: string;
  };
  projects: Record<string, {
    path: string;
    type: string;
    stack?: string;
    framework?: string;
    provider?: string;
    platform?: string;
    git?: {
      local: boolean;
      remote?: string;
      branch?: string;
    };
  }>;
  github?: {
    organization?: string;
    token?: string;
    visibility: "private" | "public";
  };
  environment?: {
    development: Record<string, string>;
    production: Record<string, string>;
  };
}

/**
 * Validate workspace name
 * Must be lowercase, alphanumeric, hyphens only
 */
function validateWorkspaceName(name: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name);
}

/**
 * Generate namespace from workspace name
 * Removes hyphens and converts to lowercase
 */
function generateNamespace(name: string, customNamespace?: string): string {
  if (customNamespace) {
    if (!validateWorkspaceName(customNamespace)) {
      Logger.error(`Invalid namespace: "${customNamespace}". Use lowercase, alphanumeric, hyphens only.`);
      Deno.exit(1);
    }
    return customNamespace;
  }
  return name.replace(/-/g, "");
}

/**
 * Generate .gitignore content based on project type
 */
function generateGitignore(projectType: "api" | "ui" | "infra" | "mobile" | "admin"): string {
  const common = `# Environment
.env
.env.local
.env.*.local
!.env.example

# Logs
logs/
*.log

# OS
.DS_Store
.DS_Store?
._*
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
`;

  const typeSpecific: Record<string, string> = {
    api: `
# Deno
deno.lock

# Database
*.db
*.db-shm
*.db-wal

# Testing
coverage/

# Build
dist/
`,
    ui: `
# Dependencies
node_modules/

# Build
.next/
dist/
build/
out/

# Testing
coverage/
.nyc_output/
`,
    infra: `
# Terraform
.terraform/
*.tfstate
*.tfstate.backup
*.tfvars

# Docker
docker-compose.override.yml
`,
    mobile: `
# Dependencies
node_modules/

# Flutter/Dart
.dart_tool/
.packages
build/
.flutter-plugins
.flutter-plugins-dependencies

# iOS
ios/Pods/
ios/.symlinks/
ios/Flutter/Flutter.framework
ios/Flutter/Flutter.podspec

# Android
android/.gradle/
android/captures/
android/local.properties
`,
    admin: `
# Dependencies
node_modules/

# Build
.next/
dist/
build/

# Testing
coverage/
`,
  };

  return common + (typeSpecific[projectType] || "");
}

/**
 * Initialize Git repository for a project
 */
async function initializeGitRepo(
  projectPath: string,
  projectName: string,
): Promise<void> {
  try {
    // Check if .git already exists
    const gitDir = join(projectPath, ".git");
    if (await dirExists(gitDir)) {
      Logger.info(`Git repository already exists in ${projectName}`);
      return;
    }

    // Initialize git
    const initCmd = new Deno.Command("git", {
      args: ["init"],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    await initCmd.output();

    // Set default branch to main
    const branchCmd = new Deno.Command("git", {
      args: ["branch", "-M", "main"],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    await branchCmd.output();

    // Create initial commit
    const addCmd = new Deno.Command("git", {
      args: ["add", "."],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    await addCmd.output();

    const commitCmd = new Deno.Command("git", {
      args: ["commit", "-m", "Initial commit: TStack project scaffolding"],
      cwd: projectPath,
      stdout: "piped",
      stderr: "piped",
    });
    await commitCmd.output();

    Logger.success(`Git repository initialized in ${projectName}`);
  } catch (error) {
    Logger.warning(`Failed to initialize Git repository: ${error.message}`);
  }
}

/**
 * Generate workspace configuration file
 */
function generateWorkspaceConfig(
  options: WorkspaceOptions,
  projects: WorkspaceConfig["projects"],
): string {
  const config: WorkspaceConfig = {
    workspace: {
      name: options.name,
      namespace: generateNamespace(options.name, options.namespace),
      created_at: new Date().toISOString(),
    },
    projects,
  };

  if (options.githubOrg || options.githubToken) {
    config.github = {
      organization: options.githubOrg,
      token: options.githubToken ? "$GITHUB_TOKEN" : undefined,
      visibility: options.visibility || "private",
    };
  }

  config.environment = {
    development: {
      api_url: "http://localhost:8000",
      ui_url: "http://localhost:3000",
    },
    production: {
      api_url: `https://api.${options.name}.com`,
      ui_url: `https://${options.name}.com`,
    },
  };

  return `# TStack Workspace Configuration
# Generated: ${new Date().toISOString()}

${Object.entries(config).map(([key, value]) => 
  `${key}:\n${JSON.stringify(value, null, 2).split('\n').map(line => `  ${line}`).join('\n')}`
).join('\n\n')}
`;
}

/**
 * Create workspace with specified components
 */
export async function createWorkspace(options: WorkspaceOptions): Promise<void> {
  const {
    name,
    targetDir = Deno.cwd(),
    withApi = false,
    withUi = false,
    withInfra = false,
    withMobile = false,
    withAdmin = false,
    withGit = true,
  } = options;

  Logger.title(`Creating TStack workspace: ${name}`);
  Logger.newLine();

  // Validate workspace name
  if (!validateWorkspaceName(name)) {
    Logger.error(
      `Invalid workspace name: "${name}". Use lowercase, alphanumeric, hyphens only (e.g., vega-groups, acme-corp).`,
    );
    Deno.exit(1);
  }

  const namespace = generateNamespace(name, options.namespace);
  const workspacePath = join(targetDir, name);

  // Check if workspace already exists
  if (await dirExists(workspacePath)) {
    Logger.error(`Workspace "${name}" already exists at ${workspacePath}`);
    Deno.exit(1);
  }

  Logger.info(`Namespace: ${namespace}`);
  Logger.info(`Location: ${workspacePath}`);
  Logger.newLine();

  // Create workspace directory structure
  Logger.step("Creating workspace structure...");
  await Deno.mkdir(workspacePath, { recursive: true });
  await Deno.mkdir(join(workspacePath, ".tstack"), { recursive: true });

  // Track created projects for config
  const projects: WorkspaceConfig["projects"] = {};

  // Create API project
  if (withApi) {
    Logger.info(`Creating ${name}-api (Backend)...`);
    const apiPath = join(workspacePath, `${name}-api`);
    await Deno.mkdir(apiPath, { recursive: true });

    const files: FileToWrite[] = [
      {
        path: ".gitignore",
        content: generateGitignore("api"),
        description: "Git ignore file",
      },
      {
        path: "README.md",
        content: `# ${name}-api\n\nBackend API for ${name}\n\n## Stack\n- Deno\n- Hono\n- Drizzle ORM\n- PostgreSQL\n`,
        description: "README file",
      },
    ];

    await writeFiles(apiPath, files);

    projects[`${name}-api`] = {
      path: `./${name}-api`,
      type: "backend",
      stack: "deno-hono-drizzle-postgresql",
      git: { local: withGit, branch: "main" },
    };

    if (withGit) {
      await initializeGitRepo(apiPath, `${name}-api`);
    }
  }

  // Create UI project (placeholder for Issue #44)
  if (withUi) {
    Logger.info(`Creating ${name}-ui (Frontend)...`);
    const uiPath = join(workspacePath, `${name}-ui`);
    await Deno.mkdir(uiPath, { recursive: true });

    const files: FileToWrite[] = [
      {
        path: ".gitignore",
        content: generateGitignore("ui"),
        description: "Git ignore file",
      },
      {
        path: "README.md",
        content: `# ${name}-ui\n\nFrontend UI for ${name}\n\n## Stack\n- Fresh\n- Preact\n- Tailwind CSS\n- DaisyUI\n`,
        description: "README file",
      },
    ];

    await writeFiles(uiPath, files);

    projects[`${name}-ui`] = {
      path: `./${name}-ui`,
      type: "frontend",
      framework: "fresh",
      git: { local: withGit, branch: "main" },
    };

    if (withGit) {
      await initializeGitRepo(uiPath, `${name}-ui`);
    }
  }

  // Create Infrastructure project
  if (withInfra) {
    Logger.info(`Creating ${name}-infra (Infrastructure)...`);
    const infraPath = join(workspacePath, `${name}-infra`);
    await Deno.mkdir(infraPath, { recursive: true });

    const files: FileToWrite[] = [
      {
        path: ".gitignore",
        content: generateGitignore("infra"),
        description: "Git ignore file",
      },
      {
        path: "README.md",
        content: `# ${name}-infra\n\nInfrastructure configuration for ${name}\n\n## Contents\n- Docker Compose\n- Deployment configs\n`,
        description: "README file",
      },
      {
        path: "docker-compose.yml",
        content: `version: '3.8'

services:
  # Add your services here
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${namespace}_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`,
        description: "Docker Compose file",
      },
    ];

    await writeFiles(infraPath, files);

    projects[`${name}-infra`] = {
      path: `./${name}-infra`,
      type: "infrastructure",
      provider: "docker",
      git: { local: withGit, branch: "main" },
    };

    if (withGit) {
      await initializeGitRepo(infraPath, `${name}-infra`);
    }
  }

  // Create Mobile project (placeholder)
  if (withMobile) {
    Logger.info(`Creating ${name}-mobile (Mobile)...`);
    const mobilePath = join(workspacePath, `${name}-mobile`);
    await Deno.mkdir(mobilePath, { recursive: true });

    const files: FileToWrite[] = [
      {
        path: ".gitignore",
        content: generateGitignore("mobile"),
        description: "Git ignore file",
      },
      {
        path: "README.md",
        content: `# ${name}-mobile\n\nMobile app for ${name}\n\n## Stack\n- Flutter\n`,
        description: "README file",
      },
    ];

    await writeFiles(mobilePath, files);

    projects[`${name}-mobile`] = {
      path: `./${name}-mobile`,
      type: "mobile",
      platform: "flutter",
      git: { local: withGit, branch: "main" },
    };

    if (withGit) {
      await initializeGitRepo(mobilePath, `${name}-mobile`);
    }
  }

  // Create Admin project (placeholder)
  if (withAdmin) {
    Logger.info(`Creating ${name}-admin (Admin Panel)...`);
    const adminPath = join(workspacePath, `${name}-admin`);
    await Deno.mkdir(adminPath, { recursive: true });

    const files: FileToWrite[] = [
      {
        path: ".gitignore",
        content: generateGitignore("admin"),
        description: "Git ignore file",
      },
      {
        path: "README.md",
        content: `# ${name}-admin\n\nAdmin panel for ${name}\n\n## Stack\n- Fresh Admin UI Kit\n`,
        description: "README file",
      },
    ];

    await writeFiles(adminPath, files);

    projects[`${name}-admin`] = {
      path: `./${name}-admin`,
      type: "admin",
      framework: "fresh",
      git: { local: withGit, branch: "main" },
    };

    if (withGit) {
      await initializeGitRepo(adminPath, `${name}-admin`);
    }
  }

  // Generate workspace config and README
  Logger.step("Generating workspace configuration...");
  const configContent = generateWorkspaceConfig(options, projects);
  await Deno.writeTextFile(join(workspacePath, ".tstack", "config.yaml"), configContent);

  const readmeContent = `# ${name} Workspace

TStack workspace for ${name} project.

## Namespace
\`${namespace}\`

## Projects

${Object.entries(projects).map(([name, config]) => 
  `- **${name}** (${config.type}) - \`${config.path}\``
).join('\n')}

## Getting Started

1. Navigate to a project directory:
   \`\`\`bash
   cd ${Object.keys(projects)[0] || `${name}-api`}
   \`\`\`

2. Follow the project-specific README for setup instructions.

## Workspace Configuration

See \`.tstack/config.yaml\` for workspace configuration.
`;

  await Deno.writeTextFile(join(workspacePath, ".tstack", "README.md"), readmeContent);

  Logger.newLine();
  Logger.divider();
  Logger.success(`Workspace "${name}" created successfully!`);
  Logger.divider();
  Logger.newLine();

  Logger.subtitle("Workspace Structure:");
  Logger.code(`${name}/`);
  Logger.code(`├── .tstack/`);
  Logger.code(`│   ├── config.yaml`);
  Logger.code(`│   └── README.md`);
  for (const projectName of Object.keys(projects)) {
    Logger.code(`└── ${projectName}/`);
  }
  Logger.newLine();

  Logger.subtitle("Next Steps:");
  Logger.newLine();
  Logger.info("1. Navigate to your workspace:");
  Logger.code(`cd ${name}`);
  Logger.newLine();

  if (withApi) {
    Logger.info("2. Set up the API project:");
    Logger.code(`cd ${name}-api`);
    Logger.code(`# TODO: Run tstack create to scaffold the API`);
    Logger.newLine();
  }

  if (options.createRemote) {
    Logger.warning("Remote repository creation will be implemented in Phase 3");
    Logger.newLine();
  }
}
