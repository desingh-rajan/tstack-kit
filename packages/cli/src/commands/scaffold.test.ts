import { assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { scaffoldEntity } from "./scaffold.ts";
import { createWorkspace } from "./workspace.ts";
import { cleanupTempDir, createTempDir } from "../../tests/helpers/tempDir.ts";
import { fileExists } from "../utils/fileWriter.ts";

/**
 * Scaffold Test Suite - Orchestrator Pattern + Admin-UI Integration
 *
 * Tests cover:
 * 1. Default behavior (API + admin-UI if exists)
 * 2. --skip-admin-ui flag
 * 3. --only-api flag
 * 4. --only-admin-ui flag
 * 5. No admin-ui project (API only)
 * 6. Invalid flag combinations
 * 7. Content validation (API files)
 * 8. Content validation (admin-UI files)
 */

/**
 * Helper: Drop databases created by workspace tests
 * Workspace "test-workspace-123" creates databases: test_workspace_123_api_dev/test/prod
 */
async function dropWorkspaceDatabases(workspaceName: string): Promise<void> {
  // Convert workspace name to database prefix: test-workspace-123 -> test_workspace_123_api
  const dbPrefix = workspaceName.replace(/-/g, "_") + "_api";
  const envs = ["dev", "test", "prod"];
  const pgUser = Deno.env.get("PGUSER") || "postgres";
  const pgPassword = Deno.env.get("PGPASSWORD") || "password";

  for (const env of envs) {
    const dbName = `${dbPrefix}_${env}`;
    try {
      const cmd = new Deno.Command("psql", {
        args: [
          "-U",
          pgUser,
          "-d",
          "postgres",
          "-h",
          "localhost",
          "-c",
          `DROP DATABASE IF EXISTS ${dbName}`,
        ],
        env: { PGPASSWORD: pgPassword },
        stdout: "piped",
        stderr: "piped",
      });
      await cmd.output();
    } catch {
      // Ignore errors during cleanup
    }
  }
}

/**
 * Helper: Get first directory name from a directory
 */
async function getFirstDirName(dirPath: string): Promise<string | null> {
  for await (const entry of Deno.readDir(dirPath)) {
    if (entry.isDirectory) {
      return entry.name;
    }
  }
  return null;
}

/**
 * Helper: Create minimal API project structure
 * Some tests need a basic API structure with deno.json
 */
async function createMinimalApiProject(tempDir: string): Promise<void> {
  // Create src directory
  await Deno.mkdir(join(tempDir, "src"), { recursive: true });

  // Create minimal deno.json to mark it as a Deno project
  await Deno.writeTextFile(
    join(tempDir, "deno.json"),
    JSON.stringify(
      {
        name: "test-project",
        tasks: {
          dev: "echo dev",
        },
      },
      null,
      2,
    ),
  );
}

// =============================================================================
// TEST SUITE 1: Basic API Scaffolding (No Admin-UI)
// =============================================================================

Deno.test(
  "scaffold - generates 8 API files by default (no admin-ui project)",
  async () => {
    const tempDir = await createTempDir();
    try {
      await scaffoldEntity({
        entityName: "ticket",
        targetDir: tempDir,
      });

      // Check all 8 API files exist (5 core + 1 test + 1 admin route + 1 admin test)
      const basePath = join(tempDir, "src", "entities", "tickets");
      assertEquals(await fileExists(join(basePath, "ticket.model.ts")), true);
      assertEquals(await fileExists(join(basePath, "ticket.dto.ts")), true);
      assertEquals(await fileExists(join(basePath, "ticket.service.ts")), true);
      assertEquals(
        await fileExists(join(basePath, "ticket.controller.ts")),
        true,
      );
      assertEquals(await fileExists(join(basePath, "ticket.route.ts")), true);
      assertEquals(await fileExists(join(basePath, "ticket.test.ts")), true);
      assertEquals(
        await fileExists(join(basePath, "ticket.admin.route.ts")),
        true,
      );
      assertEquals(
        await fileExists(join(basePath, "ticket.admin.test.ts")),
        true,
      );

      // Should NOT generate admin-UI files (no admin-ui project exists)
      const adminUiPath = join(tempDir, "..", "test-admin-ui");
      assertEquals(await fileExists(adminUiPath), false);
    } finally {
      await cleanupTempDir(tempDir);
    }
  },
);

Deno.test(
  "scaffold - skipAdmin flag generates only 6 files (no admin routes)",
  async () => {
    const tempDir = await createTempDir();
    try {
      await scaffoldEntity({
        entityName: "ticket",
        targetDir: tempDir,
        skipAdmin: true,
      });

      const basePath = join(tempDir, "src", "entities", "tickets");
      assertEquals(await fileExists(join(basePath, "ticket.model.ts")), true);
      assertEquals(await fileExists(join(basePath, "ticket.dto.ts")), true);
      assertEquals(await fileExists(join(basePath, "ticket.service.ts")), true);
      assertEquals(
        await fileExists(join(basePath, "ticket.controller.ts")),
        true,
      );
      assertEquals(await fileExists(join(basePath, "ticket.route.ts")), true);
      assertEquals(await fileExists(join(basePath, "ticket.test.ts")), true);
      assertEquals(
        await fileExists(join(basePath, "ticket.admin.route.ts")),
        false,
      );
      assertEquals(
        await fileExists(join(basePath, "ticket.admin.test.ts")),
        false,
      );
    } finally {
      await cleanupTempDir(tempDir);
    }
  },
);

Deno.test("scaffold - skipTests flag generates no test files", async () => {
  const tempDir = await createTempDir();
  try {
    await scaffoldEntity({
      entityName: "ticket",
      targetDir: tempDir,
      skipTests: true,
    });

    const basePath = join(tempDir, "src", "entities", "tickets");
    assertEquals(await fileExists(join(basePath, "ticket.model.ts")), true);
    assertEquals(await fileExists(join(basePath, "ticket.dto.ts")), true);
    assertEquals(await fileExists(join(basePath, "ticket.service.ts")), true);
    assertEquals(
      await fileExists(join(basePath, "ticket.controller.ts")),
      true,
    );
    assertEquals(await fileExists(join(basePath, "ticket.route.ts")), true);
    assertEquals(await fileExists(join(basePath, "ticket.test.ts")), false);
    assertEquals(
      await fileExists(join(basePath, "ticket.admin.route.ts")),
      true,
    );
    assertEquals(
      await fileExists(join(basePath, "ticket.admin.test.ts")),
      false,
    );
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 2: Admin-UI Integration Tests
// =============================================================================

Deno.test({
  name: "scaffold - creates both API and admin-UI when admin-ui project exists",
  // Disable resource sanitizer - createWorkspace opens KV databases
  sanitizeResources: false,
  fn: async () => {
    const workspaceDir = await createTempDir();
    const wsName = `test-workspace-${Date.now()}`;
    try {
      // Create workspace with both API and admin-UI
      await createWorkspace({
        name: wsName,
        targetDir: workspaceDir,
        withApi: true,
        withAdminUi: true,
        skipRemote: true,
      });

      // Find the API project directory
      const workspaceName = await getFirstDirName(workspaceDir);
      const apiDir = join(workspaceDir, workspaceName!, `${workspaceName}-api`);
      const adminUiDir = join(
        workspaceDir,
        workspaceName!,
        `${workspaceName}-admin-ui`,
      );

      // Scaffold entity
      await scaffoldEntity({
        entityName: "ticket",
        targetDir: apiDir,
      });

      // Check API files
      const apiBasePath = join(apiDir, "src", "entities", "tickets");
      assertEquals(
        await fileExists(join(apiBasePath, "ticket.model.ts")),
        true,
      );
      assertEquals(await fileExists(join(apiBasePath, "ticket.dto.ts")), true);
      assertEquals(
        await fileExists(join(apiBasePath, "ticket.service.ts")),
        true,
      );
      assertEquals(
        await fileExists(join(apiBasePath, "ticket.controller.ts")),
        true,
      );
      assertEquals(
        await fileExists(join(apiBasePath, "ticket.route.ts")),
        true,
      );

      // Check admin-UI files
      assertEquals(
        await fileExists(
          join(adminUiDir, "config", "entities", "tickets.config.tsx"),
        ),
        true,
        "Should create entity config",
      );
      assertEquals(
        await fileExists(
          join(adminUiDir, "routes", "admin", "tickets", "index.tsx"),
        ),
        true,
        "Should create list page",
      );
      assertEquals(
        await fileExists(
          join(adminUiDir, "routes", "admin", "tickets", "[id].tsx"),
        ),
        true,
        "Should create show page",
      );
      assertEquals(
        await fileExists(
          join(adminUiDir, "routes", "admin", "tickets", "new.tsx"),
        ),
        true,
        "Should create create page",
      );
      assertEquals(
        await fileExists(
          join(adminUiDir, "routes", "admin", "tickets", "[id]", "edit.tsx"),
        ),
        true,
        "Should create edit page",
      );
    } finally {
      await cleanupTempDir(workspaceDir);
      await dropWorkspaceDatabases(wsName);
    }
  },
});

Deno.test({
  name: "scaffold - --skip-admin-ui skips admin-UI even when project exists",
  sanitizeResources: false,
  fn: async () => {
    const workspaceDir = await createTempDir();
    const wsName = `test-workspace-${Date.now()}`;
    try {
      // Create workspace with both projects
      await createWorkspace({
        name: wsName,
        targetDir: workspaceDir,
        withApi: true,
        withAdminUi: true,
        skipRemote: true,
      });

      const workspaceName = await getFirstDirName(workspaceDir);
      const apiDir = join(workspaceDir, workspaceName!, `${workspaceName}-api`);
      const adminUiDir = join(
        workspaceDir,
        workspaceName!,
        `${workspaceName}-admin-ui`,
      );

      // Scaffold with --skip-admin-ui
      await scaffoldEntity({
        entityName: "ticket",
        targetDir: apiDir,
        skipAdminUi: true,
      });

      // Check API files exist
      const apiBasePath = join(apiDir, "src", "entities", "tickets");
      assertEquals(
        await fileExists(join(apiBasePath, "ticket.model.ts")),
        true,
      );

      // Check admin-UI files do NOT exist
      assertEquals(
        await fileExists(
          join(adminUiDir, "config", "entities", "tickets.config.tsx"),
        ),
        false,
        "Should NOT create admin-UI files",
      );
    } finally {
      await cleanupTempDir(workspaceDir);
      await dropWorkspaceDatabases(wsName);
    }
  },
});

Deno.test({
  name: "scaffold - --only-api creates only API files",
  sanitizeResources: false,
  fn: async () => {
    const workspaceDir = await createTempDir();
    const wsName = `test-workspace-${Date.now()}`;
    try {
      // Create workspace with both projects
      await createWorkspace({
        name: wsName,
        targetDir: workspaceDir,
        withApi: true,
        withAdminUi: true,
        skipRemote: true,
      });

      const workspaceName = await getFirstDirName(workspaceDir);
      const apiDir = join(workspaceDir, workspaceName!, `${workspaceName}-api`);
      const adminUiDir = join(
        workspaceDir,
        workspaceName!,
        `${workspaceName}-admin-ui`,
      );

      // Scaffold with --only-api
      await scaffoldEntity({
        entityName: "ticket",
        targetDir: apiDir,
        onlyApi: true,
      });

      // API files should exist
      const apiBasePath = join(apiDir, "src", "entities", "tickets");
      assertEquals(
        await fileExists(join(apiBasePath, "ticket.model.ts")),
        true,
      );

      // Admin-UI files should NOT exist
      assertEquals(
        await fileExists(
          join(adminUiDir, "config", "entities", "tickets.config.tsx"),
        ),
        false,
      );
    } finally {
      await cleanupTempDir(workspaceDir);
      await dropWorkspaceDatabases(wsName);
    }
  },
});

Deno.test({
  name: "scaffold - --only-admin-ui creates only admin-UI files",
  sanitizeResources: false,
  fn: async () => {
    const workspaceDir = await createTempDir();
    const wsName = `test-workspace-${Date.now()}`;
    try {
      // Create workspace
      await createWorkspace({
        name: wsName,
        targetDir: workspaceDir,
        withApi: true,
        withAdminUi: true,
        skipRemote: true,
      });

      const workspaceName = await getFirstDirName(workspaceDir);
      const apiDir = join(workspaceDir, workspaceName!, `${workspaceName}-api`);
      const adminUiDir = join(
        workspaceDir,
        workspaceName!,
        `${workspaceName}-admin-ui`,
      );

      // Scaffold with --only-admin-ui
      await scaffoldEntity({
        entityName: "ticket",
        targetDir: apiDir,
        onlyAdminUi: true,
      });

      // API files should NOT exist
      const apiBasePath = join(apiDir, "src", "entities", "tickets");
      assertEquals(
        await fileExists(join(apiBasePath, "ticket.model.ts")),
        false,
      );

      // Admin-UI files SHOULD exist
      assertEquals(
        await fileExists(
          join(adminUiDir, "config", "entities", "tickets.config.tsx"),
        ),
        true,
      );
      assertEquals(
        await fileExists(
          join(adminUiDir, "routes", "admin", "tickets", "index.tsx"),
        ),
        true,
      );
    } finally {
      await cleanupTempDir(workspaceDir);
      await dropWorkspaceDatabases(wsName);
    }
  },
});

// =============================================================================
// TEST SUITE 3: Error Handling
// =============================================================================

Deno.test("scaffold - errors on --only-api with --only-admin-ui", async () => {
  const tempDir = await createTempDir();
  try {
    await assertRejects(
      async () => {
        await scaffoldEntity({
          entityName: "ticket",
          targetDir: tempDir,
          onlyApi: true,
          onlyAdminUi: true,
        });
      },
      Error,
      "Cannot use --only-api and --only-admin-ui together",
    );
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 4: Entity Naming Tests (from original suite)
// =============================================================================

Deno.test("scaffold - uses correct folder naming (snake_plural)", async () => {
  const tempDir = await createTempDir();
  try {
    await createMinimalApiProject(tempDir);

    await scaffoldEntity({
      entityName: "blog-post",
      targetDir: tempDir,
    });

    const entityDir = join(tempDir, "src", "entities", "blog_posts");
    const stat = await Deno.stat(entityDir);
    assertEquals(stat.isDirectory, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("scaffold - uses correct file naming (kebab-singular)", async () => {
  const tempDir = await createTempDir();
  try {
    await scaffoldEntity({
      entityName: "blog-post",
      targetDir: tempDir,
    });

    const basePath = join(tempDir, "src", "entities", "blog_posts");
    assertEquals(await fileExists(join(basePath, "blog-post.model.ts")), true);
    assertEquals(await fileExists(join(basePath, "blog-post.dto.ts")), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("scaffold - handles plural input correctly", async () => {
  const tempDir = await createTempDir();
  try {
    await scaffoldEntity({
      entityName: "tickets",
      targetDir: tempDir,
    });

    const basePath = join(tempDir, "src", "entities", "tickets");
    assertEquals(await fileExists(join(basePath, "ticket.model.ts")), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("scaffold - handles snake_case input", async () => {
  const tempDir = await createTempDir();
  try {
    await scaffoldEntity({
      entityName: "site_settings",
      targetDir: tempDir,
    });

    const basePath = join(tempDir, "src", "entities", "site_settings");
    assertEquals(
      await fileExists(join(basePath, "site-setting.model.ts")),
      true,
    );
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 5: Content Validation (API Files)
// =============================================================================

Deno.test("scaffold - model contains correct table name", async () => {
  const tempDir = await createTempDir();
  try {
    await scaffoldEntity({
      entityName: "blog-post",
      targetDir: tempDir,
    });

    const modelPath = join(
      tempDir,
      "src",
      "entities",
      "blog_posts",
      "blog-post.model.ts",
    );
    const content = await Deno.readTextFile(modelPath);

    // Check for correct camelCase plural variable name and snake_case table name
    assertEquals(
      content.includes('export const blogPosts = pgTable("blog_posts"'),
      true,
    );
    assertEquals(content.includes("...commonColumns"), true);
    assertEquals(
      content.includes("// TODO: Add your custom fields here"),
      true,
    );
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("scaffold - service extends BaseService", async () => {
  const tempDir = await createTempDir();
  try {
    await scaffoldEntity({
      entityName: "ticket",
      targetDir: tempDir,
    });

    const servicePath = join(
      tempDir,
      "src",
      "entities",
      "tickets",
      "ticket.service.ts",
    );
    const content = await Deno.readTextFile(servicePath);

    assertEquals(
      content.includes('from "../../shared/services/base.service.ts"'),
      true,
    );
    assertEquals(content.includes("extends BaseService"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("scaffold - controller extends BaseController", async () => {
  const tempDir = await createTempDir();
  try {
    await scaffoldEntity({
      entityName: "ticket",
      targetDir: tempDir,
    });

    const controllerPath = join(
      tempDir,
      "src",
      "entities",
      "tickets",
      "ticket.controller.ts",
    );
    const content = await Deno.readTextFile(controllerPath);

    assertEquals(
      content.includes('from "../../shared/controllers/base.controller.ts"'),
      true,
    );
    assertEquals(content.includes("extends BaseController"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// =============================================================================
// TEST SUITE 6: Content Validation (Admin-UI Files)
// =============================================================================

Deno.test({
  name: "scaffold - admin-UI config has correct structure",
  sanitizeResources: false,
  fn: async () => {
    const workspaceDir = await createTempDir();
    const wsName = `test-workspace-${Date.now()}`;
    try {
      await createWorkspace({
        name: wsName,
        targetDir: workspaceDir,
        withApi: true,
        withAdminUi: true,
        skipRemote: true,
      });

      const workspaceName = await getFirstDirName(workspaceDir);
      const apiDir = join(workspaceDir, workspaceName!, `${workspaceName}-api`);
      const adminUiDir = join(
        workspaceDir,
        workspaceName!,
        `${workspaceName}-admin-ui`,
      );

      await scaffoldEntity({
        entityName: "ticket",
        targetDir: apiDir,
      });

      const configPath = join(
        adminUiDir,
        "config",
        "entities",
        "tickets.config.tsx",
      );
      const content = await Deno.readTextFile(configPath);

      // Check essential config properties
      assertEquals(content.includes("export const ticketConfig"), true);
      assertEquals(content.includes('name: "tickets"'), true);
      assertEquals(content.includes('singularName: "Ticket"'), true);
      assertEquals(content.includes('pluralName: "Tickets"'), true);
      assertEquals(content.includes('apiPath: "/ts-admin/tickets"'), true);
      assertEquals(content.includes("fields: ["), true);
      assertEquals(content.includes("canCreate: true"), true);
      assertEquals(content.includes("canEdit: true"), true);
      assertEquals(content.includes("canDelete: true"), true);
    } finally {
      await cleanupTempDir(workspaceDir);
      await dropWorkspaceDatabases(wsName);
    }
  },
});

Deno.test({
  name: "scaffold - admin-UI list page uses DataTable",
  sanitizeResources: false,
  fn: async () => {
    const workspaceDir = await createTempDir();
    const wsName = `test-workspace-${Date.now()}`;
    try {
      await createWorkspace({
        name: wsName,
        targetDir: workspaceDir,
        withApi: true,
        withAdminUi: true,
        skipRemote: true,
      });

      const workspaceName = await getFirstDirName(workspaceDir);
      const apiDir = join(workspaceDir, workspaceName!, `${workspaceName}-api`);
      const adminUiDir = join(
        workspaceDir,
        workspaceName!,
        `${workspaceName}-admin-ui`,
      );

      await scaffoldEntity({
        entityName: "ticket",
        targetDir: apiDir,
      });

      const listPagePath = join(
        adminUiDir,
        "routes",
        "admin",
        "tickets",
        "index.tsx",
      );
      const content = await Deno.readTextFile(listPagePath);

      assertEquals(
        content.includes('from "@/components/admin/DataTable.tsx"'),
        true,
      );
      assertEquals(content.includes("<DataTable"), true);
      assertEquals(content.includes("createCRUDHandlers"), true);
    } finally {
      await cleanupTempDir(workspaceDir);
      await dropWorkspaceDatabases(wsName);
    }
  },
});

Deno.test({
  name: "scaffold - admin-UI show page uses ShowPage",
  sanitizeResources: false,
  fn: async () => {
    const workspaceDir = await createTempDir();
    const wsName = `test-workspace-${Date.now()}`;
    try {
      await createWorkspace({
        name: wsName,
        targetDir: workspaceDir,
        withApi: true,
        withAdminUi: true,
        skipRemote: true,
      });

      const workspaceName = await getFirstDirName(workspaceDir);
      const apiDir = join(workspaceDir, workspaceName!, `${workspaceName}-api`);
      const adminUiDir = join(
        workspaceDir,
        workspaceName!,
        `${workspaceName}-admin-ui`,
      );

      await scaffoldEntity({
        entityName: "ticket",
        targetDir: apiDir,
      });

      const showPagePath = join(
        adminUiDir,
        "routes",
        "admin",
        "tickets",
        "[id].tsx",
      );
      const content = await Deno.readTextFile(showPagePath);

      assertEquals(
        content.includes('from "@/components/admin/ShowPage.tsx"'),
        true,
      );
      assertEquals(content.includes("<ShowPage"), true);
    } finally {
      await cleanupTempDir(workspaceDir);
      await dropWorkspaceDatabases(wsName);
    }
  },
});

Deno.test({
  name: "scaffold - admin-UI form pages use GenericForm",
  sanitizeResources: false,
  fn: async () => {
    const workspaceDir = await createTempDir();
    const wsName = `test-workspace-${Date.now()}`;
    try {
      await createWorkspace({
        name: wsName,
        targetDir: workspaceDir,
        withApi: true,
        withAdminUi: true,
        skipRemote: true,
      });

      const workspaceName = await getFirstDirName(workspaceDir);
      const apiDir = join(workspaceDir, workspaceName!, `${workspaceName}-api`);
      const adminUiDir = join(
        workspaceDir,
        workspaceName!,
        `${workspaceName}-admin-ui`,
      );

      await scaffoldEntity({
        entityName: "ticket",
        targetDir: apiDir,
      });

      // Check create page
      const createPagePath = join(
        adminUiDir,
        "routes",
        "admin",
        "tickets",
        "new.tsx",
      );
      const createContent = await Deno.readTextFile(createPagePath);
      assertEquals(
        createContent.includes('from "@/components/admin/GenericForm.tsx"'),
        true,
      );
      assertEquals(createContent.includes("<GenericForm"), true);

      // Check edit page
      const editPagePath = join(
        adminUiDir,
        "routes",
        "admin",
        "tickets",
        "[id]",
        "edit.tsx",
      );
      const editContent = await Deno.readTextFile(editPagePath);
      assertEquals(
        editContent.includes('from "@/components/admin/GenericForm.tsx"'),
        true,
      );
      assertEquals(editContent.includes("<GenericForm"), true);
    } finally {
      await cleanupTempDir(workspaceDir);
      await dropWorkspaceDatabases(wsName);
    }
  },
});
