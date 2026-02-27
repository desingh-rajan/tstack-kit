import { join } from "@std/path";
import { Logger } from "../utils/logger.ts";

/**
 * Docker Compose and shell script generation for TStack workspaces.
 *
 * Generates:
 *   - docker-compose.dev.yml   (hot-reload dev containers)
 *   - docker-compose.test.yml  (production-grade containers + test DB)
 *   - docker-compose.yml       (production containers + prod DB)
 *   - start-dev.sh, start-test.sh, start-prod.sh, stop.sh
 *   - deno.json                (non-Docker local dev with concurrently)
 */

type ComponentType = "api" | "admin-ui" | "store" | "status";

interface DockerGenOptions {
  workspacePath: string;
  workspaceName: string;
  components: ComponentType[];
  dbUser: string;
  dbPassword: string;
}

// ---------------------------------------------------------------------------
// docker-compose.dev.yml
// ---------------------------------------------------------------------------

function generateDevCompose(opts: DockerGenOptions): string {
  const { workspaceName: name, components, dbUser, dbPassword } = opts;
  const devDbName = `${name.replace(/-/g, "_")}_dev`;

  const services: string[] = [];

  if (components.includes("api")) {
    services.push(`  api:
    build:
      context: ./${name}-api
      dockerfile: Dockerfile.dev
    container_name: ${name}-api-dev
    ports:
      - "8000:8000"
    volumes:
      - ./${name}-api/src:/app/src
      - ./${name}-api/scripts:/app/scripts
      - ./${name}-api/migrations:/app/migrations
      - ./${name}-api/deno.json:/app/deno.json
    env_file:
      - ./${name}-api/.env.development.local
    environment:
      DATABASE_URL: postgresql://${dbUser}:${dbPassword}@host.docker.internal:5432/${devDbName}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  if (components.includes("admin-ui")) {
    const dependsOn = components.includes("api")
      ? `
    depends_on:
      - api`
      : "";
    services.push(`  admin-ui:
    build:
      context: ./${name}-admin-ui
      dockerfile: Dockerfile.dev
    container_name: ${name}-admin-ui-dev
    ports:
      - "5173:5173"
    volumes:
      - ./${name}-admin-ui/components:/app/components
      - ./${name}-admin-ui/config:/app/config
      - ./${name}-admin-ui/entities:/app/entities
      - ./${name}-admin-ui/islands:/app/islands
      - ./${name}-admin-ui/lib:/app/lib
      - ./${name}-admin-ui/routes:/app/routes
      - ./${name}-admin-ui/static:/app/static
      - ./${name}-admin-ui/assets:/app/assets
      - ./${name}-admin-ui/deno.json:/app/deno.json
      - ./${name}-admin-ui/vite.config.ts:/app/vite.config.ts
      - ./${name}-admin-ui/tailwind.config.ts:/app/tailwind.config.ts
      - ./${name}-admin-ui/main.ts:/app/main.ts
      - ./${name}-admin-ui/client.ts:/app/client.ts
      - ./${name}-admin-ui/utils.ts:/app/utils.ts
    env_file:
      - ./${name}-admin-ui/.env
    environment:
      API_BASE_URL: http://api:8000${dependsOn}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  if (components.includes("store")) {
    const dependsOn = components.includes("api")
      ? `
    depends_on:
      - api`
      : "";
    services.push(`  store:
    build:
      context: ./${name}-store
      dockerfile: Dockerfile.dev
    container_name: ${name}-store-dev
    ports:
      - "5174:5174"
    volumes:
      - ./${name}-store/components:/app/components
      - ./${name}-store/islands:/app/islands
      - ./${name}-store/lib:/app/lib
      - ./${name}-store/routes:/app/routes
      - ./${name}-store/static:/app/static
      - ./${name}-store/assets:/app/assets
      - ./${name}-store/deno.json:/app/deno.json
      - ./${name}-store/vite.config.ts:/app/vite.config.ts
      - ./${name}-store/main.ts:/app/main.ts
      - ./${name}-store/client.ts:/app/client.ts
      - ./${name}-store/utils.ts:/app/utils.ts
    env_file:
      - ./${name}-store/.env
    environment:
      API_BASE_URL: http://api:8000${dependsOn}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  if (components.includes("status")) {
    const dependsOn = components.includes("api")
      ? `
    depends_on:
      - api`
      : "";
    services.push(`  status:
    build:
      context: ./${name}-status
      dockerfile: Dockerfile
    container_name: ${name}-status-dev
    ports:
      - "8001:8001"
    env_file:
      - ./${name}-status/.env
    environment:
      API_URL: http://api:8000${dependsOn}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  // Dozzle -- Docker log viewer
  services.push(`  # Dozzle -- real-time Docker log viewer
  # Access at http://localhost:9999
  dozzle:
    image: amir20/dozzle:latest
    container_name: ${name}-dozzle
    ports:
      - "9999:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped`);

  // Postgres on the "db" profile -- opt-in with --profile db
  services.push(`  # Opt-in: containerised PostgreSQL (use --profile db)
  # By default, services connect to the host machine's PostgreSQL.
  postgres:
    image: postgres:16-alpine
    container_name: ${name}-postgres
    profiles: ["db"]
    environment:
      POSTGRES_DB: ${devDbName}
      POSTGRES_USER: ${dbUser}
      POSTGRES_PASSWORD: ${dbPassword}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${dbUser} -d ${devDbName}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped`);

  return `# TStack Dev Environment -- hot reload enabled
# Default: uses host machine's PostgreSQL (databases created by tstack create)
# To use containerised PostgreSQL: ./start-dev.sh --with-db
#
# Ports:
#   API:        http://localhost:8000
#   Admin UI:   http://localhost:5173
#   Storefront: http://localhost:5174
#   Status:     http://localhost:8001
#   Dozzle:     http://localhost:9999  (Docker log viewer)

services:
${services.join("\n\n")}

volumes:
  postgres_data:
`;
}

// ---------------------------------------------------------------------------
// docker-compose.test.yml  (production images + test DB)
// ---------------------------------------------------------------------------

function generateTestCompose(opts: DockerGenOptions): string {
  const { workspaceName: name, components, dbUser, dbPassword } = opts;
  const testDbName = `${name.replace(/-/g, "_")}_test`;

  const services: string[] = [];

  if (components.includes("api")) {
    services.push(`  api:
    build:
      context: ./${name}-api
      dockerfile: Dockerfile
    container_name: ${name}-api-test
    ports:
      - "8000:8000"
    env_file:
      - ./${name}-api/.env.test.local
    environment:
      ENVIRONMENT: test
      DATABASE_URL: postgresql://${dbUser}:${dbPassword}@host.docker.internal:5432/${testDbName}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  if (components.includes("admin-ui")) {
    const dependsOn = components.includes("api")
      ? `
    depends_on:
      - api`
      : "";
    services.push(`  admin-ui:
    build:
      context: ./${name}-admin-ui
      dockerfile: Dockerfile
    container_name: ${name}-admin-ui-test
    ports:
      - "3001:3001"
    env_file:
      - ./${name}-admin-ui/.env
    environment:
      API_BASE_URL: http://api:8000${dependsOn}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  if (components.includes("store")) {
    const dependsOn = components.includes("api")
      ? `
    depends_on:
      - api`
      : "";
    services.push(`  store:
    build:
      context: ./${name}-store
      dockerfile: Dockerfile
    container_name: ${name}-store-test
    ports:
      - "3002:3002"
    env_file:
      - ./${name}-store/.env
    environment:
      API_BASE_URL: http://api:8000${dependsOn}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  if (components.includes("status")) {
    const dependsOn = components.includes("api")
      ? `
    depends_on:
      - api`
      : "";
    services.push(`  status:
    build:
      context: ./${name}-status
      dockerfile: Dockerfile
    container_name: ${name}-status-test
    ports:
      - "8001:8001"
    env_file:
      - ./${name}-status/.env
    environment:
      API_URL: http://api:8000${dependsOn}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  // Dozzle -- Docker log viewer
  services.push(`  dozzle:
    image: amir20/dozzle:latest
    container_name: ${name}-dozzle-test
    ports:
      - "9999:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped`);

  services.push(`  # Opt-in: containerised PostgreSQL (use --profile db)
  postgres:
    image: postgres:16-alpine
    container_name: ${name}-postgres-test
    profiles: ["db"]
    environment:
      POSTGRES_DB: ${testDbName}
      POSTGRES_USER: ${dbUser}
      POSTGRES_PASSWORD: ${dbPassword}
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${dbUser} -d ${testDbName}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped`);

  return `# TStack Test Environment -- production-grade containers with test database
# Suitable for Playwright, integration tests, E2E testing.
# Same images as production, different env/database.
#
# To use containerised PostgreSQL: ./start-test.sh --with-db
#
# Ports:
#   API:        http://localhost:8000
#   Admin UI:   http://localhost:3001
#   Storefront: http://localhost:3002
#   Status:     http://localhost:8001
#   Dozzle:     http://localhost:9999  (Docker log viewer)

services:
${services.join("\n\n")}
`;
}

// ---------------------------------------------------------------------------
// docker-compose.yml  (production images + prod DB)
// ---------------------------------------------------------------------------

function generateProdCompose(opts: DockerGenOptions): string {
  const { workspaceName: name, components, dbUser, dbPassword } = opts;
  const prodDbName = `${name.replace(/-/g, "_")}_prod`;

  const services: string[] = [];

  if (components.includes("api")) {
    services.push(`  api:
    build:
      context: ./${name}-api
      dockerfile: Dockerfile
    container_name: ${name}-api-prod
    ports:
      - "8000:8000"
    env_file:
      - ./${name}-api/.env.production.local
    environment:
      ENVIRONMENT: production
      DATABASE_URL: postgresql://${dbUser}:${dbPassword}@host.docker.internal:5432/${prodDbName}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  if (components.includes("admin-ui")) {
    const dependsOn = components.includes("api")
      ? `
    depends_on:
      - api`
      : "";
    services.push(`  admin-ui:
    build:
      context: ./${name}-admin-ui
      dockerfile: Dockerfile
    container_name: ${name}-admin-ui-prod
    ports:
      - "3001:3001"
    env_file:
      - ./${name}-admin-ui/.env
    environment:
      API_BASE_URL: http://api:8000${dependsOn}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  if (components.includes("store")) {
    const dependsOn = components.includes("api")
      ? `
    depends_on:
      - api`
      : "";
    services.push(`  store:
    build:
      context: ./${name}-store
      dockerfile: Dockerfile
    container_name: ${name}-store-prod
    ports:
      - "3002:3002"
    env_file:
      - ./${name}-store/.env
    environment:
      API_BASE_URL: http://api:8000${dependsOn}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  if (components.includes("status")) {
    const dependsOn = components.includes("api")
      ? `
    depends_on:
      - api`
      : "";
    services.push(`  status:
    build:
      context: ./${name}-status
      dockerfile: Dockerfile
    container_name: ${name}-status-prod
    ports:
      - "8001:8001"
    env_file:
      - ./${name}-status/.env
    environment:
      API_URL: http://api:8000${dependsOn}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped`);
  }

  // Dozzle -- Docker log viewer
  services.push(`  dozzle:
    image: amir20/dozzle:latest
    container_name: ${name}-dozzle-prod
    ports:
      - "9999:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped`);

  services.push(`  # Opt-in: containerised PostgreSQL (use --profile db)
  postgres:
    image: postgres:16-alpine
    container_name: ${name}-postgres-prod
    profiles: ["db"]
    environment:
      POSTGRES_DB: ${prodDbName}
      POSTGRES_USER: ${dbUser}
      POSTGRES_PASSWORD: ${dbPassword}
    ports:
      - "5432:5432"
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${dbUser} -d ${prodDbName}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped`);

  return `# TStack Production Environment -- lightweight, no hot reload
# Same images used on the server.
#
# To use containerised PostgreSQL: ./start-prod.sh --with-db
#
# Ports:
#   API:        http://localhost:8000
#   Admin UI:   http://localhost:3001
#   Storefront: http://localhost:3002
#   Status:     http://localhost:8001
#   Dozzle:     http://localhost:9999  (Docker log viewer)

services:
${services.join("\n\n")}

volumes:
  postgres_prod_data:
`;
}

// ---------------------------------------------------------------------------
// Shell scripts
// ---------------------------------------------------------------------------

function generateStartDevSh(): string {
  return `#!/bin/bash
# TStack Dev Environment -- hot reload enabled
# Usage: ./start-dev.sh           (host PostgreSQL -- default)
#        ./start-dev.sh --with-db (containerised PostgreSQL)

set -e

PROFILE_FLAGS=""
if [[ "\$1" == "--with-db" ]]; then
  PROFILE_FLAGS="--profile db"
  echo "Starting with containerised PostgreSQL..."
else
  echo "Using host machine's PostgreSQL..."
  echo "  (pass --with-db to use a containerised PostgreSQL instead)"
fi

docker compose -f docker-compose.dev.yml \$PROFILE_FLAGS up --build
`;
}

function generateStartTestSh(): string {
  return `#!/bin/bash
# TStack Test Environment -- production-grade containers with test database
# Suitable for Playwright, integration tests, E2E testing.
# Usage: ./start-test.sh           (host PostgreSQL -- default)
#        ./start-test.sh --with-db (containerised PostgreSQL on port 5433)

set -e

PROFILE_FLAGS=""
if [[ "\$1" == "--with-db" ]]; then
  PROFILE_FLAGS="--profile db"
  echo "Starting with containerised PostgreSQL on port 5433..."
else
  echo "Using host machine's PostgreSQL..."
fi

docker compose -f docker-compose.test.yml \$PROFILE_FLAGS up --build
`;
}

function generateStartProdSh(): string {
  return `#!/bin/bash
# TStack Production Environment -- lightweight, no hot reload
# Usage: ./start-prod.sh           (host PostgreSQL -- default)
#        ./start-prod.sh --with-db (containerised PostgreSQL)

set -e

PROFILE_FLAGS=""
if [[ "\$1" == "--with-db" ]]; then
  PROFILE_FLAGS="--profile db"
  echo "Starting with containerised PostgreSQL..."
else
  echo "Using host machine's PostgreSQL..."
fi

docker compose \$PROFILE_FLAGS up --build
`;
}

function generateStopSh(): string {
  return `#!/bin/bash
# Stop all TStack Docker services (any mode)

set -e

echo "Stopping TStack services..."
docker compose -f docker-compose.dev.yml --profile db down 2>/dev/null || true
docker compose -f docker-compose.test.yml --profile db down 2>/dev/null || true
docker compose --profile db down 2>/dev/null || true
echo "All services stopped."
`;
}

// -----rkspace deno.json (non-Docker local dev with concurrently)
// ---------------------------------------------------------------------------

function generateWorkspaceDenoJson(
  name: string,
  components: ComponentType[],
): string {
  const labels: string[] = [];
  const colors: string[] = [];
  const cmds: string[] = [];
  const colorMap: Record<string, string> = {
    api: "cyan",
    "admin-ui": "yellow",
    store: "magenta",
    status: "green",
  };
  const taskNameMap: Record<string, string> = {
    api: "api",
    "admin-ui": "admin",
    store: "store",
    status: "status",
  };

  for (const c of components) {
    labels.push(taskNameMap[c]);
    colors.push(colorMap[c]);
    cmds.push(`\\"cd ${name}-${c} && deno task dev\\"`);
  }

  const labelStr = labels.join(",");
  const colorStr = colors.join(",");
  const cmdStr = cmds.join(" ");

  const tasks: Record<string, string> = {
    dev: `deno run -A npm:concurrently -n ${labelStr} -c ${colorStr} ${cmdStr}`,
    "dev:kill-others":
      `deno run -A npm:concurrently --kill-others -n ${labelStr} -c ${colorStr} ${cmdStr}`,
  };

  // Individual service tasks
  for (const c of components) {
    tasks[`dev:${taskNameMap[c]}`] = `cd ${name}-${c} && deno task dev`;
  }

  return JSON.stringify({ tasks }, null, 2) + "\n";
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function generateWorkspaceDocker(
  opts: DockerGenOptions,
): Promise<void> {
  const { workspacePath } = opts;

  const files: Array<{ name: string; content: string; executable?: boolean }> =
    [
      { name: "docker-compose.dev.yml", content: generateDevCompose(opts) },
      { name: "docker-compose.test.yml", content: generateTestCompose(opts) },
      { name: "docker-compose.yml", content: generateProdCompose(opts) },
      {
        name: "start-dev.sh",
        content: generateStartDevSh(),
        executable: true,
      },
      {
        name: "start-test.sh",
        content: generateStartTestSh(),
        executable: true,
      },
      {
        name: "start-prod.sh",
        content: generateStartProdSh(),
        executable: true,
      },
      { name: "stop.sh", content: generateStopSh(), executable: true },
      {
        name: "deno.json",
        content: generateWorkspaceDenoJson(
          opts.workspaceName,
          opts.components,
        ),
      },
    ];

  for (const file of files) {
    const filePath = join(workspacePath, file.name);
    await Deno.writeTextFile(filePath, file.content);
    if (file.executable) {
      await Deno.chmod(filePath, 0o755);
    }
  }

  Logger.newLine();
  Logger.success("Docker configuration generated:");
  Logger.code("  docker-compose.dev.yml   (hot-reload dev containers)");
  Logger.code("  docker-compose.test.yml  (production containers + test DB)");
  Logger.code("  docker-compose.yml       (production containers + prod DB)");
  Logger.code("  start-dev.sh             ./start-dev.sh [--with-db]");
  Logger.code("  start-test.sh            ./start-test.sh [--with-db]");
  Logger.code("  start-prod.sh            ./start-prod.sh [--with-db]");
  Logger.code("  stop.sh                  ./stop.sh");
  Logger.code("  deno.json                deno task dev (no Docker)");
}
