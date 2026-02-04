import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { createInfrastructure, type InfraOptions } from "./infra.ts";
import { cleanupTempDir, createTempDir } from "../../tests/helpers/tempDir.ts";
import { fileExists } from "../utils/fileWriter.ts";

/**
 * Infrastructure CLI Test Suite
 *
 * Tests cover:
 * 1. File generation (deploy.yml, secrets, workflow, Dockerfile)
 * 2. Registry configurations (GHCR, Docker Hub, ECR)
 * 3. Project type variations (API, Admin-UI, Store)
 * 4. Staging environment support
 * 5. Content validation
 */

// =============================================================================
// TEST SUITE 1: Basic File Generation
// =============================================================================

Deno.test("infra - creates config/deploy.yml", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    assertEquals(await fileExists(join(tempDir, "config", "deploy.yml")), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - creates .kamal/secrets", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    assertEquals(await fileExists(join(tempDir, ".kamal", "secrets")), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - creates .github/workflows/deploy.yml", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    assertEquals(
      await fileExists(join(tempDir, ".github", "workflows", "deploy.yml")),
      true,
    );
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - creates Dockerfile", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    assertEquals(await fileExists(join(tempDir, "Dockerfile")), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 2: Staging Environment
// =============================================================================

Deno.test("infra - creates staging config when enabled", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      stagingDomain: "staging.example.com",
      enableStaging: true,
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    assertEquals(
      await fileExists(join(tempDir, "config", "deploy.staging.yml")),
      true,
    );
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - does not create staging config when disabled", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      enableStaging: false,
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    assertEquals(
      await fileExists(join(tempDir, "config", "deploy.staging.yml")),
      false,
    );
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 3: Registry Configurations
// =============================================================================

Deno.test("infra - GHCR registry config in deploy.yml", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(content.includes("ghcr.io"), true);
    assertEquals(content.includes("ghcr.io/testuser/test-project"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - Docker Hub registry config in deploy.yml", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "dockerhub",
      domain: "example.com",
      dockerUsername: "dockeruser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(content.includes("docker.io"), true);
    assertEquals(content.includes("docker.io/dockeruser/test-project"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - ECR registry config in deploy.yml", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ecr",
      domain: "example.com",
      awsAccountId: "123456789012",
      awsRegion: "us-west-2",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(content.includes("123456789012.dkr.ecr.us-west-2"), true);
    assertEquals(content.includes("username: AWS"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 4: Project Type Variations
// =============================================================================

Deno.test("infra - API project uses port 8000", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-api",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(content.includes('PORT: "8000"'), true);
    assertEquals(content.includes("/health"), true);
    assertEquals(content.includes("path_prefix: /ts-be/api"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - Admin-UI uses admin subdomain", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-admin",
      projectType: "admin-ui",
      registry: "ghcr",
      domain: "example.com", // Base domain
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(content.includes('PORT: "3000"'), true);
    // Admin UI should use admin subdomain, NOT path_prefix
    assertEquals(content.includes("host: admin.example.com"), true);
    assertEquals(content.includes("path_prefix"), false);
    // Should have API_URL pointing to main domain with path prefix
    assertEquals(
      content.includes("API_URL: https://example.com/ts-be/api"),
      true,
    );
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - Store uses base domain", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-store",
      projectType: "store",
      registry: "ghcr",
      domain: "example.com", // Base domain
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(content.includes('PORT: "3000"'), true);
    // Store uses base domain directly
    assertEquals(content.includes("host: example.com"), true);
    assertEquals(content.includes("path_prefix"), false);
    // Should have API_URL pointing to main domain with path prefix
    assertEquals(
      content.includes("API_URL: https://example.com/ts-be/api"),
      true,
    );
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 5: Workflow Content Validation
// =============================================================================

Deno.test("infra - workflow has correct branch triggers", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      enableStaging: true,
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, ".github", "workflows", "deploy.yml"),
    );
    assertEquals(content.includes("- main"), true);
    assertEquals(content.includes("- staging"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - workflow uses DEPLOY_SSH_KEY secret", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, ".github", "workflows", "deploy.yml"),
    );
    assertEquals(content.includes("DEPLOY_SSH_KEY"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - workflow uses KAMAL_SECRETS secret", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, ".github", "workflows", "deploy.yml"),
    );
    assertEquals(content.includes("KAMAL_SECRETS"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - workflow uses Ruby 3.3 and Kamal", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, ".github", "workflows", "deploy.yml"),
    );
    assertEquals(content.includes('ruby-version: "3.3"'), true);
    assertEquals(content.includes("gem install kamal"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - workflow uses GitHub Environment", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "my-app",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, ".github", "workflows", "deploy.yml"),
    );
    assertEquals(content.includes("environment: my-app-prod"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 6: Secrets Template Validation
// =============================================================================

Deno.test("infra - secrets template includes DATABASE_URL", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(join(tempDir, ".kamal", "secrets"));
    assertEquals(content.includes("DATABASE_URL="), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - secrets template includes JWT_SECRET", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(join(tempDir, ".kamal", "secrets"));
    assertEquals(content.includes("JWT_SECRET="), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - secrets added to .gitignore", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    assertEquals(await fileExists(join(tempDir, ".gitignore")), true);
    const content = await Deno.readTextFile(join(tempDir, ".gitignore"));
    assertEquals(content.includes(".kamal/secrets"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 7: Dockerfile Variations
// =============================================================================

Deno.test("infra - API Dockerfile uses deno command", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-api",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(join(tempDir, "Dockerfile"));
    assertEquals(content.includes('"deno"'), true);
    assertEquals(content.includes("src/main.ts"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - Admin-UI Dockerfile has build stage", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-admin",
      projectType: "admin-ui",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(join(tempDir, "Dockerfile"));
    assertEquals(content.includes("AS builder"), true);
    assertEquals(content.includes("deno task build"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - Dockerfile includes HEALTHCHECK", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-project",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(join(tempDir, "Dockerfile"));
    assertEquals(content.includes("HEALTHCHECK"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 8: Database Accessory
// =============================================================================

Deno.test("infra - includes Postgres accessory when enabled", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-api",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      dbAccessory: true,
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(content.includes("accessories:"), true);
    assertEquals(content.includes("postgres:"), true);
    assertEquals(content.includes("postgres:16-alpine"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - no Postgres accessory when disabled", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-api",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      dbAccessory: false,
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(content.includes("accessories:"), false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 8: Path Prefix Configuration
// =============================================================================

Deno.test("infra - API uses default path prefix ts-be/api", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-api",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(content.includes("path_prefix: /ts-be/api"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - API uses custom path prefix", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-api",
      projectType: "api",
      registry: "ghcr",
      domain: "example.com",
      pathPrefix: "vega-be/api",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(content.includes("path_prefix: /vega-be/api"), true);
    assertEquals(content.includes("path_prefix: /ts-be/api"), false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - Admin UI includes API URL with custom path prefix", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-admin",
      projectType: "admin-ui",
      registry: "ghcr",
      domain: "example.com",
      pathPrefix: "vega-be/api",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(
      content.includes("API_URL: https://example.com/vega-be/api"),
      true,
    );
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("infra - Store includes API URL with default path prefix", async () => {
  const tempDir = await createTempDir();
  try {
    const options: InfraOptions = {
      projectDir: tempDir,
      projectName: "test-store",
      projectType: "store",
      registry: "ghcr",
      domain: "example.com",
      githubUsername: "testuser",
    };

    await createInfrastructure(options);

    const content = await Deno.readTextFile(
      join(tempDir, "config", "deploy.yml"),
    );
    assertEquals(
      content.includes("API_URL: https://example.com/ts-be/api"),
      true,
    );
  } finally {
    await cleanupTempDir(tempDir);
  }
});
