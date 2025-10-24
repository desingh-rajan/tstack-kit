# TonyStack Quick Start Guide

## What You Have

TonyStack is a complete backend development toolkit with:

1. **Starter Package** (`packages/starter/`) - A fully functional REST API with:

- Clean MVC architecture
- SQLite (dev) / PostgreSQL (prod)
- Docker support
- Database migrations (Drizzle ORM)
- Type-safe with TypeScript

2. **️ CLI Tool** (`packages/cli/`) - Rails-like scaffolding:

- Generate complete entities with one command
- Smart pluralization and name transformations
- Generates: model, DTO, service, controller, routes
- Installed globally as `tstack` command

## Quick Start

### 1. Install Deno (if not already installed)

```bash
curl -fsSL https://deno.land/install.sh | sh
```

Add to PATH:

```bash
export PATH="/home/desingh/.deno/bin:$PATH"
```

### 2. Install TonyStack CLI Globally

```bash
cd packages/cli
deno task install
```

### 3. Start the Starter API

```bash
cd packages/starter
deno task dev
```

Server runs at: **<http://localhost:8000>**

### 4. Test the API

```bash
# Health check
curl http://localhost:8000/health

# API information
curl http://localhost:8000/
```

## Generate New Entities

### Using the CLI

```bash
# Navigate to your project
cd packages/starter

# Generate a products entity
tstack scaffold products

# Generate a blog-posts entity (handles kebab-case!)
tstack scaffold blog-posts

# Generate with custom directory
tstack scaffold orders --dir ./my-custom-project

# Force overwrite existing entity
tstack scaffold products --force
```

### What Gets Generated

For `tstack scaffold products`, you get:

```
src/entities/products/
├── product.model.ts # Drizzle database schema
├── product.dto.ts # Zod validation schemas
├── product.service.ts # Business logic (CRUD methods)
├── product.controller.ts # HTTP handlers
└── product.route.ts # Hono route definitions
```

### After Scaffolding

### 1. **Register routes in `src/main.ts`:**

```typescript
import productRoutes from "./entities/products/product.route.ts";
app.route("/api", productRoutes);
```

2. **Customize the model** (`product.model.ts`):

```typescript
export const products = sqliteTable("products", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  price: int().notNull(), // Add your fields
  stock: int().default(0),
  isActive: int({ mode: "boolean" }).default(true).notNull(),
  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});
```

3. **Generate and run migrations:**

```bash
deno task migrate:generate
deno task migrate:run
```

4. **Restart the server:**

```bash
deno task dev
```

## What's Working

### Completed Features

1. **CLI Tool**

- Entity scaffolding
- Smart name transformations (kebab-case, camelCase, PascalCase)
- Pluralization (products, categories, people)
- Template generation (all 5 files)
- Beautiful colored output
- Error handling
- Global installation

2. **Starter Kit**

- Clean MVC architecture
- Middleware (error handling, logging)
- Type-safe database layer (Drizzle)
- API response formatting
- Docker support
- Environment configuration

## Next Steps

```
tonystack/
├── packages/
│ ├── cli/ # The tstack CLI tool
│ │ ├── mod.ts # CLI entry point
│ │ ├── deno.json # CLI configuration
│ │ └── src/
│ │ ├── commands/ # scaffold command
│ │ ├── templates/ # Entity templates
│ │ └── utils/ # String utils, logger, file writer
│ │
│ └── starter/ # The backend starter kit
│ ├── src/
│ │ ├── main.ts # App entry point
│ │ ├── config/ # Database, env config
│ │ ├── shared/ # Middleware, utils, types
│ │ └── entities/ # Your domain entities
│ │ ├── users/ # Pre-built auth system
│ │ ├── products/ # Generated
│ │ ├── blogPosts/ # Generated
│ │ └── orders/ # Generated
│ ├── deno.json
│ ├── docker-compose.yml
│ └── Dockerfile
│
├── docs/
├── examples/
└── tony_toolkit_spec.md # Full specification
```

## Available Commands

### CLI Commands

```bash
tstack --help # Show help
tstack --version # Show version
tstack scaffold <entity> # Generate entity
```

### Starter Kit Commands

```bash
deno task dev # Start development server
deno task start # Start production server
deno task migrate:generate # Generate migration
deno task migrate:run # Run migrations
deno task db:studio # Open Drizzle Studio
deno task test # Run tests
deno task fmt # Format code
deno task lint # Lint code
```

## What's Working

### Completed Features

1. **CLI Tool**

- Entity scaffolding
- Smart name transformations (kebab-case, camelCase, PascalCase)
- Pluralization (products, categories, people)
- Template generation (all 5 files)
- Beautiful colored output
- Error handling
- Global installation

2. **Starter Kit**

- JWT authentication
- Password hashing (bcrypt)
- User CRUD operations
- Role-based access control
- Middleware (auth, error handling, logging)
- Type-safe database layer (Drizzle)
- API response formatting
- Docker support
- Environment configuration

## Next Steps

### Recommended Development Flow

1. **Design your data model** - Sketch out your entities
2. **Scaffold entities** - Use `tstack scaffold <entity-name>`
3. **Customize models** - Add fields, relationships
4. **Update DTOs** - Add validation rules
5. **Add business logic** - Implement in services
6. **Generate migrations** - `deno task migrate:generate`
7. **Run migrations** - `deno task migrate:run`
8. **Test API** - Use curl or Postman
9. **Deploy** - Docker or Deno Deploy

### Example: Building a Blog API

```bash
# 1. Generate entities
tstack scaffold posts
tstack scaffold comments
tstack scaffold categories
tstack scaffold tags

# 2. Customize the models (add relationships)
# Edit: src/entities/posts/post.model.ts
# Edit: src/entities/comments/comment.model.ts

# 3. Register routes in main.ts
# 4. Generate migrations
deno task migrate:generate

# 5. Run migrations
deno task migrate:run

# 6. Start the server
deno task dev
```

## Documentation

- **Spec**: See `tony_toolkit_spec.md` for full details
- **Starter README**: `packages/starter/README.md`
- **CLI README**: `packages/cli/README.md`

## Troubleshooting

### Deno not found

```bash
export PATH="/home/desingh/.deno/bin:$PATH"
# Add to ~/.bashrc or ~/.zshrc for persistence
```

### Import errors

```bash
cd packages/cli
deno cache mod.ts # Downloads all dependencies
```

### CLI not working globally

```bash
cd packages/cli
deno task install # Reinstalls with config
```

## 🎊 Success

You now have a fully functional backend development toolkit!

- Generate entities in seconds
- Type-safe from database to API
- Production-ready structure
- Rails-like developer experience

**Happy coding!**
