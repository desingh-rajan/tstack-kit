# How to Use TonyStack

> **Simple guide for junior developers to start new backend projects**

---

## Prerequisites

Make sure you have:

- **Deno** installed: `deno --version`
- **TonyStack CLI** installed: `tstack --version`

If not installed:

```bash
# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Install TonyStack CLI
cd /path/to/tonystack/packages/cli
deno task install
```

---

## Starting a New Project (2 Steps!)

### Step 1: Create Your Project

```bash
# Create a new project in current directory
tstack create my-backend

# Or create in a specific location
tstack create my-backend --dir ~/projects
```

That's it! The command copies the full starter template to your project folder.

### Step 2: Configure & Start

```bash
# Navigate to your project
cd my-backend

# Configure environment
cp .env.example .env
  nano .env  # Update settings if needed# Start development server
deno task dev
```

Your API is now running at **<http://localhost:8000>** 🎉

---

## What You Get

When you run `tstack create my-backend`, you get a complete backend with:

```
my-backend/
├── src/
│   ├── main.ts              # App entry point
│   ├── config/
│   │   ├── database.ts      # Database configuration
│   │   └── env.ts           # Environment variables
│   ├── entities/
│   │   └── (empty - scaffold your entities here)
│   └── shared/
│       ├── middleware/      # Error handling, logging
│       ├── types/          # TypeScript types
│       └── utils/          # Helper functions
├── tests/                  # Test structure
├── migrations/             # Database migrations
├── data/                   # SQLite database
├── deno.json              # Deno configuration
├── .env.example           # Environment template
├── docker-compose.yml     # Docker setup
├── Dockerfile
└── README.md
```

**You get:**

- ✅ JWT authentication (register, login)
- ✅ User management (CRUD operations)
- ✅ Role-based access control (user/admin)
- ✅ SQLite for development
- ✅ PostgreSQL ready for production
- ✅ Docker deployment configs
- ✅ Middleware (auth, errors, logging)
- ✅ Type-safe with TypeScript

---

## Daily Workflow

### 1. Test the Pre-Built Authentication

```bash
# Server is running on http://localhost:8000

# Register a user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# You get a JWT token back - use it for protected routes
```

### 2. Generate New Entities

```bash
# Generate a products entity
tstack scaffold products

# This creates 5 files:
# ✓ src/entities/products/product.model.ts
# ✓ src/entities/products/product.dto.ts
# ✓ src/entities/products/product.service.ts
# ✓ src/entities/products/product.controller.ts
# ✓ src/entities/products/product.route.ts
```

### 3. Register the Routes

Edit `src/main.ts`:

```typescript
import productRoutes from "./entities/products/product.route.ts";

// Add this line with other routes
app.route("/api", productRoutes);
```

### 4. Customize Your Model

Edit `src/entities/products/product.model.ts`:

```typescript
export const products = sqliteTable("products", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  price: int().notNull(), // Add your fields here
  stock: int().default(0), // Customize as needed
  category: text(),
  isActive: int({ mode: "boolean" }).default(true).notNull(),
  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});
```

### 5. Run Migrations

```bash
# Generate migration from your model changes
deno task migrate:generate

# Apply migrations to database
deno task migrate:run
```

### 6. Restart & Test

```bash
# Server auto-restarts with --watch flag
# Or manually restart:
deno task dev

# Test your new API
curl http://localhost:8000/api/products
```

---

## Common Tasks

### View Database

```bash
# Open Drizzle Studio (visual database browser)
deno task db:studio
```

Opens at: **<http://localhost:4983>**

### Run Tests

```bash
deno task test
```

### Format Code

```bash
deno task fmt
```

### Check for Errors

```bash
deno task lint
```

---

## Example: Building a Blog Backend

Let's build a simple blog API step-by-step:

### 1. Create Project

```bash
tstack create my-blog-api
cd my-blog-api
cp .env.example .env
```

### 2. Generate Entities

```bash
tstack scaffold posts
tstack scaffold comments
tstack scaffold categories
```

### 3. Register Routes

Edit `src/main.ts`:

```typescript
import postRoutes from "./entities/posts/post.route.ts";
import commentRoutes from "./entities/comments/comment.route.ts";
import categoryRoutes from "./entities/categories/category.route.ts";

app.route("/api", postRoutes);
app.route("/api", commentRoutes);
app.route("/api", categoryRoutes);
```

### 4. Customize Post Model

Edit `src/entities/posts/post.model.ts`:

```typescript
export const posts = sqliteTable("posts", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  content: text().notNull(),
  slug: text().notNull().unique(),
  authorId: int().notNull(),
  categoryId: int(),
  status: text().notNull().default("draft"), // draft, published
  publishedAt: int(),
  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});
```

### 5. Run Migrations

```bash
deno task migrate:generate
deno task migrate:run
```

### 6. Start Server

```bash
deno task dev
```

### 7. Test Your API

```bash
# Create a post
curl -X POST http://localhost:8000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "Hello world!",
    "slug": "my-first-post"
  }'

# Get all posts
curl http://localhost:8000/api/posts

# Get single post
curl http://localhost:8000/api/posts/1
```

Done! You have a working blog API. 🎉

---

## Environment Configuration

### Configuration Options in `.env`

```bash
# Environment
NODE_ENV=development

# Server
PORT=8000

# Database
# SQLite for development (default)
DATABASE_URL=./data/dev.db

# PostgreSQL for production (uncomment and configure)
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## Production Deployment

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose --profile prod up -d

# View logs
docker-compose logs -f
```

### Environment for Production

Create `.env.production`:

```bash
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://user:password@host:5432/dbname
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## Tips for Junior Developers

### ✅ DO

1. **Use meaningful entity names** (products, not items)
2. **Run migrations** after model changes
3. **Use Drizzle Studio** to view your data
4. **Commit often** with clear messages
5. **Read generated code** to understand the structure

### ❌ DON'T

1. **Don't commit `.env`** file (it's in `.gitignore`)
2. **Don't skip migrations** after changing models
3. **Don't use SQLite in production** for high-traffic apps
4. **Don't ignore TypeScript errors** - they save debugging time
5. **Don't generate entities with spaces** (use kebab-case: `blog-posts`)

---

## Getting Help

### Built-in Help

```bash
# Show all commands
tstack --help

# Show CLI version
tstack --version
```

### Common Issues

**"tstack: command not found"**

```bash
# Reinstall CLI
cd /path/to/tonystack/packages/cli
deno task install

# Check if ~/.deno/bin is in PATH
echo $PATH | grep .deno
```

**"Cannot find module"**

```bash
# Clear cache and reinstall
deno cache --reload src/main.ts
```

**"Database locked"**

```bash
# Stop all running servers
pkill -f "deno.*dev"

# Restart
deno task dev
```

**"Port 8000 already in use"**

```bash
# Change PORT in .env
echo "PORT=8001" >> .env

# Or kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

---

## Quick Reference

### TonyStack Commands

```bash
tstack create <project-name>    # Create new project
tstack scaffold <entity-name>   # Generate entity
tstack --help                   # Show help
tstack --version                # Show version
```

### Project Commands

```bash
deno task dev                   # Start dev server
deno task start                 # Start production server
deno task migrate:generate      # Generate migration
deno task migrate:run           # Run migrations
deno task db:studio             # Open database viewer
deno task test                  # Run tests
deno task fmt                   # Format code
deno task lint                  # Lint code
```

### API Endpoints

```
GET    /                        # API information
GET    /health                  # Health check
```

_Your scaffolded entities will add more endpoints here_

---

## Next Steps

1. ✅ **Created your project** with `tstack create`
2. ✅ **Started the server** with `deno task dev`
3. ✅ **Tested the API** with curl
4. 📝 **Generate your entities** with `tstack scaffold`
5. 🎨 **Customize models** to fit your needs
6. 🗄️ **Run migrations** to update database
7. 🧪 **Write tests** for your features
8. 🚀 **Deploy to production** with Docker

---

## Summary

**To start a new project:**

```bash
tstack create my-project
cd my-project
cp .env.example .env
nano .env  # Change JWT_SECRET
deno task dev
```

**To add features:**

```bash
tstack scaffold products
# Edit src/entities/products/product.model.ts
# Register routes in src/main.ts
deno task migrate:generate
deno task migrate:run
```

**That's it!** You now have a professional backend API ready for development.

---

<div align="center">

**You're ready to build! 🚀**

Questions? Check the other docs:

- [README.md](README.md) - Full overview
- [QUICKSTART.md](QUICKSTART.md) - 5-minute start
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Advanced guide

</div>
