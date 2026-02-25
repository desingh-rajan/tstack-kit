/**
 * Infrastructure CLI Command
 *
 * Generates production-ready deployment infrastructure:
 * - Kamal deploy configs (production + staging)
 * - Secrets management templates
 * - GitHub Actions CI/CD workflow
 * - Dockerfile templates
 *
 * Docker Registry Support:
 * - GHCR (default) - GitHub Container Registry
 * - Docker Hub
 * - AWS ECR
 */

import { join } from "@std/path";
import { Logger } from "../utils/logger.ts";
import { ensureDirectory } from "../utils/fileWriter.ts";

export type DockerRegistry = "ghcr" | "dockerhub" | "ecr";
export type ProjectType = "api" | "admin-ui" | "store";

// Default values
export const DEFAULT_DOMAIN = "yourdomain.com";
export const DEFAULT_STAGING_DOMAIN = "staging.yourdomain.com";
export const DEFAULT_PATH_PREFIX = "ts-be/api";

export interface InfraOptions {
  projectDir: string;
  projectName: string;
  projectType: ProjectType;
  registry: DockerRegistry;
  domain: string; // Base domain (e.g., vega-tools.com or yourdomain.com)
  stagingDomain?: string; // Staging base domain (e.g., staging.vega-tools.com)
  pathPrefix?: string; // API path prefix (default: ts-be/api)
  sshUser?: string;
  enableStaging?: boolean;
  dbAccessory?: boolean;
  // Registry-specific options
  githubUsername?: string;
  dockerUsername?: string;
  awsAccountId?: string;
  awsRegion?: string;
}

/**
 * Get the host domain for a project type
 * - API: uses base domain (with path_prefix)
 * - Admin: uses admin.domain subdomain
 * - Store: uses base domain (root)
 */
function getHostDomain(baseDomain: string, projectType: ProjectType): string {
  switch (projectType) {
    case "api":
      return baseDomain; // API uses path prefix on main domain
    case "admin-ui":
      return `admin.${baseDomain}`;
    case "store":
      return baseDomain;
  }
}

/**
 * Get the full APP_URL for a project type
 */
function getAppUrl(
  baseDomain: string,
  projectType: ProjectType,
  pathPrefix: string,
): string {
  const host = getHostDomain(baseDomain, projectType);
  switch (projectType) {
    case "api":
      return `https://${host}/${pathPrefix}`;
    case "admin-ui":
      return `https://${host}`;
    case "store":
      return `https://${host}`;
  }
}

/**
 * Get the API URL for UI projects
 */
function getApiUrl(baseDomain: string, pathPrefix: string): string {
  return `https://${baseDomain}/${pathPrefix}`;
}

/**
 * Create infrastructure files for a project
 */
export async function createInfrastructure(
  options: InfraOptions,
): Promise<void> {
  Logger.info(`Setting up infrastructure for ${options.projectName}...`);

  // Create directories
  await ensureDirectory(join(options.projectDir, "config"));
  await ensureDirectory(join(options.projectDir, ".kamal"));
  await ensureDirectory(join(options.projectDir, ".github", "workflows"));

  // Generate files
  await createDeployYml(options);
  if (options.enableStaging) {
    await createStagingDeployYml(options);
  }
  await createSecretsTemplate(options);
  await createGithubWorkflow(options);
  await createDockerfile(options);

  Logger.success("Infrastructure files created successfully!");
  Logger.newLine();
  Logger.subtitle("Next steps:");
  Logger.info("1. Update config/deploy.yml with your server IP");
  Logger.info("2. Fill in .kamal/secrets with your credentials");
  Logger.info("3. Add secrets to GitHub repository settings");
  Logger.info("4. Push to trigger CI/CD deployment");
}

/**
 * Get the Docker image URL based on registry type
 */
function getImageUrl(options: InfraOptions): string {
  const {
    registry,
    projectName,
    githubUsername,
    dockerUsername,
    awsAccountId,
    awsRegion,
  } = options;

  switch (registry) {
    case "ghcr":
      return `ghcr.io/${
        githubUsername || "<your-github-username>"
      }/${projectName}`;
    case "dockerhub":
      return `docker.io/${
        dockerUsername || "<your-docker-username>"
      }/${projectName}`;
    case "ecr":
      return `${awsAccountId || "<aws-account-id>"}.dkr.ecr.${
        awsRegion || "us-east-1"
      }.amazonaws.com/${projectName}`;
  }
}

/**
 * Get registry configuration for deploy.yml
 */
function getRegistryConfig(options: InfraOptions): string {
  switch (options.registry) {
    case "ghcr":
      return `registry:
  server: ghcr.io
  username:
    - KAMAL_REGISTRY_USERNAME
  password:
    - KAMAL_REGISTRY_PASSWORD`;

    case "dockerhub":
      return `registry:
  server: docker.io
  username:
    - KAMAL_REGISTRY_USERNAME
  password:
    - KAMAL_REGISTRY_PASSWORD`;

    case "ecr":
      return `registry:
  server: ${options.awsAccountId || "<aws-account-id>"}.dkr.ecr.${
        options.awsRegion || "us-east-1"
      }.amazonaws.com
  username: AWS
  password:
    - KAMAL_REGISTRY_PASSWORD`;
  }
}

/**
 * Create main deploy.yml
 */
async function createDeployYml(options: InfraOptions): Promise<void> {
  const imageUrl = getImageUrl(options);
  const registryConfig = getRegistryConfig(options);
  const healthEndpoint = options.projectType === "api" ? "/health" : "/";
  const port = options.projectType === "api" ? 8000 : 3000;
  const pathPrefix = options.pathPrefix || DEFAULT_PATH_PREFIX;
  const hostDomain = getHostDomain(options.domain, options.projectType);
  const appUrl = getAppUrl(options.domain, options.projectType, pathPrefix);
  const apiUrl = getApiUrl(options.domain, pathPrefix);

  // Proxy config - API uses path_prefix on main domain, UI uses subdomain
  const proxyConfig = options.projectType === "api"
    ? `proxy:
  host: ${hostDomain}
  path_prefix: /${pathPrefix}
  ssl: true
  app_port: ${port}
  forward_headers: true
  response_timeout: 60
  healthcheck:
    path: ${healthEndpoint}
    interval: 3`
    : `proxy:
  host: ${hostDomain}
  ssl: true
  healthcheck:
    path: ${healthEndpoint}
    interval: 3`;

  const dbAccessory = options.dbAccessory && options.projectType === "api"
    ? `
accessories:
  postgres:
    image: postgres:16-alpine
    host: <your-server-ip>
    port: "127.0.0.1:5432:5432"
    env:
      clear:
        POSTGRES_DB: ${options.projectName.replace(/-/g, "_")}_production
      secret:
        - POSTGRES_USER
        - POSTGRES_PASSWORD
    directories:
      - data:/var/lib/postgresql/data
    options:
      memory: 512m
`
    : "";

  // Additional env vars based on project type
  let additionalEnv = "";
  if (options.projectType === "api") {
    additionalEnv = `
    APP_URL: ${appUrl}
    STOREFRONT_URL: https://${options.domain}
    ALLOWED_ORIGINS: https://${options.domain},https://www.${options.domain},https://admin.${options.domain}`;
  } else if (options.projectType === "admin-ui") {
    additionalEnv = `
    API_URL: ${apiUrl}`;
  } else if (options.projectType === "store") {
    additionalEnv = `
    API_URL: ${apiUrl}`;
  }

  const content = `# Kamal deployment configuration
# Documentation: https://kamal-deploy.org
#
# Domain Setup:
#   Base Domain: ${options.domain}
#   Path Prefix: /${pathPrefix}
#   API:   https://${options.domain}/${pathPrefix} (path prefix)
#   Admin: https://admin.${options.domain}
#   Store: https://${options.domain}

service: ${options.projectName}

image: ${imageUrl}

servers:
  web:
    hosts:
      - <your-server-ip>
    options:
      memory: 400m
      memory-swap: 500m

${registryConfig}

${proxyConfig}

builder:
  multiarch: false

env:
  clear:
    ENVIRONMENT: production
    PORT: "${port}"
    LOG_LEVEL: info${additionalEnv}
  secret:
    - DATABASE_URL
    - JWT_SECRET
    - RESEND_API_KEY
    - EMAIL_FROM

healthcheck:
  path: ${healthEndpoint}
  port: ${port}
  max_attempts: 10
  interval: 3s
${dbAccessory}
# Retain previous containers for rollback
retain_containers: 2

# SSH configuration
ssh:
  user: ${options.sshUser || "root"}
`;

  await Deno.writeTextFile(
    join(options.projectDir, "config", "deploy.yml"),
    content,
  );
  Logger.success("Created config/deploy.yml");
}

/**
 * Create staging deploy.yml
 */
async function createStagingDeployYml(options: InfraOptions): Promise<void> {
  const imageUrl = getImageUrl(options);
  const registryConfig = getRegistryConfig(options);
  const healthEndpoint = options.projectType === "api" ? "/health" : "/";
  const port = options.projectType === "api" ? 8000 : 3000;
  const pathPrefix = options.pathPrefix || DEFAULT_PATH_PREFIX;
  const stagingBaseDomain = options.stagingDomain ||
    `staging.${options.domain}`;
  const stagingHostDomain = getHostDomain(
    stagingBaseDomain,
    options.projectType,
  );
  const stagingAppUrl = getAppUrl(
    stagingBaseDomain,
    options.projectType,
    pathPrefix,
  );
  const stagingApiUrl = getApiUrl(stagingBaseDomain, pathPrefix);

  // Proxy config for staging
  const proxyConfig = options.projectType === "api"
    ? `proxy:
      host: ${stagingHostDomain}
      path_prefix: /${pathPrefix}
      ssl: true
      app_port: ${port}
      forward_headers: true
      response_timeout: 60
      healthcheck:
        path: ${healthEndpoint}
        interval: 3`
    : `proxy:
      host: ${stagingHostDomain}
      ssl: true
      healthcheck:
        path: ${healthEndpoint}
        interval: 3`;

  // Additional env vars based on project type
  let additionalEnv = "";
  if (options.projectType === "api") {
    additionalEnv = `
    APP_URL: ${stagingAppUrl}
    STOREFRONT_URL: https://${stagingBaseDomain}
    ALLOWED_ORIGINS: https://${stagingBaseDomain},https://www.${stagingBaseDomain},https://admin.${stagingBaseDomain}`;
  } else if (options.projectType === "admin-ui") {
    additionalEnv = `
    API_URL: ${stagingApiUrl}`;
  } else if (options.projectType === "store") {
    additionalEnv = `
    API_URL: ${stagingApiUrl}`;
  }

  const content = `# Kamal staging deployment configuration
# Deploy with: kamal deploy -c config/deploy.staging.yml
#
# Staging Domain Setup:
#   Base Domain: ${stagingBaseDomain}
#   Path Prefix: /${pathPrefix}
#   API:   https://${stagingBaseDomain}/${pathPrefix} (path prefix)
#   Admin: https://admin.${stagingBaseDomain}
#   Store: https://${stagingBaseDomain}

service: ${options.projectName}

image: ${imageUrl}

servers:
  web:
    hosts:
      - <your-staging-server-ip>
    options:
      memory: 400m
    ${proxyConfig}

${registryConfig}

builder:
  multiarch: false

env:
  clear:
    ENVIRONMENT: staging
    PORT: "${port}"
    LOG_LEVEL: debug${additionalEnv}
  secret:
    - DATABASE_URL
    - JWT_SECRET
    - RESEND_API_KEY
    - EMAIL_FROM

healthcheck:
  path: ${healthEndpoint}
  port: ${port}
  max_attempts: 10
  interval: 3s

retain_containers: 1

ssh:
  user: ${options.sshUser || "root"}
`;

  await Deno.writeTextFile(
    join(options.projectDir, "config", "deploy.staging.yml"),
    content,
  );
  Logger.success("Created config/deploy.staging.yml");
}

/**
 * Create secrets template
 */
async function createSecretsTemplate(options: InfraOptions): Promise<void> {
  let registrySecrets: string;

  switch (options.registry) {
    case "ghcr":
      registrySecrets = `# GitHub Container Registry (GHCR)
# Use a Personal Access Token with write:packages scope
KAMAL_REGISTRY_USERNAME=<your-github-username>
KAMAL_REGISTRY_PASSWORD=<your-github-token>`;
      break;
    case "dockerhub":
      registrySecrets = `# Docker Hub
KAMAL_REGISTRY_USERNAME=<your-docker-username>
KAMAL_REGISTRY_PASSWORD=<your-docker-access-token>`;
      break;
    case "ecr":
      registrySecrets = `# AWS ECR
# Generate password: aws ecr get-login-password --region ${
        options.awsRegion || "us-east-1"
      }
KAMAL_REGISTRY_PASSWORD=$(aws ecr get-login-password --region ${
        options.awsRegion || "us-east-1"
      })`;
      break;
  }

  const apiSecrets = options.projectType === "api"
    ? `
# Database (required for API)
DATABASE_URL=postgresql://user:password@localhost:5432/${
      options.projectName.replace(/-/g, "_")
    }_production

# Postgres accessory (if using Kamal accessory)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure-db-password>
`
    : "";

  const content = `# Kamal Secrets Configuration
# This file is loaded by Kamal during deployment
# NEVER commit this file to version control!

# ===========================================
# Registry Credentials
# ===========================================
${registrySecrets}

# ===========================================
# Application Secrets
# ===========================================
${apiSecrets}
# JWT Authentication
JWT_SECRET=<generate-with: openssl rand -hex 64>

# Email Configuration
EMAIL_FROM=noreply@${options.domain}
RESEND_API_KEY=<your-resend-api-key>

# OAuth (optional)
# GOOGLE_CLIENT_ID=<your-google-client-id>
# GOOGLE_CLIENT_SECRET=<your-google-client-secret>
# FACEBOOK_APP_ID=<your-facebook-app-id>
# FACEBOOK_APP_SECRET=<your-facebook-app-secret>

# Payment (optional, for e-commerce)
# RAZORPAY_KEY_ID=<your-razorpay-key>
# RAZORPAY_KEY_SECRET=<your-razorpay-secret>

# AWS S3 (optional, for file uploads)
# AWS_ACCESS_KEY_ID=<your-aws-key>
# AWS_SECRET_ACCESS_KEY=<your-aws-secret>
# AWS_REGION=${options.awsRegion || "us-east-1"}
# S3_BUCKET=<your-bucket-name>
`;

  await Deno.writeTextFile(
    join(options.projectDir, ".kamal", "secrets"),
    content,
  );
  Logger.success("Created .kamal/secrets");

  // Add to .gitignore if not present
  const gitignorePath = join(options.projectDir, ".gitignore");
  try {
    let gitignore = await Deno.readTextFile(gitignorePath);
    if (!gitignore.includes(".kamal/secrets")) {
      gitignore += "\n# Kamal secrets\n.kamal/secrets\n.kamal/secrets.*\n";
      await Deno.writeTextFile(gitignorePath, gitignore);
      Logger.info("Added .kamal/secrets to .gitignore");
    }
  } catch {
    // .gitignore doesn't exist, create it
    await Deno.writeTextFile(
      gitignorePath,
      "# Kamal secrets\n.kamal/secrets\n.kamal/secrets.*\n",
    );
    Logger.info("Created .gitignore with secrets exclusion");
  }
}

/**
 * Create GitHub Actions workflow
 * Matches the production pattern from sc-api/sc-admin-ui:
 * - SSH setup with DEPLOY_SSH_KEY
 * - Ruby + Kamal installation
 * - Secrets written from KAMAL_SECRETS GitHub secret
 * - Kamal handles Docker build/push on the server
 */
async function createGithubWorkflow(options: InfraOptions): Promise<void> {
  const projectName = options.projectName;

  const stagingJob = options.enableStaging
    ? `
  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    environment: ${projectName}-staging
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          printf "%s" "\${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H \${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts 2>/dev/null || true

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.3"

      - name: Install Kamal
        run: gem install kamal

      - name: Write Kamal secrets
        run: |
          mkdir -p .kamal
          printf "%s" "\${{ secrets.KAMAL_SECRETS }}" > .kamal/secrets
          chmod 600 .kamal/secrets

      - name: Deploy staging
        run: kamal deploy -c config/deploy.staging.yml
`
    : "";

  const content = `name: Deploy ${projectName}

on:
  push:
    branches:
      - main${options.enableStaging ? "\n      - staging" : ""}

permissions:
  contents: read

jobs:
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: ${projectName}-prod
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          printf "%s" "\${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H \${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts 2>/dev/null || true

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.3"

      - name: Install Kamal
        run: gem install kamal

      - name: Write Kamal secrets
        run: |
          mkdir -p .kamal
          printf "%s" "\${{ secrets.KAMAL_SECRETS }}" > .kamal/secrets
          chmod 600 .kamal/secrets

      - name: Deploy production
        run: kamal deploy -c config/deploy.yml
${stagingJob}`;

  await Deno.writeTextFile(
    join(options.projectDir, ".github", "workflows", "deploy.yml"),
    content,
  );
  Logger.success("Created .github/workflows/deploy.yml");
}

/**
 * Create Dockerfile if not exists
 */
async function createDockerfile(options: InfraOptions): Promise<void> {
  const dockerfilePath = join(options.projectDir, "Dockerfile");

  // Check if Dockerfile already exists
  try {
    await Deno.stat(dockerfilePath);
    Logger.info("Dockerfile already exists, skipping...");
    return;
  } catch {
    // File doesn't exist, create it
  }

  let content: string;

  if (options.projectType === "api") {
    content = `FROM denoland/deno:alpine-2.6.4

# Set working directory
WORKDIR /app

# Copy dependency files first for better caching
COPY deno.json deno.lock* ./

# Cache dependencies
RUN deno cache --lock=deno.lock deno.json

# Copy source code
COPY . .

# Cache the main application
RUN deno cache src/main.ts

# Expose port
EXPOSE 8000

# Add healthcheck (Deno 2.x doesn't require --allow-net for deno eval)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD deno eval "try { const res = await fetch('http://localhost:8000/health'); Deno.exit(res.ok ? 0 : 1); } catch { Deno.exit(1); }"

# Run the application
CMD ["deno", "run", "--allow-all", "src/main.ts"]
`;
  } else {
    // Fresh app (admin-ui or store)
    content = `# Build stage
FROM denoland/deno:alpine-2.6.4 AS builder

WORKDIR /app

# Copy dependency files
COPY deno.json deno.lock* ./

# Cache dependencies
RUN deno cache --lock=deno.lock deno.json

# Copy source code
COPY . .

# Build the application
RUN deno task build

# Production stage
FROM denoland/deno:alpine-2.6.4

WORKDIR /app

# Copy built files
COPY --from=builder /app/_fresh /app/_fresh
COPY --from=builder /app/static /app/static
COPY --from=builder /app/deno.json /app/deno.json
COPY --from=builder /app/deno.lock /app/deno.lock

# Expose port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD deno eval "try { const res = await fetch('http://localhost:3000/'); Deno.exit(res.ok ? 0 : 1); } catch { Deno.exit(1); }"

# Run the application
CMD ["deno", "run", "--allow-all", "_fresh/server.js"]
`;
  }

  await Deno.writeTextFile(dockerfilePath, content);
  Logger.success("Created Dockerfile");
}

/**
 * Interactive prompts for infra setup
 */
export async function promptInfraOptions(): Promise<InfraOptions | null> {
  const cwd = Deno.cwd();

  // Try to detect project type from deno.json
  let projectType: ProjectType = "api";
  let projectName = "my-app";

  try {
    const denoJson = JSON.parse(
      await Deno.readTextFile(join(cwd, "deno.json")),
    );
    projectName = denoJson.name?.replace("@tstack/", "") || "my-app";

    // Detect type by checking for Fresh
    if (denoJson.imports?.["fresh"] || denoJson.imports?.["@fresh/core"]) {
      // Check if admin or store based on routes
      try {
        await Deno.stat(join(cwd, "routes", "admin"));
        projectType = "admin-ui";
      } catch {
        projectType = "store";
      }
    }
  } catch {
    // No deno.json found
  }

  Logger.banner("Infrastructure Setup");
  Logger.newLine();
  Logger.info(`Detected project type: ${projectType}`);
  Logger.newLine();

  // Registry selection
  Logger.info("Select Docker registry:");
  Logger.code("  1. GHCR (GitHub Container Registry) [default]");
  Logger.code("  2. Docker Hub");
  Logger.code("  3. AWS ECR");

  const registryInput = prompt("Registry [1]: ") || "1";
  const registryMap: Record<string, DockerRegistry> = {
    "1": "ghcr",
    "2": "dockerhub",
    "3": "ecr",
    ghcr: "ghcr",
    dockerhub: "dockerhub",
    ecr: "ecr",
  };
  const registry = registryMap[registryInput.toLowerCase()] || "ghcr";

  // Get registry-specific options
  let githubUsername: string | undefined;
  let dockerUsername: string | undefined;
  let awsAccountId: string | undefined;
  let awsRegion: string | undefined;

  switch (registry) {
    case "ghcr":
      githubUsername = prompt("GitHub username: ") || undefined;
      break;
    case "dockerhub":
      dockerUsername = prompt("Docker Hub username: ") || undefined;
      break;
    case "ecr":
      awsAccountId = prompt("AWS Account ID: ") || undefined;
      awsRegion = prompt("AWS Region [us-east-1]: ") || "us-east-1";
      break;
  }

  // Domain - explain the URL structure
  Logger.newLine();
  Logger.info("Enter your BASE domain (leave empty for placeholder)");
  Logger.info("Examples: vega-tools.com, myapp.com");
  Logger.newLine();
  const domain = prompt(`Base domain [${DEFAULT_DOMAIN}]: `) || DEFAULT_DOMAIN;

  // Path prefix for API
  Logger.newLine();
  Logger.info("Enter API path prefix (without leading /)");
  Logger.info("Examples: ts-be/api, vega-be/api, api/v1");
  const pathPrefix = prompt(`Path prefix [${DEFAULT_PATH_PREFIX}]: `) ||
    DEFAULT_PATH_PREFIX;

  // Show what will be generated
  Logger.newLine();
  Logger.subtitle("Generated URLs for your project:");
  Logger.code(`  API:   https://${domain}/${pathPrefix}`);
  Logger.code(`  Admin: https://admin.${domain}`);
  Logger.code(`  Store: https://${domain}`);
  Logger.newLine();

  // Staging
  const enableStagingInput = prompt("Enable staging environment? [y/N]: ") ||
    "n";
  const enableStaging = enableStagingInput.toLowerCase() === "y";
  let stagingDomain: string | undefined;
  if (enableStaging) {
    const defaultStaging = domain === DEFAULT_DOMAIN
      ? DEFAULT_STAGING_DOMAIN
      : `staging.${domain}`;
    Logger.info(`Staging URLs will use: ${defaultStaging}`);
    stagingDomain = prompt(`Staging base domain [${defaultStaging}]: `) ||
      defaultStaging;
  }

  // SSH user
  const sshUser = prompt("SSH deploy user [deploy]: ") || "deploy";

  // Database accessory (only for API)
  let dbAccessory = false;
  if (projectType === "api") {
    const dbAccessoryInput = prompt("Include Postgres accessory? [y/N]: ") ||
      "n";
    dbAccessory = dbAccessoryInput.toLowerCase() === "y";
  }

  return {
    projectDir: cwd,
    projectName,
    projectType,
    registry,
    domain,
    stagingDomain,
    pathPrefix,
    sshUser,
    enableStaging,
    dbAccessory,
    githubUsername,
    dockerUsername,
    awsAccountId,
    awsRegion,
  };
}
