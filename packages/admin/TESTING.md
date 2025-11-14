# Testing Guide for @tstack/admin

> **Production-quality testing with real databases, zero mocks**
>
> Last Updated: November 14, 2025

## 🎯 Testing Philosophy

### The "No Mocks" Rule

**We test against REAL PostgreSQL databases.**

#### Why No Mocks?

```typescript
// ❌ BAD: Mocking database
const mockDB = {
  query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] })
};

// Problems:
// - SQL syntax errors? Not caught!
// - Index missing? Not caught!
// - Race conditions? Not caught!
// - Connection pool issues? Not caught!
// - Real-world performance? Unknown!
```

```typescript
// ✅ GOOD: Real PostgreSQL database
const db = drizzle(postgres(Deno.env.get("DATABASE_URL")));

await t.step("findMany returns paginated results", async () => {
  // Seed real data
  await db.insert(testProducts).values([
    { name: "iPhone", price: 999 },
    { name: "MacBook", price: 1999 },
  ]);
  
  // Query real database
  const adapter = new DrizzleAdapter(testProducts, { db });
  const result = await adapter.findMany({ 
    page: 1, 
    limit: 10,
    search: "iPhone",
    searchColumns: ["name"],
  });
  
  // Verify real results
  assertEquals(result.data.length, 1);
  assertEquals(result.data[0].name, "iPhone");
  assertEquals(result.total, 1);  // Real COUNT(*) query!
});
```

### Benefits of Real Database Testing

1. **Catches Real Bugs** - SQL syntax, constraints, indexes
2. **Performance Validation** - Real query performance
3. **No Mock Maintenance** - No mock API to maintain
4. **Confidence** - Know it works in production
5. **Simplicity** - Less code, more value

---

## 📊 Test Results

### Current Status: 100% Passing

```text
✅ Core Pagination:   22/22 tests
✅ Drizzle Adapter:   26/26 tests (real PostgreSQL)
✅ Hono Adapter:      25/25 tests (real HTTP + DB)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TOTAL:            73/73 passing | 0 failed
```

### Test Categories

#### 1. Core Pagination Tests (22 tests)

**File**: `src/core/pagination.test.ts`

Tests pure pagination logic without database:

- Page number calculations
- Offset/limit math
- Total pages calculation
- Edge cases (page 0, negative limits)
- Large dataset pagination

**No database required** - Pure TypeScript functions.

#### 2. Drizzle ORM Adapter Tests (26 tests)

**File**: `src/orm/drizzle.test.ts`

Tests against **real PostgreSQL**:

- CRUD operations (create, read, update, delete)
- Search with `ILIKE` queries
- Sorting with `ORDER BY`
- Pagination with `LIMIT/OFFSET`
- Both number and UUID primary keys
- Foreign key constraints
- Unique constraints
- NULL handling

#### 3. Hono Framework Adapter Tests (25 tests)

**File**: `src/framework/hono.test.ts`

Tests full HTTP + database integration:

- HTTP request/response cycle
- Content negotiation (JSON vs HTML)
- Authentication & authorization
- Form parsing and validation
- Error handling (400, 404, 500)
- Response format validation

---

## 🚀 Running Tests

### Prerequisites

1. **PostgreSQL Running**

   ```bash
   # Check if PostgreSQL is running
   psql --version
   
   # Start PostgreSQL (varies by OS)
   # macOS: brew services start postgresql
   # Linux: sudo systemctl start postgresql
   # Windows: Check Services for PostgreSQL
   ```

2. **Environment Variables**

   Create `.env.test.local`:

   ```bash
   # packages/admin/.env.test.local
   ENVIRONMENT=test
   DATABASE_URL=postgresql://postgres:password@localhost:5432/admin_test_db
   LOG_LEVEL=error
   ```

3. **Test Database**

   ```bash
   # Create test database
   psql -U postgres -c "CREATE DATABASE admin_test_db;"
   ```

### Running Tests

```bash
# From packages/admin directory
cd packages/admin

# Run all tests
deno task test

# Run specific file
deno test --allow-all src/core/pagination.test.ts

# Watch mode (re-run on file changes)
deno test --allow-all --watch src/

# With coverage
deno task test:coverage
```

### Test Output

```bash
$ deno task test

running 3 tests from ./src/core/pagination.test.ts
Core Pagination ...
  Calculate pages ... ok (2ms)
  Calculate offset ... ok (1ms)
  Build result ... ok (1ms)
Core Pagination ... ok (7ms)

running 3 tests from ./src/orm/drizzle.test.ts
Drizzle ORM Adapter ...
  findMany - basic pagination ... ok (45ms)
  findMany - with search ... ok (38ms)
  create - insert new record ... ok (29ms)
Drizzle ORM Adapter ... ok (156ms)

running 3 tests from ./src/framework/hono.test.ts
Hono Admin Adapter ...
  GET /products - returns JSON list ... ok (67ms)
  POST /products - creates new record ... ok (54ms)
  GET /products/:id - returns single record ... ok (41ms)
Hono Admin Adapter ... ok (195ms)

ok | 3 passed (73 steps) | 0 failed (358ms)
```

---

## 📁 Project Structure

```text
packages/admin/
├── src/
│   ├── _test_setup.ts          ← Global test setup
│   ├── core/
│   │   ├── pagination.ts
│   │   ├── pagination.test.ts  ← Pure logic tests (no DB)
│   │   └── types.ts
│   ├── orm/
│   │   ├── base.ts
│   │   ├── drizzle.ts
│   │   └── drizzle.test.ts     ← Real PostgreSQL tests
│   ├── framework/
│   │   ├── hono.ts
│   │   └── hono.test.ts        ← Real HTTP + DB tests
│   └── views/
│       ├── layout.ts
│       ├── list.ts
│       └── form.ts
├── deno.json
├── TESTING.md                   ← This file
└── README.md
```

---

## 🧪 Writing Tests

### Test Structure

```typescript
import { assertEquals, assertExists } from "@std/assert";
import { postgres } from "postgresjs";
import { drizzle } from "drizzle-orm/postgres-js";

// Setup test database
const sql = postgres(Deno.env.get("DATABASE_URL") || "");
const db = drizzle(sql);

Deno.test("Feature Tests", async (t) => {
  // Setup: Create tables and seed data
  await t.step("Setup", async () => {
    await sql`DROP TABLE IF EXISTS test_products CASCADE`;
    await sql`CREATE TABLE test_products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER
    )`;
  });
  
  // Test cases
  await t.step("Test case 1", async () => {
    // Test implementation
  });
  
  await t.step("Test case 2", async () => {
    // Test implementation
  });
  
  // Cleanup: Drop tables and close connections
  await t.step("Cleanup", async () => {
    await sql`DROP TABLE IF EXISTS test_products CASCADE`;
    await sql.end();
  });
});
```

### Example: Drizzle Adapter Test

```typescript
import { DrizzleAdapter } from "./drizzle.ts";
import { testProducts } from "../test-schemas.ts";

Deno.test("DrizzleAdapter - CRUD operations", async (t) => {
  let productId: number;
  
  await t.step("Setup database", async () => {
    // Create test table
    await sql`DROP TABLE IF EXISTS test_products CASCADE`;
    await sql`CREATE TABLE test_products (...)`;
  });
  
  await t.step("create - inserts new record", async () => {
    const adapter = new DrizzleAdapter(testProducts, { db });
    
    const product = await adapter.create({
      name: "iPhone 15",
      price: 999,
    });
    
    assertExists(product.id);
    assertEquals(product.name, "iPhone 15");
    productId = product.id;
  });
  
  await t.step("findById - retrieves by ID", async () => {
    const adapter = new DrizzleAdapter(testProducts, { db });
    
    const product = await adapter.findById(productId);
    
    assertExists(product);
    assertEquals(product.id, productId);
    assertEquals(product.name, "iPhone 15");
  });
  
  await t.step("update - modifies record", async () => {
    const adapter = new DrizzleAdapter(testProducts, { db });
    
    const updated = await adapter.update(productId, {
      price: 899,
    });
    
    assertExists(updated);
    assertEquals(updated.price, 899);
    assertEquals(updated.name, "iPhone 15"); // Unchanged
  });
  
  await t.step("delete - removes record", async () => {
    const adapter = new DrizzleAdapter(testProducts, { db });
    
    const deleted = await adapter.delete(productId);
    assertEquals(deleted, true);
    
    const notFound = await adapter.findById(productId);
    assertEquals(notFound, null);
  });
  
  await t.step("Cleanup", async () => {
    await sql`DROP TABLE IF EXISTS test_products CASCADE`;
    await sql.end();
  });
});
```

### Example: Hono Adapter Test

```typescript
import { Hono } from "hono";
import { HonoAdminAdapter } from "./hono.ts";
import { DrizzleAdapter } from "../orm/drizzle.ts";

Deno.test("HonoAdminAdapter - HTTP integration", async (t) => {
  const app = new Hono();
  let productId: number;
  
  await t.step("Setup", async () => {
    // Create test table and adapter
    await sql`DROP TABLE IF EXISTS test_products CASCADE`;
    await sql`CREATE TABLE test_products (...)`;
    
    const ormAdapter = new DrizzleAdapter(testProducts, { db });
    const adminAdapter = new HonoAdminAdapter(app, ormAdapter, {
      basePath: "/admin/products",
    });
    
    adminAdapter.registerRoutes();
  });
  
  await t.step("GET /admin/products - returns JSON list", async () => {
    const response = await app.request("/admin/products", {
      headers: { "Accept": "application/json" },
    });
    
    assertEquals(response.status, 200);
    
    const json = await response.json();
    assertExists(json.data);
    assertExists(json.page);
    assertExists(json.total);
  });
  
  await t.step("POST /admin/products - creates record", async () => {
    const response = await app.request("/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "MacBook Pro",
        price: 1999,
      }),
    });
    
    assertEquals(response.status, 201);
    
    const json = await response.json();
    assertExists(json.id);
    productId = json.id;
  });
  
  await t.step("GET /admin/products/:id - returns single record", async () => {
    const response = await app.request(`/admin/products/${productId}`, {
      headers: { "Accept": "application/json" },
    });
    
    assertEquals(response.status, 200);
    
    const json = await response.json();
    assertEquals(json.id, productId);
    assertEquals(json.name, "MacBook Pro");
  });
  
  await t.step("Cleanup", async () => {
    await sql`DROP TABLE IF EXISTS test_products CASCADE`;
    await sql.end();
  });
});
```

---

## 🔧 Test Infrastructure

### Global Test Setup (`_test_setup.ts`)

Runs automatically before all tests:

```typescript
// src/_test_setup.ts

console.log("🧪 Setting up @tstack/admin test environment...");

// 1. Verify ENVIRONMENT=test
if (Deno.env.get("ENVIRONMENT") !== "test") {
  console.error("❌ Tests must run with ENVIRONMENT=test");
  Deno.exit(1);
}

// 2. Verify DATABASE_URL is set
if (!Deno.env.get("DATABASE_URL")) {
  console.error("❌ DATABASE_URL not set in environment");
  Deno.exit(1);
}

console.log("✅ Test environment ready");
console.log(`📦 Database: ${Deno.env.get("DATABASE_URL")}`);
```

### Test Database Management

Each test suite manages its own tables:

```typescript
// Create tables in Setup step
await t.step("Setup", async () => {
  await sql`DROP TABLE IF EXISTS test_products CASCADE`;
  await sql`CREATE TABLE test_products (...)`;
});

// Drop tables in Cleanup step
await t.step("Cleanup", async () => {
  await sql`DROP TABLE IF EXISTS test_products CASCADE`;
  await sql.end();
});
```

### Clean State Between Tests

Each test gets a fresh database state:

1. Drop existing tables
2. Create new tables
3. Seed test data
4. Run tests
5. Drop tables
6. Close connections

---

## 📌 Best Practices

### 1. Always Use Real Databases

```typescript
// ✅ GOOD
const db = drizzle(postgres(Deno.env.get("DATABASE_URL")));

// ❌ BAD
const mockDB = { query: jest.fn() };
```

### 2. Clean Up After Tests

```typescript
// ✅ GOOD
await t.step("Cleanup", async () => {
  await sql`DROP TABLE IF EXISTS test_products CASCADE`;
  await sql.end();
});

// ❌ BAD - Leaves connections open
// (No cleanup step)
```

### 3. Test Real-World Scenarios

```typescript
// ✅ GOOD - Tests real SQL
await t.step("search with special characters", async () => {
  const result = await adapter.findMany({
    search: "MacBook Pro 15\"",
    searchColumns: ["name"],
  });
  // Verifies ILIKE properly escapes quotes
});

// ❌ BAD - Mocks don't catch this
mockDB.query.mockResolvedValue({ rows: [] });
```

### 4. Test Both Success and Error Cases

```typescript
await t.step("create - throws on duplicate email", async () => {
  await adapter.create({ email: "test@test.com" });
  
  await assertRejects(
    async () => await adapter.create({ email: "test@test.com" }),
    Error,
    "duplicate key value",
  );
});
```

### 5. Use Descriptive Test Names

```typescript
// ✅ GOOD
await t.step("findMany - returns empty array when no results", async () => {
  // Test implementation
});

// ❌ BAD
await t.step("test 1", async () => {
  // Test implementation
});
```

---

## 🐛 Troubleshooting

### "Database does not exist"

```bash
# Solution: Create test database
psql -U postgres -c "CREATE DATABASE admin_test_db;"
```

### "Connection refused"

```bash
# Solution: Start PostgreSQL
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Check if running
psql -U postgres -c "SELECT version();"
```

### "Password authentication failed"

```bash
# Solution: Fix DATABASE_URL in .env.test.local
# Make sure password matches your PostgreSQL setup
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/admin_test_db
```

### "Tests hanging"

```typescript
// Solution: Ensure all tests have cleanup
await t.step("Cleanup", async () => {
  await sql.end(); // Close connections!
});
```

### "Resource leaks" warnings

```typescript
// Solution: Use sanitizeResources: false for DB tests
Deno.test({
  name: "Database tests",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async (t) => {
    // Test code with DB connections
  },
});
```

---

## 📚 Test Coverage

### Coverage Goals

- **Overall**: 90%+
- **Core Logic**: 100% (pagination calculations)
- **Adapters**: 95%+ (CRUD operations)
- **Error Handling**: 100% (all error paths)

### Generating Coverage

```bash
# Run tests with coverage
deno test --allow-all --coverage=coverage src/

# Generate HTML report
deno coverage coverage --html

# View report
open coverage/html/index.html
```

---

## 🚀 Contributing

When adding new adapters or features:

1. **Follow the same patterns** - Look at existing tests
2. **Use real databases** - NO MOCKS
3. **Test all CRUD operations** - Create, read, update, delete
4. **Test edge cases** - NULL values, empty strings, special characters
5. **Test error scenarios** - Constraints, validation, not found
6. **Clean up properly** - Close connections, drop tables
7. **Run full test suite** - Ensure nothing breaks

### Checklist Before PR

- [ ] All tests pass: `deno task test`
- [ ] Coverage >90%: `deno task test:coverage`
- [ ] No resource leaks
- [ ] Tests use real database (no mocks)
- [ ] All CRUD operations tested
- [ ] Error cases tested
- [ ] Cleanup implemented
- [ ] Documentation updated

---

## 🎯 The Golden Rule

> **"If you're mocking the database, you're not testing the code that matters."**

Real databases catch real bugs. Always test with PostgreSQL.

---

**Happy Testing!** 🧪

*For questions or issues, see [COMPREHENSIVE_GUIDE.md](./COMPREHENSIVE_GUIDE.md) or open an issue on GitHub.*
