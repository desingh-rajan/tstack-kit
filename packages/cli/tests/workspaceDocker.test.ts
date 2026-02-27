/// <reference lib="deno.unstable" />

/**
 * Tests for workspace Docker configuration generation.
 * Validates that generateWorkspaceDocker() produces the correct files
 * with the correct content for various component combinations.
 */

import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { cleanupTempDir, createTempDir } from "./helpers/tempDir.ts";
import { generateWorkspaceDocker } from "../src/commands/workspace-docker.ts";

Deno.test({
  name: "Workspace Docker Generation",
  async fn(t) {
    await t.step(
      "generates all files for full workspace (api + admin-ui + store + status)",
      async () => {
        const tempDir = await createTempDir();
        try {
          await generateWorkspaceDocker({
            workspacePath: tempDir,
            workspaceName: "myapp",
            components: ["api", "admin-ui", "store", "status"],
            dbUser: "postgres",
            dbPassword: "password",
          });

          // Check all files exist
          const expectedFiles = [
            "docker-compose.dev.yml",
            "docker-compose.test.yml",
            "docker-compose.yml",
            "start-dev.sh",
            "start-test.sh",
            "start-prod.sh",
            "stop.sh",
            "deno.json",
          ];

          for (const file of expectedFiles) {
            const stat = await Deno.stat(join(tempDir, file));
            assertEquals(stat.isFile, true, `${file} should exist`);
          }

          // Check shell scripts are executable
          for (
            const script of [
              "start-dev.sh",
              "start-test.sh",
              "start-prod.sh",
              "stop.sh",
            ]
          ) {
            const stat = await Deno.stat(join(tempDir, script));
            assertEquals(
              (stat.mode! & 0o111) !== 0,
              true,
              `${script} should be executable`,
            );
          }
        } finally {
          await cleanupTempDir(tempDir);
        }
      },
    );

    await t.step(
      "docker-compose.dev.yml references correct project paths",
      async () => {
        const tempDir = await createTempDir();
        try {
          await generateWorkspaceDocker({
            workspacePath: tempDir,
            workspaceName: "testws",
            components: ["api", "admin-ui", "store", "status"],
            dbUser: "myuser",
            dbPassword: "mypass",
          });

          const content = await Deno.readTextFile(
            join(tempDir, "docker-compose.dev.yml"),
          );

          // Check project context paths
          assertEquals(
            content.includes("context: ./testws-api"),
            true,
            "Should reference testws-api",
          );
          assertEquals(
            content.includes("context: ./testws-admin-ui"),
            true,
            "Should reference testws-admin-ui",
          );
          assertEquals(
            content.includes("context: ./testws-store"),
            true,
            "Should reference testws-store",
          );
          assertEquals(
            content.includes("context: ./testws-status"),
            true,
            "Should reference testws-status",
          );

          // Check DB credentials are embedded
          assertEquals(
            content.includes("myuser:mypass@host.docker.internal"),
            true,
            "Should use provided DB credentials",
          );
          assertEquals(
            content.includes("testws_dev"),
            true,
            "Should use dev database name",
          );

          // Check Dockerfile.dev is used
          assertEquals(
            content.includes("dockerfile: Dockerfile.dev"),
            true,
            "Should use Dockerfile.dev for dev containers",
          );

          // Check ports
          assertEquals(
            content.includes('"8000:8000"'),
            true,
            "API should be on port 8000",
          );
          assertEquals(
            content.includes('"5173:5173"'),
            true,
            "Admin UI should be on port 5173",
          );
          assertEquals(
            content.includes('"5174:5174"'),
            true,
            "Store should be on port 5174",
          );
          assertEquals(
            content.includes('"8001:8001"'),
            true,
            "Status should be on port 8001",
          );

          // Check Postgres is on db profile
          assertEquals(
            content.includes('profiles: ["db"]'),
            true,
            "Postgres should be on db profile",
          );

          // Check host.docker.internal
          assertEquals(
            content.includes("host.docker.internal:host-gateway"),
            true,
            "Should include host.docker.internal mapping",
          );

          // Check Dozzle log viewer
          assertEquals(
            content.includes("dozzle:"),
            true,
            "Should include Dozzle service",
          );
          assertEquals(
            content.includes('"9999:8080"'),
            true,
            "Dozzle should be on port 9999",
          );
          assertEquals(
            content.includes("/var/run/docker.sock:/var/run/docker.sock:ro"),
            true,
            "Dozzle should have read-only Docker socket mount",
          );
        } finally {
          await cleanupTempDir(tempDir);
        }
      },
    );

    await t.step(
      "docker-compose.test.yml uses production Dockerfile",
      async () => {
        const tempDir = await createTempDir();
        try {
          await generateWorkspaceDocker({
            workspacePath: tempDir,
            workspaceName: "testws",
            components: ["api", "admin-ui"],
            dbUser: "postgres",
            dbPassword: "password",
          });

          const content = await Deno.readTextFile(
            join(tempDir, "docker-compose.test.yml"),
          );

          // Test compose uses production Dockerfile (not Dockerfile.dev)
          assertEquals(
            content.includes("dockerfile: Dockerfile\n"),
            true,
            "Test compose should use production Dockerfile",
          );
          assertEquals(
            content.includes("Dockerfile.dev"),
            false,
            "Test compose should NOT use Dockerfile.dev",
          );

          // Test DB name
          assertEquals(
            content.includes("testws_test"),
            true,
            "Should use test database name",
          );

          // Admin UI on production port
          assertEquals(
            content.includes('"3001:3001"'),
            true,
            "Admin UI should be on port 3001 in test mode",
          );

          // Dozzle in test compose too
          assertEquals(
            content.includes("dozzle:"),
            true,
            "Test compose should include Dozzle",
          );
        } finally {
          await cleanupTempDir(tempDir);
        }
      },
    );

    await t.step("docker-compose.yml uses production database", async () => {
      const tempDir = await createTempDir();
      try {
        await generateWorkspaceDocker({
          workspacePath: tempDir,
          workspaceName: "prodtest",
          components: ["api", "store"],
          dbUser: "postgres",
          dbPassword: "password",
        });

        const content = await Deno.readTextFile(
          join(tempDir, "docker-compose.yml"),
        );

        // Prod DB name
        assertEquals(
          content.includes("prodtest_prod"),
          true,
          "Should use prod database name",
        );

        // Store on production port
        assertEquals(
          content.includes('"3002:3002"'),
          true,
          "Store should be on port 3002 in production",
        );

        // Should NOT include admin-ui (not in components)
        assertEquals(
          content.includes("admin-ui"),
          false,
          "Should not include admin-ui when not in components",
        );
      } finally {
        await cleanupTempDir(tempDir);
      }
    });

    await t.step(
      "workspace deno.json has correct tasks for selected components",
      async () => {
        const tempDir = await createTempDir();
        try {
          await generateWorkspaceDocker({
            workspacePath: tempDir,
            workspaceName: "myapp",
            components: ["api", "admin-ui", "store"],
            dbUser: "postgres",
            dbPassword: "password",
          });

          const content = await Deno.readTextFile(join(tempDir, "deno.json"));
          const json = JSON.parse(content);

          // Check dev task exists and references all three services
          assertEquals(typeof json.tasks.dev, "string", "Should have dev task");
          assertEquals(
            json.tasks.dev.includes("myapp-api"),
            true,
            "dev task should reference api",
          );
          assertEquals(
            json.tasks.dev.includes("myapp-admin-ui"),
            true,
            "dev task should reference admin-ui",
          );
          assertEquals(
            json.tasks.dev.includes("myapp-store"),
            true,
            "dev task should reference store",
          );
          assertEquals(
            json.tasks.dev.includes("concurrently"),
            true,
            "dev task should use concurrently",
          );

          // Check individual tasks
          assertEquals(
            typeof json.tasks["dev:api"],
            "string",
            "Should have dev:api task",
          );
          assertEquals(
            typeof json.tasks["dev:admin"],
            "string",
            "Should have dev:admin task",
          );
          assertEquals(
            typeof json.tasks["dev:store"],
            "string",
            "Should have dev:store task",
          );

          // Status was not included
          assertEquals(
            json.tasks["dev:status"],
            undefined,
            "Should not have dev:status when status not in components",
          );
        } finally {
          await cleanupTempDir(tempDir);
        }
      },
    );

    await t.step("handles api-only workspace correctly", async () => {
      const tempDir = await createTempDir();
      try {
        await generateWorkspaceDocker({
          workspacePath: tempDir,
          workspaceName: "apionly",
          components: ["api"],
          dbUser: "postgres",
          dbPassword: "password",
        });

        const devContent = await Deno.readTextFile(
          join(tempDir, "docker-compose.dev.yml"),
        );

        // Should have api service
        assertEquals(
          devContent.includes("apionly-api"),
          true,
          "Should include api service",
        );

        // Should NOT have admin-ui, store, or status
        assertEquals(
          devContent.includes("admin-ui:"),
          false,
          "Should not include admin-ui service",
        );
        assertEquals(
          devContent.includes("store:"),
          false,
          "Should not include store service",
        );
        assertEquals(
          devContent.includes("status:"),
          false,
          "Should not include status service",
        );

        // deno.json should only have api tasks
        const denoContent = await Deno.readTextFile(join(tempDir, "deno.json"));
        const json = JSON.parse(denoContent);
        assertEquals(
          typeof json.tasks["dev:api"],
          "string",
          "Should have dev:api",
        );
        assertEquals(
          json.tasks["dev:admin"],
          undefined,
          "Should not have dev:admin",
        );
      } finally {
        await cleanupTempDir(tempDir);
      }
    });
  },
});
