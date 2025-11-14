# TonyStack CLI

> Rails-like scaffolding for Deno backend development

The official CLI tool for **TonyStack** - generate complete MVC entities with a
single command.

## Features

- **Smart Scaffolding** - Generate complete entities with model, DTO, service,
  controller, and routes
- **Intelligent Naming** - Automatic pluralization and case conversion
- **Type-Safe Templates** - Pre-configured with TypeScript and Drizzle ORM
- **Fast** - Zero-dependency Deno native tool
- **Clean Architecture** - Follows MVC best practices

## Installation

### Global Installation (Recommended)

```bash
# Default: Install and prompt for permissions at runtime (safer)
deno install --allow-read --allow-write --allow-env --allow-run --allow-net -n tstack jsr:@tonystack/cli

# Skip prompts: Use --allow-all if you don't want to approve each time
deno install --allow-all --global -n tstack jsr:@tonystack/cli
```

**Default behavior:** CLI will ask for your approval (y/n/A) when it needs permissions like database creation.

**Skip prompts:** Use `--allow-all` during installation if you trust the CLI and don't want interruptions.

### Direct Usage (No Installation)

```bash
# Will prompt for permissions
deno run --allow-read --allow-write --allow-env --allow-run --allow-net jsr:@tonystack/cli scaffold products

# Or skip prompts with --allow-all
deno run --allow-all jsr:@tonystack/cli scaffold products
```

### Local Development

```bash
cd packages/cli
deno task install  # Uses default (prompts at runtime)
```

## Quick Start

### Create a New Project

```bash
tstack create my-backend
```

This creates a complete backend project with:

- Pre-configured Hono server
- Drizzle ORM setup
- PostgreSQL database configuration
- Environment files (.env, .env.example, etc.)
- Docker Compose configuration
- Migration setup

**With authentication:**

```bash
tstack create my-api --with-auth
```

**With latest stable dependencies:**

```bash
tstack create my-api --latest
```

**Combine both:**

```bash
tstack create my-api --with-auth --latest
```

### Generate a New Entity

```bash
tstack scaffold products
```

This creates:

```text
src/entities/products/         # Folder: snake_case (matches database table)
├── product.model.ts          # Files: kebab-case (singular form)
├── product.dto.ts            # Zod validation schemas + types
├── product.service.ts        # Business logic
├── product.controller.ts     # HTTP handlers
├── product.route.ts          # Routes: /products (kebab-case plural)
├── product.admin.route.ts    # Admin panel: /ts-admin/products (Rails-style)
└── product.test.ts           # API tests
```

**Admin API (Included by Default):**

Every scaffolded entity comes with a fully-functional admin JSON API at `/ts-admin/{entity}`:

- **RESTful JSON API** - Modern API-first architecture
- **Complete CRUD** - List, create, read, update, delete operations
- **Pagination, Search & Sort** - Out of the box
- **Role-Based Access** - Protected by `superadmin` and `admin` roles
- **Type-Safe Responses** - Full TypeScript support

### Examples

```bash
# Generate a simple entity (includes admin panel)
tstack scaffold users                    # Creates: entities/users/user.*.ts, routes: /users, admin: /ts-admin/users

# Generate entity with snake_case input
tstack scaffold blog_posts               # Creates: entities/blog_posts/blog-post.*.ts, routes: /blog-posts

# Generate with PascalCase input  
tstack scaffold BlogPost                 # Creates: entities/blog_posts/blog-post.*.ts, routes: /blog-posts

# Skip admin panel generation (Rails-style --skip-* flag)
tstack scaffold products --skip-admin    # Creates 6 files (no admin route)

# Force overwrite existing entity
tstack scaffold products --force

# Generate in a specific directory
tstack scaffold orders --dir ./my-project
```

## Commands

### `create <project-name>`

Create a new TonyStack project from the starter template.

**Options:**

- `--with-auth` - Include JWT authentication system with user management
- `--latest` - Fetch latest stable versions from JSR and npm registries (default: use proven template versions)
- `--dir <path>, -d` - Target directory (default: current directory)

**Examples:**

```bash
# Create basic project with stable dependencies
tstack create my-backend

# Create with authentication
tstack create my-api --with-auth

# Create with latest stable dependency versions
tstack create my-api --latest

# Create with both auth and latest versions
tstack create my-api --with-auth --latest

# Create in specific directory
tstack create my-backend --dir ~/projects
```

**Dependency Version Strategy:**

- **Default (stable)**: Uses proven dependency versions from the template. Fast and reliable.
- **`--latest` flag**: Fetches the newest stable versions from registries (JSR for Deno packages, npm for Node packages). Ensures you start with the most up-to-date dependencies.

The `--latest` flag will:

- Query JSR registry for `@std/dotenv`, `@hono/hono`
- Query npm registry for `jose`, `drizzle-orm`, `drizzle-kit`, `drizzle-zod`, `postgres`, `zod`
- Update `deno.json` with the fetched versions
- Gracefully fallback to template versions if network fails
- Cache versions for 1 hour to avoid rate limits

### `scaffold <entity-name>`

Generate a new entity with all MVC files and an admin panel.

**Options:**

- `--force, -f` - Overwrite existing files
- `--skip-admin` - Skip admin panel generation (Rails-style flag)
- `--dir <path>, -d` - Target directory (default: current directory)

**Examples:**

```bash
# Default: Generate with admin panel (7 files)
tstack scaffold products

# Skip admin panel (6 files)
tstack scaffold products --skip-admin

# Force overwrite with custom directory
tstack scaffold products --force --dir ./backend
```

**What Gets Generated:**

By default (7 files):

- `product.model.ts` - Drizzle ORM schema
- `product.dto.ts` - Zod validation
- `product.service.ts` - Business logic
- `product.controller.ts` - HTTP handlers
- `product.route.ts` - Public API routes
- `product.admin.route.ts` - Admin panel (NEW!)
- `product.test.ts` - API tests

With `--skip-admin` (6 files):

- Same as above, but without `product.admin.route.ts`

### `destroy <project-name>`

Remove a project and drop its databases.

**Options:**

- `--force, -f` - Skip confirmation prompt

**Safety:**

- Prompts for project name confirmation (unless `--force` is used)
- Shows what will be deleted before proceeding
- Searches in current directory and `~/projects`

**What Gets Removed:**

1. **Project Directory**: Complete project folder with all files
2. **Development Database**: `{project_name}_db` (converts hyphens to underscores)
3. **Test Database**: `{project_name}_test_db`

**Examples:**

```bash
# With confirmation prompt
tstack destroy my-api
# Type 'my-api' to confirm

# Skip confirmation (use with caution!)
tstack destroy old-project --force

# What gets deleted for 'blog-api':
#   - Directory: ./blog-api/ or ~/projects/blog-api/
#   - Dev DB: blog_api_db
#   - Test DB: blog_api_test_db
```

**Important Notes:**

- **Backup first**: This operation is irreversible
- **Stop Docker services**: Run `docker-compose down -v` before destroying
- **Database permissions**: May require PostgreSQL access (uses `sudo -u postgres psql`)
- **Not found error**: Shows searched locations if project doesn't exist

### `--help, -h`

Show help information.

```bash
tstack --help
```

### `--version, -v`

Show version number.

```bash
tstack --version
```

## What Gets Generated?

### 1. **Model** (`{entity}.model.ts`)

```typescript
// Drizzle schema with type inference
export const products = sqliteTable("products", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  // ...
});
```

### 2. **DTO** (`{entity}.dto.ts`)

```typescript
// Zod validation schemas
export const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
```

### 3. **Service** (`{entity}.service.ts`)

```typescript
// Business logic layer
export class ProductService {
  static async getAll() {/* ... */}
  static async getById(id: number) {/* ... */}
  static async create(data) {/* ... */}
  // ...
}
```

### 4. **Controller** (`{entity}.controller.ts`)

```typescript
// HTTP handlers
export class ProductController {
  static async getAll(c: Context) {/* ... */}
  static async create(c: Context) {/* ... */}
  // ...
}
```

### 5. **Routes** (`{entity}.route.ts`)

```typescript
// Route definitions - uses kebab-case paths (RESTful standard)
const productRoutes = new Hono();
productRoutes.get("/products", ProductController.getAll);
productRoutes.get("/products/:id", ProductController.getById);
productRoutes.post("/products", ProductController.create);
productRoutes.put("/products/:id", ProductController.update);
productRoutes.delete("/products/:id", ProductController.delete);

export default productRoutes;
```

### 6. Admin Panel Routes (`{entity}.admin.route.ts`)

```typescript
// Admin CRUD interface using @tstack/admin package
import { HonoAdminAdapter, DrizzleAdapter } from "@tstack/admin";

const ormAdapter = new DrizzleAdapter(products, { db, idColumn: "id" });

const productAdmin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "product",
  columns: ["id", "name", "description", "createdAt"],
  searchable: ["name", "description"],
  sortable: ["id", "name", "createdAt"],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: "/ts-admin/products",
});

// Automatically registers 9 routes:
// GET    /ts-admin/products          - List view (HTML/JSON)
// GET    /ts-admin/products/new      - Create form
// POST   /ts-admin/products          - Create action
// GET    /ts-admin/products/:id      - Show view
// GET    /ts-admin/products/:id/edit - Edit form
// PUT    /ts-admin/products/:id      - Update action
// PATCH  /ts-admin/products/:id      - Partial update
// DELETE /ts-admin/products/:id      - Delete action
// POST   /ts-admin/products/bulk-delete - Bulk delete
```

**Admin API Features:**

- ✅ **RESTful JSON API** - Modern API-first architecture
- ✅ **Pagination** - Configurable page size with metadata
- ✅ **Search** - Full-text search across specified columns
- ✅ **Sorting** - Sort by any configured column (ASC/DESC)
- ✅ **Role-Based Access** - Requires `superadmin` or `admin` role
- ✅ **Type-Safe Responses** - Full TypeScript support
- ✅ **Auto-Discovery** - Routes automatically registered from `*.admin.route.ts` files

**Skip Admin API:**

```bash
tstack scaffold products --skip-admin  # Generates only 6 files (no admin)
```

## Naming Conventions

The CLI automatically handles different naming conventions following backend best practices:

| Input          | Folder (snake_case) | Files (kebab-case)   | Routes (kebab-case) | Classes (PascalCase) | Variables (camelCase) | Table (snake_case) |
|----------------|---------------------|----------------------|---------------------|----------------------|-----------------------|--------------------|
| `user`         | `users/`            | `user.*.ts`          | `/users`            | `User`               | `user`, `users`       | `users`            |
| `blog_post`    | `blog_posts/`       | `blog-post.*.ts`     | `/blog-posts`       | `BlogPost`           | `blogPost`, `blogPosts` | `blog_posts`     |
| `BlogPost`     | `blog_posts/`       | `blog-post.*.ts`     | `/blog-posts`       | `BlogPost`           | `blogPost`, `blogPosts` | `blog_posts`     |
| `site_settings`| `site_settings/`    | `site-setting.*.ts`  | `/site-settings`    | `SiteSetting`        | `siteSetting`, `siteSettings` | `site_settings` |
| `product`      | `products/`         | `product.*.ts`       | `/products`         | `Product`            | `product`, `products` | `products`         |

**Why these conventions?**

- **Folders (snake_case)**: Matches database table naming convention
- **Files (kebab-case)**: Modern TypeScript/Deno convention (like Vite, Next.js)
- **Routes (kebab-case)**: RESTful API standard (e.g., `/user-profiles`, not `/userProfiles`)
- **Classes (PascalCase)**: TypeScript/JavaScript standard
- **Variables (camelCase)**: TypeScript/JavaScript standard
- **Tables (snake_case)**: SQL database standard

## Post-Scaffold Steps

After generating an entity, you need to:

### 1. Register Routes in `main.ts`

```typescript
import productRoutes from "./entities/products/product.route.ts";

app.route("/api", productRoutes);
```

### 2. Customize Generated Files

- **Model**: Add your custom fields and relations
- **DTO**: Update validation rules
- **Service**: Add custom business logic
- **Controller**: Modify response formats
- **Routes**: Add middleware (auth, validation)

### 3. Run Database Migrations

```bash
deno task migrate:generate
deno task migrate:run
```

### 4. Start Development Server

```bash
deno task dev
```

## Customizing Templates

You can customize the generated templates by modifying the files in:

```text
packages/cli/src/templates/
├── model.ts # Database schema template
├── dto.ts # DTO template
├── service.ts # Service template
├── controller.ts # Controller template
└── route.ts # Route template
```

## Advanced Usage

### Configuration File

TonyStack CLI uses a configuration file at `~/.tonystack/config.json` for user preferences.

**Create/Edit config:**

```bash
# File: ~/.tonystack/config.json
{
  "sudoPassword": "your-sudo-password",  // Avoid repeated password prompts
  "defaultDbUser": "postgres",           // Default database user
  "defaultDbPassword": "password"        // Default database password
}
```

**Benefits:**

- **No password prompts**: Set `sudoPassword` to automatically handle database creation/deletion
- **Faster workflows**: Skip manual password entry during `tstack create` and `tstack destroy`
- **Your machine, your choice**: Remove `sudoPassword` from config if you prefer manual prompts

**Security Note:**

- Config file is stored in your home directory (`~/.tonystack/`)
- Only you can read it (standard file permissions)
- Don't commit this file to git
- Only set this on your development machine

### Environment Variables

- `DEBUG=1` - Show detailed error messages

```bash
DEBUG=1 tstack scaffold products
```

### Integration with TonyStack Starter

The CLI is designed to work seamlessly with the TonyStack starter kit:

```bash
# Clone starter
git clone https://github.com/yourusername/tonystack-starter my-project
cd my-project

# Generate entities
tstack scaffold products
tstack scaffold orders
tstack scaffold customers

# Start development
deno task dev
```

## Testing

### For Contributors

**Quick Reference:**

| Mode | Command | Tests | Time | PostgreSQL | Use Case |
|------|---------|-------|------|------------|----------|
| **Fast (Default)** | `deno task test` | 118 | ~2s | ❌ Not needed | Quick dev, CI/CD |
| **Integration** | `deno task test:db` | 127 | ~12s | ✅ Required | Pre-release validation |

**What happens behind the scenes:**

- **Fast mode (`deno task test`)**:
  - Sets `TONYSTACK_TEST_DB` to undefined
  - Tests pass `skipDbSetup: true` to commands
  - Commands skip all `sudo -u postgres psql` operations
  - 9 DB integration tests are ignored
  - Perfect for TDD and CI pipelines

- **Integration mode (`deno task test:db`)**:
  - Sets `TONYSTACK_TEST_DB=true`
  - Tests pass `skipDbSetup: false` to commands
  - Commands create/drop real PostgreSQL databases
  - All databases use `tstack_test_` prefix for safety
  - Tests actual `CREATE DATABASE` and `DROP DATABASE` SQL
  - Verifies production-like workflows

**Before submitting a PR:**

1. ✅ Run `deno task test` (should always pass)
2. ✅ Run `deno task test:db` (if you have PostgreSQL)
3. ✅ All 127 tests should pass

### Running Tests

```bash
# Run all tests (DB integration tests disabled by default for fast runs)
deno task test

# Run with DATABASE INTEGRATION tests enabled (requires PostgreSQL + sudo config)
deno task test:db

# Watch mode (fast tests only)
deno task test:watch

# Clean up test databases (drops all tstack_test_* databases)
deno task cleanup:test-dbs
```

### Database Integration Tests

By default, tests **skip database operations** for fast execution and to avoid requiring PostgreSQL setup in CI/CD.

**To enable full database integration tests:**

1. Ensure PostgreSQL is running locally
2. Configure sudo password in `~/.tonystack/config.json`:

   ```json
   {
     "sudoPassword": "your-password"
   }
   ```

3. Run with the database integration flag:

   ```bash
   deno task test:db
   ```

This will test:

- Actual database creation/deletion
- PostgreSQL connection validation
- Database naming conventions
- Production-like workflows

**Test Database Safety:**

All integration tests use the `tstack_test_` prefix for database names to avoid accidentally affecting your development databases. The test suite automatically cleans up after itself, but you can manually clean up with:

```bash
deno task cleanup:test-dbs
```

## Documentation

- [TonyStack Documentation](https://github.com/yourusername/tonystack)
- [Starter Kit](https://github.com/yourusername/tonystack/tree/main/packages/starter)
- [Examples](https://github.com/yourusername/tonystack/tree/main/examples)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## ‍♂️ Support

- Email: <support@tonystack.dev>
- GitHub Issues:
  [Create an issue](https://github.com/yourusername/tonystack/issues)
- Discord: [Join our community](https://discord.gg/tonystack)

---

Made with ️ for the Deno community

> TonyStack CLI - Because scaffolding should be this easy.
