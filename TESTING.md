# Testing in TonyStack

## 🎯 Colocated Test Pattern

TonyStack uses **colocated tests** where tests live next to the code they test.

### Project Structure

```
my-api/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.route.ts
│   │   └── auth.test.ts          ← Auth API tests
│   │
│   ├── entities/
│   │   ├── articles/
│   │   │   ├── article.controller.ts
│   │   │   ├── article.service.ts
│   │   │   ├── article.route.ts
│   │   │   └── article.test.ts   ← Article CRUD tests
│   │   │
│   │   └── products/
│   │       ├── product.controller.ts
│   │       └── product.test.ts   ← Product tests
│   │
│   ├── shared/
│   │   └── utils/
│   │       ├── validation.ts
│   │       └── validation.test.ts ← Utility tests
│   │
│   ├── _test_setup.ts            ← Global test setup
│   └── main.ts
│
├── scripts/
├── migrations/
└── deno.json
```

## ✅ Why Colocated Tests?

### 1. **Easy to Find**

```bash
# Want to test articles? It's right there!
src/entities/articles/
├── article.service.ts
└── article.test.ts    ← Right next to it!
```

### 2. **Better Organization**

Each feature module is self-contained with its own tests.

### 3. **Microservice Ready**

Moving to microservices? Just move the folder:

```bash
# Move entire feature with tests
mv src/entities/products → products-service/src/
```

### 4. **Standard Pattern**

Used by modern frameworks:

- **Next.js** - Components with `*.test.tsx`
- **Remix** - Routes with tests
- **Go** - `filename_test.go` next to `filename.go`
- **Rust** - Tests in same file or module

## 🚀 Running Tests

### All Tests

```bash
deno task test
```

### Specific Module

```bash
NODE_ENV=test deno test --allow-all src/auth/auth.test.ts
NODE_ENV=test deno test --allow-all src/entities/articles/
```

### Watch Mode

```bash
NODE_ENV=test deno test --allow-all --watch src/
```

### Setup Test Database

```bash
deno task test:reset  # Drops, recreates, migrates
```

## 📝 Automatic Test Generation

When you scaffold an entity, the test file is automatically generated:

```bash
tstack scaffold products
```

**Creates:**

```
src/entities/products/
├── product.model.ts
├── product.dto.ts
├── product.service.ts
├── product.controller.ts
├── product.route.ts
└── product.test.ts       ← Automatically generated!
```

## 🧪 Test Pattern (Hono Style)

**No server needed!** Tests use Hono's `app.request()` method directly:

```typescript
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../main.ts";

let authToken = "";
let productId = 0;

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const fullEndpoint = endpoint.startsWith("/api") 
    ? endpoint 
    : `/api${endpoint}`;
  
  const response = await app.request(fullEndpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }
  
  return { status: response.status, data };
}

Deno.test("Product API Tests", async (t) => {
  await t.step("1. Login", async () => {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "superadmin@tstack.in",
        password: "TonyStack@2025!"
      })
    });
    
    assertEquals(result.status, 200);
    assertExists(result.data.token);
    authToken = result.data.token;
  });

  await t.step("2. Create product", async () => {
    const result = await apiRequest("/products", {
      method: "POST",
      headers: { "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({
        name: "Test Product",
        price: 99.99
      })
    });
    
    assertEquals(result.status, 201);
    assertExists(result.data.id);
    productId = result.data.id;
  });

  await t.step("3. Get product by ID", async () => {
    const result = await apiRequest(`/products/${productId}`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    
    assertEquals(result.status, 200);
    assertEquals(result.data.name, "Test Product");
  });
});
```

## 🔧 Test Setup (`_test_setup.ts`)

The `src/_test_setup.ts` file runs automatically before all tests:

```typescript
// src/_test_setup.ts
import { config } from "./config/env.ts";

console.log("🧪 Setting up test environment...");

// 1. Verify NODE_ENV=test
if (config.nodeEnv !== "test") {
  console.error("❌ Tests must run with NODE_ENV=test");
  Deno.exit(1);
}

// 2. Run migrations
const migrateCmd = new Deno.Command("deno", {
  args: ["task", "migrate:run"],
  env: { ...Deno.env.toObject(), NODE_ENV: "test" }
});
await migrateCmd.output();

// 3. Seed superadmin (for auth tests)
const seedCmd = new Deno.Command("deno", {
  args: ["task", "db:seed"],
  env: { ...Deno.env.toObject(), NODE_ENV: "test" }
});
await seedCmd.output();

console.log("✅ Test environment ready");
```

## 📦 Test Database Configuration

Environment-specific database configuration:

### `.env.test.local`

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/myproject_test_db
PORT=8001
LOG_LEVEL=error
NODE_ENV=test
```

### `.env.development.local`

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/myproject_db
PORT=8000
LOG_LEVEL=debug
NODE_ENV=development
```

## 🎨 Test Examples

### Auth Tests

**Location**: `src/auth/auth.test.ts`

Tests:

- User registration
- Login with JWT tokens
- Protected routes
- Password changes
- Admin user management
- Token revocation

### Entity CRUD Tests

**Location**: `src/entities/{entity}/{entity}.test.ts`

Generated tests include:

- ✅ Create operation (POST)
- ✅ List all (GET)
- ✅ Get by ID (GET)
- ✅ Update (PUT)
- ✅ Delete/Soft delete (DELETE)
- ✅ Validation errors
- ✅ 404 handling

### Utility Tests

**Location**: `src/shared/utils/{utility}.test.ts`

Example:

```typescript
// src/shared/utils/validation.test.ts
import { assertEquals } from "@std/assert";
import { validateEmail } from "./validation.ts";

Deno.test("Email validation", () => {
  assertEquals(validateEmail("valid@email.com"), true);
  assertEquals(validateEmail("invalid"), false);
});
```

## 📌 Best Practices

### 1. Keep Tests Independent

```typescript
// ❌ Bad - relies on previous test
let userId;
Deno.test("Create user", () => { userId = 1; });
Deno.test("Get user", () => { /* uses userId */ });

// ✅ Good - self-contained
Deno.test("Get user", async () => {
  const user = await createTestUser();
  const result = await getUser(user.id);
  await cleanupTestUser(user.id);
});
```

### 2. Use Descriptive Names

```typescript
// ❌ Bad
Deno.test("test 1", () => {});

// ✅ Good
Deno.test("User API - should return 401 when token is invalid", () => {});
```

### 3. Test Behavior, Not Implementation

```typescript
// ❌ Bad - testing implementation
Deno.test("calls database.query", () => {
  const spy = sinon.spy(database, 'query');
  service.getUser(1);
  assert(spy.called);
});

// ✅ Good - testing behavior
Deno.test("returns user data when ID exists", async () => {
  const user = await service.getUser(1);
  assertEquals(user.id, 1);
  assertExists(user.email);
});
```

### 4. Clean Up After Tests

```typescript
Deno.test("Product tests", async (t) => {
  const createdIds: number[] = [];
  
  await t.step("Create products", async () => {
    const product = await createProduct({ name: "Test" });
    createdIds.push(product.id);
  });
  
  // Cleanup
  for (const id of createdIds) {
    await deleteProduct(id);
  }
});
```

## 🔍 Debugging Tests

### Run with Detailed Output

```bash
NODE_ENV=test deno test --allow-all src/ --trace-ops
```

### Run Single Test

```bash
NODE_ENV=test deno test --allow-all --filter "User login" src/
```

### Enable Debug Logging

```typescript
// In test file
Deno.env.set("LOG_LEVEL", "debug");
```

## 🎯 Test Coverage (Future)

```bash
# Run with coverage
deno task test:coverage

# Generate HTML report
deno task test:report
```

## 🚨 Common Issues

### "Relation does not exist"

```bash
# Solution: Reset test database
deno task test:reset
```

### "Port already in use"

Tests use `app.request()` - no server needed!

### "NODE_ENV not set"

```bash
# Always run with NODE_ENV=test
NODE_ENV=test deno task test
```

## 📚 Resources

- [Deno Testing Docs](https://deno.land/manual/testing)
- [Hono Testing Guide](https://hono.dev/guides/testing)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

**Happy Testing! 🧪**
