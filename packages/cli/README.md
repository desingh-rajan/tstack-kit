# TStack CLI

> **The Operator for your TStack Ecosystem.**
>
> A purpose-built toolchain for managing the entire lifecycle of TStack
> applications: instantiation, scaffolding, workspace management, and teardown.

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/desingh-rajan/tstack-kit/main/install.sh | sh
```

> **Note:** `@tonystack/cli` is not yet published to JSR. The install script
> downloads the CLI directly from a tagged GitHub release and installs it via
> `deno install`.

**Verification:**

```bash
tstack --version
```

---

## Architecture: Workspaces

TStack operates on a **Workspace** model. A workspace is a logical grouping of
related services (API, Admin, Storefront) that share context and often a
monorepo structure.

### `tstack create workspace`

Initialize a new multi-service environment.

```bash
tstack create workspace <name> [flags]
```

**Flags:**

| Flag               | Description                                |
| :----------------- | :----------------------------------------- |
| `--with-api`       | Include API project (Default: true)        |
| `--with-admin-ui`  | Include Admin UI project (Default: true)   |
| `--with-store`     | Include Storefront project (Default: true) |
| `--skip-git`       | Skip Git initialization                    |
| `--namespace <ns>` | Set custom Kubernetes/Docker namespace     |

**Example:**

```bash
# Creates ./my-saas/ with api/, admin/, and store/ projects
tstack create workspace my-saas
```

---

## Project Management

For standalone services or adding to an existing workspace.

### `tstack create`

Instantiates a new standalone service.

```bash
tstack create <type> <name> [flags]
```

**Types:**

- **api**: Core Hono+Drizzle backend.
- **admin-ui**: Fresh+DaisyUI internal dashboard.
- **store**: Fresh+Tailwind public e-commerce UI.

**Common Flags:**

- `--dir <path>`: Target directory.
- `--latest`: Force fetch latest dependency versions from JSR/NPM (bypasses
  templates).

**API specific flags:**

- `--scope=<level>`: Set the domain scope of the generated API.
  - `core`: Base entities only (Articles, Site Settings).
  - `listing`: Core + Product Catalog (Brands, Categories, Products).
  - `commerce` (Default): Full E-commerce (Carts, Orders, Payments).
- `--skip-db-setup`: Skip initial database creation/migration.

### `tstack destroy`

**Destructive.** Removes a project and its specific PostgreSQL databases
(`_dev`, `_test`).

```bash
tstack destroy <type> <name>
```

**Examples:**

```bash
tstack destroy api my-backend
tstack destroy workspace my-saas
```

### `tstack list`

Displays the global registry of TStack projects tracked on your machine.

```bash
tstack list [--status <status>]
```

**Status filters:** `created`, `creating`, `destroyed`, `destroying`, `all`.

---

## Entity Scaffolding

Accelerate development by generating standardized architectural units.

### `tstack scaffold`

Generates the 7-file vertical slice for a new domain entity.

```bash
tstack scaffold <entity> [flags]
```

**Output:**

- `product.model.ts` (Drizzle Schema)
- `product.dto.ts` (Zod Validation)
- `product.service.ts` (Business Logic)
- `product.controller.ts` (HTTP Transport)
- `product.route.ts` (Public Routes)
- `product.admin.route.ts` (Admin Routes)
- `product.test.ts` (Integration Tests)

**Flags:**

| Flag              | Description                           |
| :---------------- | :------------------------------------ |
| `--skip-admin`    | Omit admin panel routes/handlers      |
| `--skip-tests`    | Omit integration tests                |
| `--skip-auth`     | Omit authentication middleware        |
| `--only-api`      | Generate ONLY API files (no Admin UI) |
| `--only-admin-ui` | Generate ONLY Admin UI files          |
| `--force`         | Overwrite existing files              |

---

## Lifecycle & Updates

### `tstack upgrade`

Update the CLI toolchain to the latest version.

```bash
tstack upgrade [version]
```

### `tstack versions`

List available versions from the registry.

### `tstack templates`

List available starter templates.

---

## Internals: Deno KV & Visualization

The CLI tracks all projects and workspaces using a local Deno KV database at
`~/.tstack/projects.db`.

To inspect or debug this data, we recommend the following tools:

### 1. Deno KV UI (Official)

The official web-based viewer by the Deno team.

```bash
deno run --unstable-kv --allow-read --allow-write --allow-net \
  jsr:@kitsonk/kview ~/.tstack/projects.db
```

### 2. KV Insight

A lightweight alternative web UI.

```bash
deno run --unstable-kv --allow-all \
  jsr:@mfbx9da4/kv-insight ~/.tstack/projects.db
```

### 3. Dump via CLI

Export data to JSON for backup or analysis.

```bash
deno run --unstable-kv --allow-read \
  https://deno.land/x/kvdump/mod.ts ~/.tstack/projects.db
```

---

## Configuration

The CLI persists global preference in `~/.tonystack/config.json`.

**Sudo Mode (Optional):** To allow database operations without repeated password
prompts:

```json
{
  "sudoPassword": "your-local-sudo-password"
}
```

_Security Note: This file is readable only by your user. Use with caution._
