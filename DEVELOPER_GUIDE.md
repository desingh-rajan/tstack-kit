# TonyStack Developer Guide

## Building a Production Backend for Clients

This guide walks you through building a complete backend service for a client
using TonyStack.

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Initial Configuration](#2-initial-configuration)
3. [Design Your Data Model](#3-design-your-data-model)
4. [Generate Entities](#4-generate-entities)
5. [Customize & Implement](#5-customize--implement)
6. [Testing](#6-testing)
7. [Deployment](#7-deployment)
8. [Maintenance](#8-maintenance)

---

## 1. Project Setup

### Clone the Starter Template

```bash
# Create new project from starter
cd ~/projects
cp -r tonystack/packages/starter my-client-backend
cd my-client-backend

# Initialize git
git init
git add .
git commit -m "Initial commit: TonyStack starter"
```

### Install Dependencies

```bash
# Ensure Deno is installed
deno --version

# Ensure TonyStack CLI is installed globally
tstack --version

# Cache all dependencies
deno cache src/main.ts
```

---

## 2. Initial Configuration

### Environment Setup

```bash
# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=8000
DATABASE_URL=./data/dev.db

# Security - Generate strong secrets for production
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional
LOG_LEVEL=info
EOF

# Add .env to .gitignore
echo ".env" >> .gitignore
echo "data/" >> .gitignore
```

### Update README

```bash
# Update project name and description
sed -i 's/TonyStack Backend Starter/[Client Name] Backend API/' README.md
```

---

## 3. Design Your Data Model

### Example: E-commerce Platform

Let's say you're building an e-commerce backend. Here's a typical data model:

```
Entities:
├── users (pre-built) 
├── products
├── categories 
├── orders
├── orderItems
├── reviews
└── addresses
```

### Create Entity Diagram

```
┌─────────┐ ┌────────────┐ ┌─────────┐
│ Users │────────▶│ Orders │────────▶│ Products│
└─────────┘ └────────────┘ └─────────┘
 │
 ▼
 ┌─────────────┐
 │ Order Items │
 └─────────────┘
```

### Document Requirements

Create a `docs/data-model.md`:

```markdown
# Data Model

## Products

- id, name, description, price, stock, categoryId
- Relations: belongsTo(Category), hasMany(Reviews)

## Categories

- id, name, description, slug
- Relations: hasMany(Products)

## Orders

- id, userId, total, status, shippingAddress
- Relations: belongsTo(User), hasMany(OrderItems)

## OrderItems

- id, orderId, productId, quantity, price
- Relations: belongsTo(Order), belongsTo(Product)
```

---

## 4. Generate Entities

### Scaffold All Entities

```bash
# Navigate to project root
cd ~/projects/my-client-backend

# Generate each entity
tstack scaffold products
tstack scaffold categories
tstack scaffold orders
tstack scaffold order-items
tstack scaffold reviews
tstack scaffold addresses

# Verify generated files
ls -la src/entities/
```

### Register Routes in main.ts

```typescript
// src/main.ts
import productRoutes from "./entities/products/product.route.ts";
import categoryRoutes from "./entities/categories/category.route.ts";
import orderRoutes from "./entities/orders/order.route.ts";
import orderItemRoutes from "./entities/orderItems/orderItem.route.ts";
import reviewRoutes from "./entities/reviews/review.route.ts";
import addressRoutes from "./entities/addresses/address.route.ts";

// Register routes
app.route("/api", productRoutes);
app.route("/api", categoryRoutes);
app.route("/api", orderRoutes);
app.route("/api", orderItemRoutes);
app.route("/api", reviewRoutes);
app.route("/api", addressRoutes);
```

---

## 5. Customize & Implement

### Step 5.1: Update Models

**Example: `product.model.ts`**

```typescript
export const products = sqliteTable("products", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text(),
  price: int().notNull(), // Store in cents
  stock: int().default(0).notNull(),
  categoryId: int().references(() => categories.id),
  imageUrl: text(),
  sku: text().unique(),
  isActive: int({ mode: "boolean" }).default(true).notNull(),
  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});
```

**Example: `order.model.ts`**

```typescript
export const orders = sqliteTable("orders", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => users.id),
  total: int().notNull(), // Store in cents
  status: text().notNull().default("pending"), // pending, processing, shipped, delivered, cancelled
  shippingAddress: text().notNull(),
  paymentMethod: text(),
  paymentStatus: text().default("unpaid"), // unpaid, paid, refunded
  isActive: int({ mode: "boolean" }).default(true).notNull(),
  createdAt: int().notNull(),
  updatedAt: int().notNull(),
});
```

### Step 5.2: Update DTOs with Validation

**Example: `product.dto.ts`**

```typescript
export const CreateProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  price: z.number().int().positive("Price must be positive"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  categoryId: z.number().int().positive(),
  imageUrl: z.string().url().optional(),
  sku: z.string().min(1).max(50).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();
```

### Step 5.3: Add Business Logic to Services

**Example: `product.service.ts`**

```typescript
export class ProductService {
  // ... existing CRUD methods ...

  // Custom business logic
  static async getByCategory(categoryId: number) {
    return await db
      .select()
      .from(products)
      .where(and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true),
      ));
  }

  static async decreaseStock(productId: number, quantity: number) {
    const product = await this.getById(productId);
    if (!product || product.stock < quantity) {
      throw new Error("Insufficient stock");
    }

    return await db
      .update(products)
      .set({
        stock: product.stock - quantity,
        updatedAt: Date.now(),
      })
      .where(eq(products.id, productId))
      .returning();
  }

  static async search(query: string) {
    return await db
      .select()
      .from(products)
      .where(like(products.name, `%${query}%`));
  }
}
```

### Step 5.4: Add Authentication to Routes

**Example: `product.route.ts`**

```typescript
import { requireAuth, requireRole } from "../../shared/middleware/auth.ts";

// Public routes
productRoutes.get("/products", ProductController.getAll);
productRoutes.get("/products/:id", ProductController.getById);

// Protected routes (admin only)
productRoutes.post(
  "/products",
  requireAuth,
  requireRole(["admin"]),
  ProductController.create,
);
productRoutes.put(
  "/products/:id",
  requireAuth,
  requireRole(["admin"]),
  ProductController.update,
);
productRoutes.delete(
  "/products/:id",
  requireAuth,
  requireRole(["admin"]),
  ProductController.delete,
);
```

### Step 5.5: Generate and Run Migrations

```bash
# Generate migration from your models
deno task migrate:generate

# Review the migration file in migrations/
cat migrations/0001_*.sql

# Run migrations
deno task migrate:run

# Verify database
deno task db:studio
```

---

## 6. Testing

### Write Tests for Custom Logic

**Example: `product.service.test.ts`**

```typescript
Deno.test("ProductService - decreaseStock should reduce inventory", async () => {
  const product = await ProductService.getById(1);
  const initialStock = product.stock;

  await ProductService.decreaseStock(1, 5);

  const updated = await ProductService.getById(1);
  assertEquals(updated.stock, initialStock - 5);
});
```

### Run Tests

```bash
# Run all tests
deno task test

# Run specific test
deno test tests/unit/entities/products/product.service.test.ts --allow-all
```

---

## 7. Deployment

### Option A: Docker Deployment

```bash
# Build and run with Docker
docker-compose --profile prod up --build -d

# Check logs
docker-compose logs -f api
```

### Option B: Deno Deploy

```bash
# Install deployctl
deno install -Arf jsr:@deno/deployctl

# Deploy
deployctl deploy --project=my-client-api src/main.ts
```

### Option C: VPS Deployment

```bash
# On your server
git clone <your-repo>
cd my-client-backend

# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Set environment variables
nano .env

# Run with PM2 or systemd
deno task start
```

### Production Checklist

```bash
# Security
- [ ] Change JWT_SECRET to strong random value
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up rate limiting

# Database
- [ ] Switch to PostgreSQL for production
- [ ] Set up database backups
- [ ] Configure connection pooling

# Monitoring
- [ ] Set up logging (Sentry, LogRocket)
- [ ] Configure health checks
- [ ] Set up uptime monitoring

# Performance
- [ ] Enable caching
- [ ] Optimize database queries
- [ ] Configure CDN for static assets
```

---

## 8. Maintenance

### Adding New Features

```bash
# Generate new entity
tstack scaffold notifications

# Follow steps 5.1-5.5 above
# Commit changes
git add .
git commit -m "feat: add notifications entity"
git push
```

### Database Migrations

```bash
# Create new migration
deno task migrate:generate

# Review changes
cat migrations/0002_*.sql

# Apply migration
deno task migrate:run
```

### Monitoring & Debugging

```bash
# View logs
docker-compose logs -f

# Check health
curl http://localhost:8000/health

# Database inspection
deno task db:studio
```

---

## Real-World Example Workflow

### Day 1: Setup & Planning

```bash
1. Clone starter
2. Configure environment
3. Design data model
4. Create entity diagram
```

### Day 2-3: Core Features

```bash
1. Generate all entities with tstack CLI
2. Customize models with proper fields
3. Add validation rules in DTOs
4. Implement business logic in services
5. Run migrations
6. Test with Postman/Thunder Client
```

### Day 4-5: Advanced Features

```bash
1. Add search/filtering
2. Implement pagination
3. Add file uploads (images)
4. Set up email notifications
5. Add payment integration
```

### Day 6: Testing & Polish

```bash
1. Write unit tests
2. Write integration tests
3. Load testing
4. Security audit
5. Documentation
```

### Day 7: Deployment

```bash
1. Set up production database
2. Configure environment
3. Deploy to production
4. Set up monitoring
5. Client handoff
```

---

## Quick Reference

### Common Commands

```bash
# Development
deno task dev # Start dev server
deno task db:studio # Open database UI
tstack scaffold <entity> # Generate new entity

# Database
deno task migrate:generate # Create migration
deno task migrate:run # Run migrations

# Testing
deno task test # Run all tests
deno test <file> --allow-all # Run specific test

# Production
docker-compose up --build # Deploy with Docker
deno task start # Start production server
```

### Project Structure

```
my-client-backend/
├── src/
│ ├── main.ts # Entry point
│ ├── config/ # Configuration
│ ├── shared/ # Shared utilities
│ └── entities/ # Your business logic
│ ├── users/ # Pre-built auth
│ ├── products/ # Generated entities
│ └── orders/ # Generated entities
├── tests/ # All tests
├── migrations/ # Database migrations
├── data/ # SQLite database (dev)
├── docs/ # Documentation
├── .env # Environment variables
└── docker-compose.yml # Docker config
```

---

## Best Practices

1. **Always design your data model first** before generating entities
2. **Commit after each major change** for easy rollback
3. **Write tests as you go**, not at the end
4. **Use migrations** for all schema changes
5. **Keep business logic in services**, not controllers
6. **Document API endpoints** as you build them
7. **Set up CI/CD early** for automated testing
8. **Monitor from day one** with health checks and logging

---

## 🎊 You're Ready

With TonyStack, you can:

- Build a complete backend in **days, not weeks**
- Maintain **clean, type-safe** code
- Scale from **SQLite to PostgreSQL** without rewriting
- Deliver **production-ready** APIs to clients

**Happy building! **

---

_Need help? Check the main documentation or open an issue on GitHub._
