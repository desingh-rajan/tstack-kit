# TonyStack

> **Rails-like DX for Deno developers who want less framework, more control.**

A lightweight, opinionated toolkit for building fast, type-safe backend services
using **Deno**, **Hono**, **Drizzle**, and **PostgreSQL**.

---

## What's Included

### 1. **Starter Package** (`packages/starter/`)

Production-ready backend template with:

- MVC architecture
- PostgreSQL database (no SQLite)
- Docker & docker-compose ready
- Drizzle ORM with migrations
- Comprehensive error handling
- Security middleware (CORS, auth)
- Full TypeScript support
- Health checks & monitoring

### 2. **CLI Tool** (`packages/cli/`)

Rails-like scaffolding generator:

```bash
tstack scaffold products
# Generates: model, dto, service, controller, route
```

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/desingh-rajan/tstack-kit.git
cd tstack-kit

# Install CLI globally
cd packages/cli
deno task install

# Verify installation
tstack --version
```

### Create Your First Project

```bash
# Create new project
tstack create my-blog-api
cd my-blog-api

# Setup environment
cp .env.example .env

# Start PostgreSQL (if using Docker)
docker compose up -d

# Start development server
deno task dev

# Generate entities
tstack scaffold posts
tstack scaffold comments
```

**Server runs at:** <http://localhost:8000>

---

## Features

### 🗄️ Database

- **PostgreSQL** - Production-ready relational database
- Drizzle ORM with full type safety
- Automatic migrations with `drizzle-kit`
- Type inference from schema

### 🏗️ Architecture

- **MVC Pattern** - Model, Service, Controller separation
- **Domain-Driven** - Entities organized by feature
- **Type-Safe** - Full TypeScript with inference
- **Testable** - Services isolated from HTTP layer

### ⚡️ Developer Experience

- **Scaffolding CLI** - Generate entities in seconds
- **Hot Reload** - Fast development with `--watch`
- **Drizzle Studio** - Visual database browser
- **Docker Ready** - PostgreSQL included

### 🛡️ Production Ready

- Comprehensive error handling
- Request logging middleware
- CORS configuration
- Environment variable management
- Health check endpoint

---

## Project Structure

```text
tstack-kit/
├── packages/
│   ├── cli/                    # Scaffolding tool
│   │   ├── mod.ts              # CLI entry point
│   │   └── src/
│   │       ├── commands/       # create, scaffold commands
│   │       ├── templates/      # Code generators
│   │       └── utils/          # String utils, file writer
│   └── starter/                # Backend template
│       ├── src/
│       │   ├── config/         # Database, env config
│       │   ├── entities/       # Domain entities (scaffold here)
│       │   ├── shared/         # Middleware, utils
│       │   └── main.ts         # App entry point
│       ├── migrations/         # Drizzle migrations
│       ├── tests/              # Test structure
│       ├── docker-compose.yml  # PostgreSQL service
│       ├── drizzle.config.ts   # ORM configuration
│       └── deno.json           # Tasks & dependencies
└── README.md                   # You are here
```

---

## Example: Scaffolding an Entity

```bash
# Generate a products entity
tstack scaffold products

# Creates 5 files:
# ✓ src/entities/products/product.model.ts (Drizzle schema - minimal)
# ✓ src/entities/products/product.dto.ts (Validation)
# ✓ src/entities/products/product.service.ts (Business logic)
# ✓ src/entities/products/product.controller.ts (HTTP handlers)
# ✓ src/entities/products/product.route.ts (Routes)
```

Add your fields to `product.model.ts`:

```typescript
export const products = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  price: real().notNull(),
  description: text(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

Generate and run migrations:

```bash
deno task migrate:generate
deno task migrate:run
```

Register routes in `main.ts`:

```typescript
import productRoutes from "./entities/products/product.route.ts";
app.route("/api", productRoutes);
```

**Instant API:**

```text
GET /api/products → List products
POST /api/products → Create product
GET /api/products/:id → Get product
PUT /api/products/:id → Update product
DELETE /api/products/:id → Delete product
```

---

## Why TonyStack?

### Compared to Existing Solutions

| Feature              | TonyStack           | Oak       | Express (Node) | NestJS (Deno) |
| -------------------- | ------------------- | --------- | -------------- | ------------- |
| **Runtime**          | Deno                | Deno      | Node.js        | Deno          |
| **Framework Weight** | Lightweight         | Medium    | Light          | Heavy         |
| **Type Safety**      | Full                | Partial   | Minimal        | Full          |
| **Scaffolding**      | Built-in            | ❌ Manual | ❌ Manual      | ✅ Via CLI    |
| **ORM**              | Drizzle (type-safe) | Manual    | Prisma/TypeORM | TypeORM       |
| **Learning Curve**   | Low                 | Medium    | Low            | High          |
| **Production Ready** | ✅                  | ✅        | ✅             | ✅            |

### Perfect For

- **MVPs and prototypes**
- **Backend APIs for SPAs**
- **Microservices**
- **Internal tools**
- **Freelance projects**
- **Small to medium-scale apps**

### Not Ideal For

- Real-time WebSocket apps (not yet supported)
- GraphQL-first projects (REST-focused)
- Apps requiring complex authentication flows (bring your own)

---

## CLI Commands

```bash
# Create new project
tstack create my-api          # Create from starter template

# Scaffold entities
tstack scaffold products      # Generate entity
tstack scaffold blog-posts    # Supports kebab-case
tstack scaffold users --force # Overwrite existing

# Options
--help, -h                    # Show help
--version, -v                 # Show version
--force, -f                   # Overwrite files
--dir <path>                  # Target directory
```

---

## Docker Deployment

### Local Development (Database Only)

```bash
# Start PostgreSQL only
docker compose up postgres -d

# Use local Deno for development
deno task dev

# Stop database
docker compose down

# Reset database (removes data)
docker compose down -v
```

### Full Stack (App + Database)

```bash
# Copy environment template
cp .env.docker .env
# Edit .env with your values

# Start everything (app + postgres)
docker compose up --build -d

# Run migrations
docker compose exec app deno task migrate:run

# Seed database
docker compose exec app deno task db:seed

# View logs
docker compose logs -f app

# Stop everything
docker compose down
```

### Production Deployment

#### Option 1: Docker Compose (Recommended)

```bash
# Use production environment
export ENVIRONMENT=production

# Set secure credentials in .env
JWT_SECRET=your-secure-secret-key-at-least-32-characters
POSTGRES_PASSWORD=secure-password

# Deploy
docker compose up --build -d

# Run migrations
docker compose exec app deno task migrate:run

# Seed initial data
docker compose exec app deno task db:seed
```

#### Option 2: Separate Database

Build and run with external PostgreSQL:

```bash
# Build image
docker build -t tonystack-api .

# Run with external database
docker run -d \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e DATABASE_URL="postgresql://user:pass@db.example.com:5432/mydb" \
  -e JWT_SECRET="your-secure-secret-key" \
  -e PORT=8000 \
  --name tonystack-app \
  tonystack-api
```

**Environment Variables:**

- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - Secret key for JWT tokens (required)
- `JWT_EXPIRES_IN` - Token expiry (default: 7d)
- `ENVIRONMENT` - Environment (development/test/production)
- `PORT` - Server port (default: 8000)

---

## Testing

### Quick Start

```bash
# Complete test setup + run (recommended)
deno task test:full

# Just run tests (after setup)
deno task test

# Watch mode for development
deno task test:watch
```

### Available Test Commands

| Command                   | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `deno task test:full`     | Complete workflow: setup DB + migrations + seeds + tests |
| `deno task test`          | Run tests only                                           |
| `deno task test:setup`    | Setup test database and migrations                       |
| `deno task test:reset`    | Clean reset (database + migrations + seeds)              |
| `deno task test:watch`    | Run tests in watch mode                                  |
| `deno task test:coverage` | Run tests with coverage report                           |

### What Gets Tested

- **Authentication**: 19 test scenarios (register, login, JWT, admin operations)
- **Articles**: 16 test scenarios (CRUD, authorization, ownership)
- **Database**: Connection, migrations, seeds
- **API**: All endpoints with proper HTTP status codes

**Test Users (auto-seeded):**

- `superadmin@tstack.in` / `TonyStack@2025!`
- `alpha@tstack.in` / `Alpha@2025!`

📖 **[Full Testing Guide →](TESTING.md)**

---

## 🗺️ Roadmap

### ✅ Phase 1: Core (Completed)

- [x] CLI scaffolding tool (`create`, `scaffold`)
- [x] Starter template with MVC architecture
- [x] PostgreSQL support with Drizzle
- [x] Docker configs
- [x] Minimal, focused documentation

### 🚧 Phase 2: Enhancement (Next)

- [ ] **Rails-like column definitions**:
      `tstack scaffold posts title:text content:text published:boolean`
- [ ] Auto-migration generation from scaffold
- [ ] Testing utilities and examples
- [ ] File upload utilities
- [ ] Rate limiting middleware
- [ ] Caching layer (Redis)
- [ ] Relationship scaffolding: `tstack scaffold comments post_id:references`

### 🔮 Phase 3: Advanced

- [ ] Authentication plugin (optional, bring-your-own)
- [ ] WebSocket support
- [ ] Job queue system
- [ ] OpenAPI/Swagger docs generator
- [ ] GraphQL support (optional)

### 🌍 Phase 4: Community

- [ ] Publish to JSR (`@tstack/cli`, `@tstack/core`)
- [ ] Example projects (blog, e-commerce, etc.)
- [ ] Video tutorials
- [ ] Community templates
- [ ] Plugin system

---

## Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing`
5. **Open** a Pull Request

### Development Setup

```bash
git clone https://github.com/desingh-rajan/tstack-kit.git
cd tstack-kit

# Test CLI
cd packages/cli
deno task dev scaffold test-entity

# Test starter
cd packages/starter
deno task dev
```

---

## License

This project is licensed under the **MIT License** - see the
[LICENSE](../../LICENSE) file for details.

---

## Support & Community

- **Issues:**
  [GitHub Issues](https://github.com/desingh-rajan/tstack-kit/issues)
- **Discussions:**
  [GitHub Discussions](https://github.com/desingh-rajan/tstack-kit/discussions)

---

## Acknowledgments

Built with amazing open-source projects:

- [Deno](https://deno.land) - Modern JavaScript/TypeScript runtime
- [Hono](https://hono.dev) - Ultrafast web framework
- [Drizzle](https://orm.drizzle.team) - Type-safe ORM
- [Deno Standard Library](https://jsr.io/@std) - Official Deno modules

---

## Stats

- **Lines of Code:** ~2,000 (simplified, focused)
- **Dependencies:** 6 core packages
- **Time to First API:** ~5 minutes

---

## Built With

- [Deno](https://deno.land) - Modern JavaScript/TypeScript runtime
- [Hono](https://hono.dev) - Ultrafast web framework
- [Drizzle](https://orm.drizzle.team) - Type-safe ORM
- [PostgreSQL](https://postgresql.org) - Production database
- [Zod](https://zod.dev) - TypeScript-first schema validation

---

⭐ **Star this repo if you find it helpful!** ⭐

[Issues](https://github.com/desingh-rajan/tstack-kit/issues) •
[License](../../LICENSE)
