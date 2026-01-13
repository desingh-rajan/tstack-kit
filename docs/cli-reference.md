# CLI Reference

## Workspace Commands

### Create Workspace

```bash
tstack create workspace <name> [options]
```

Creates a full workspace with API + Admin UI projects.

**Options:**

| Option               | Description                                    |
| -------------------- | ---------------------------------------------- |
| `--github-org=<org>` | Create GitHub repos in specified org           |
| `--skip-git`         | Skip git initialization                        |
| `--scope=<level>`    | Entity scope: `core`, `listing`, or `commerce` |
| `--skip-listing`     | Skip product listing entities (legacy)         |
| `--skip-commerce`    | Skip e-commerce entities (legacy)              |
| `--skip-db-setup`    | Skip database creation                         |

**Entity Scopes:**

- `core` - Articles, site_settings, and enquiries only
- `listing` - Core + brands, categories, products, variants
- `commerce` - Listing + addresses, carts, orders, payments (default)

**Example:**

```bash
tstack create workspace my-shop --github-org=mycompany
```

- `my-shop-api/` - Backend API
- `my-shop-admin-ui/` - Admin dashboard
- `my-shop-store/` - Public Storefront
- 3 databases (dev/test/prod)

### Create API Only

```bash
tstack create api <name> [options]
```

Creates just the API project without Admin UI.

**Options:**

| Option            | Description                                    |
| ----------------- | ---------------------------------------------- |
| `--skip-git`      | Skip git initialization                        |
| `--scope=<level>` | Entity scope: `core`, `listing`, or `commerce` |
| `--skip-listing`  | Skip product listing entities (legacy)         |
| `--skip-commerce` | Skip e-commerce entities (legacy)              |
| `--skip-db-setup` | Skip database creation                         |

### Destroy Workspace

```bash
tstack destroy workspace <name> [options]
```

**Options:**

| Option            | Description              |
| ----------------- | ------------------------ |
| `--delete-remote` | Also delete GitHub repos |

### Destroy Project

```bash
tstack destroy <name>
```

Removes a single project and its databases.

## Scaffolding Commands

### Scaffold Entity

```bash
tstack scaffold <entity-name>
```

Generates 8 files for a new entity:

| File                      | Purpose            |
| ------------------------- | ------------------ |
| `<entity>.model.ts`       | Drizzle schema     |
| `<entity>.dto.ts`         | Zod validation     |
| `<entity>.service.ts`     | Business logic     |
| `<entity>.controller.ts`  | HTTP handlers      |
| `<entity>.route.ts`       | Public API routes  |
| `<entity>.admin.route.ts` | Admin panel routes |
| `<entity>.test.ts`        | API tests          |
| `<entity>.admin.test.ts`  | Admin tests        |

**Example:**

```bash
tstack scaffold products
```

## Info Commands

### List Projects

```bash
tstack list
```

Shows all tracked projects with their paths and databases.

### Version

```bash
tstack --version
```

### Help

```bash
tstack --help
```

---

## Design Philosophy: Why the CLI Works This Way

### Project Tracking with Deno KV

TStack uses Deno KV (a built-in key-value database) to track all projects and
workspaces you create. This is stored locally at `~/.tstack/projects.db`.

**Why track projects?**

Without tracking, `tstack destroy my-api` would need to scan your entire
filesystem to find the project. With tracking, we know exactly where every
project lives, what databases it uses, and whether it has GitHub repos.

**What gets tracked:**

```typescript
// Project entry
{
  name: "my-api",
  path: "/home/user/projects/my-api",
  databases: {
    dev: "my_api_dev",
    test: "my_api_test",
    prod: "my_api_prod"
  },
  status: "created",
  createdAt: "2025-11-23T10:30:00Z"
}

// Workspace entry
{
  name: "my-saas",
  projects: [
    { name: "my-saas-api", type: "api", ... },
    { name: "my-saas-admin-ui", type: "admin-ui", ... }
  ],
  githubRepos: [
    { name: "my-saas-api", url: "https://github.com/..." }
  ],
  githubOrg: "mycompany"
}
```

This enables powerful operations:

- Destroy any project from any directory
- List all tracked projects with `tstack list`
- Clean up GitHub repos with `--delete-remote`
- Resume failed operations (status tracking)

### The --latest Flag Strategy

When you run `tstack create my-api`, dependencies use proven template versions.
When you add `--latest`, we query JSR and npm registries for newest stable
versions.

**Why not always use latest?**

1. **Stability** - Template versions are tested together. Random latest versions
   might have breaking changes or incompatibilities.

2. **Speed** - Registry queries add 2-5 seconds. Most developers want fast
   project creation.

3. **Offline support** - Template versions work without internet. Latest
   requires registry access.

4. **Reproducibility** - Same template version creates identical projects.
   Latest can vary day to day.

Use `--latest` when starting a new project you plan to maintain long-term. Use
template versions for quick prototypes or when working offline.

### Naming Convention Decisions

The scaffold command converts input names intelligently:

| Input       | Folder       | Files          | Routes        | Table        |
| ----------- | ------------ | -------------- | ------------- | ------------ |
| `BlogPost`  | `blog_posts` | `blog-post.ts` | `/blog-posts` | `blog_posts` |
| `blog_post` | `blog_posts` | `blog-post.ts` | `/blog-posts` | `blog_posts` |
| `blogPost`  | `blog_posts` | `blog-post.ts` | `/blog-posts` | `blog_posts` |

**Why these specific conventions?**

- **Folders (snake_case)**: Matches PostgreSQL table naming. Your folder
  structure mirrors your database structure.

- **Files (kebab-case)**: Modern TypeScript convention. Vite, Next.js, and Deno
  itself use kebab-case filenames.

- **Routes (kebab-case)**: REST API standard. URLs should be lowercase with
  hyphens, not underscores or camelCase.

- **Tables (snake_case)**: SQL convention. PostgreSQL lowercases unquoted
  identifiers anyway.

These are not arbitrary choices. Each matches the dominant convention for that
context.

### The --skip-admin Flag (Rails Style)

Rails introduced `--skip-*` flags for scaffold commands, and the pattern works
well:

```bash
tstack scaffold products              # Full entity with admin panel
tstack scaffold products --skip-admin # No admin routes/tests
```

### The --skip-listing Flag

By default, workspaces include product listing entities (brands, categories,
products, variants). Use `--skip-listing` for non-e-commerce projects:

```bash
tstack create workspace my-blog --skip-listing  # No product entities
tstack create workspace my-shop                 # Includes product entities
```

**Included product listing entities:**

| Entity           | Description                         |
| ---------------- | ----------------------------------- |
| brands           | Product brands with logo support    |
| categories       | Hierarchical product categories     |
| products         | Main product entity with SEO fields |
| product_images   | Product image gallery               |
| product_variants | SKU variants (size, color, etc.)    |
| variant_options  | Available variant option values     |

**When to skip admin:**

- Internal entities not managed through admin UI (audit logs, system events)
- Entities managed through custom workflows (shopping carts, sessions)
- Simple lookup tables that rarely change

**When to keep admin:**

- Content entities (articles, products, categories)
- User-manageable settings
- Any entity admins need to CRUD regularly

Default is admin included because most entities benefit from admin management.

### Database Lifecycle Management

The destroy command handles complete cleanup:

```text
tstack destroy my-api
  |
  +-> Look up project in KV store
  +-> Confirm with user (unless --force)
  +-> Delete project directory
  +-> Drop development database
  +-> Drop test database  
  +-> Drop production database
  +-> Remove from KV store
```

**Why drop all three databases?**

Partial cleanup causes confusion. Orphaned databases waste disk space and create
naming conflicts for future projects. Clean destruction means clean slate.

**The --force flag:**

Required for scripting and CI/CD. Interactive confirmation is good for humans
but breaks automation. Use `--force` when you know what you are deleting.

### GitHub Integration Design

The `--github-org` flag creates remote repositories during workspace creation:

```bash
tstack create workspace my-saas --github-org=mycompany
```

This creates:

- `mycompany/my-saas-api` repo with initial commit
- `mycompany/my-saas-admin-ui` repo with initial commit
- Git remotes configured in local projects
- Repo URLs tracked in KV store for later cleanup

**Why not create repos by default?**

1. Requires GitHub authentication (not everyone wants this)
2. May conflict with existing repo names
3. Some developers prefer manual repo setup
4. Local-only development is valid use case

**The --delete-remote flag:**

When destroying a workspace, `--delete-remote` also deletes GitHub repos. This
requires the GitHub CLI (`gh`) to be authenticated. We check for auth and
provide clear error messages if missing.

### Error Handling Philosophy

The CLI provides structured, actionable error messages:

```text
[error] Database creation failed

Cause: FATAL: role "postgres" does not exist

Fix: Ensure PostgreSQL is running and the postgres user exists.
     Try: sudo -u postgres createuser -s postgres

Location: ./my-api
```

Every error includes:

- **What failed** - Clear description of the operation
- **Why it failed** - Actual error from underlying system
- **How to fix it** - Actionable steps to resolve
- **Context** - Where the failure occurred

This is more work to implement but saves hours of debugging for users.

Next: [Entity Scaffolding](./entity-scaffolding.md)
