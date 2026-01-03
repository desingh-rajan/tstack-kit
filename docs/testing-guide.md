# Testing Guide

TStack uses BDD-style testing with Deno's built-in test runner.

## Test Structure

```typescript
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";

describe("Products API", () => {
  beforeAll(async () => {
    // Setup: create test data
  });

  afterAll(async () => {
    // Cleanup: remove test data
  });

  describe("GET /api/products", () => {
    it("should return list of products", async () => {
      const res = await app.request("/api/products");
      assertEquals(res.status, 200);

      const data = await res.json();
      assertExists(data.data);
    });
  });
});
```

## Running Tests

```bash
# Run all tests
deno task test

# Run tests in watch mode
deno task test:watch
```

## Test Database

Tests use a separate database (`_test` suffix). The test task handles setup and
cleanup automatically.

## Testing Authenticated Endpoints

```typescript
async function createTestUser(role: "user" | "admin" | "superadmin") {
  const [user] = await db
    .insert(users)
    .values({
      email: `${role}@test.local`,
      password: await hashPassword("password"),
      role,
    })
    .returning();

  const res = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: "password" }),
  });

  const { data } = await res.json();
  return { user, token: data.token };
}

// Usage
const { token } = await createTestUser("admin");

const res = await app.request("/ts-admin/products", {
  headers: { Authorization: `Bearer ${token}` },
});
```

## Test Patterns

### Test CRUD Operations

```typescript
describe("Products CRUD", () => {
  let productId: number;

  it("should create product", async () => {
    const res = await app.request("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", price: 10 }),
    });
    assertEquals(res.status, 201);
    productId = (await res.json()).id;
  });

  it("should read product", async () => {
    const res = await app.request(`/api/products/${productId}`);
    assertEquals(res.status, 200);
  });

  it("should update product", async () => {
    const res = await app.request(`/api/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    assertEquals(res.status, 200);
  });

  it("should delete product", async () => {
    const res = await app.request(`/api/products/${productId}`, {
      method: "DELETE",
    });
    assertEquals(res.status, 200);
  });
});
```

### Test Validation

```typescript
it("should reject invalid data", async () => {
  const res = await app.request("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "" }), // Invalid: empty name
  });
  assertEquals(res.status, 400);
});
```

### Test Authorization

```typescript
it("should require authentication", async () => {
  const res = await app.request("/ts-admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test" }),
  });
  assertEquals(res.status, 401);
});

it("should require admin role", async () => {
  const { token } = await createTestUser("user"); // Not admin
  const res = await app.request("/ts-admin/products", {
    headers: { Authorization: `Bearer ${token}` },
  });
  assertEquals(res.status, 403);
});
```

---

## Design Philosophy: Why Testing Works This Way

### "Mocks Lie, Real Databases Tell Truth"

TStack tests use real PostgreSQL databases, not mocks:

```typescript
// What TStack does NOT do
const mockDb = {
  insert: jest.fn().mockResolvedValue([{ id: 1, name: "Test" }]),
  select: jest.fn().mockResolvedValue([]),
};

// What TStack does
const [product] = await db.insert(products).values(data).returning();
// Actual INSERT into actual PostgreSQL
```

**Why real databases?**

1. **Constraint validation** - Mocks don't enforce NOT NULL, unique, or foreign
   keys. Real databases do.

2. **Query correctness** - Mock might return data for invalid SQL. Real database
   throws.

3. **Type coercion** - PostgreSQL handles types differently than JavaScript.
   Real database reveals mismatches.

4. **Transaction behavior** - Mocks can't simulate deadlocks, isolation levels,
   or rollback behavior.

5. **Performance reality** - Slow queries show up in tests. Mock queries are
   instant.

**The cost:**

Tests are slower (milliseconds vs microseconds) and require PostgreSQL running.
The benefit is tests that catch real bugs, not imaginary bugs in imaginary
databases.

### The Three-Database Pattern in Testing

TStack creates three databases per project:

```bash
my_app_dev   # Development - your local work
my_app_test  # Testing - automated tests
my_app_prod  # Production - deployed application
```

**Why a separate test database?**

1. **Isolation** - Tests don't pollute development data. You don't lose your
   carefully crafted test scenarios when running tests.

2. **Reproducibility** - Test database starts empty, fills with test data,
   clears after tests. Same starting state every run.

3. **Parallelization** - Multiple test runs can execute simultaneously without
   conflicts.

4. **Safety** - `deno task test` never touches production or development data.

### BDD Style: describe/it Over Test Functions

TStack uses BDD-style tests:

```typescript
describe("Products API", () => {
  describe("GET /products", () => {
    it("should return all products", async () => {});
    it("should filter by category", async () => {});
  });

  describe("POST /products", () => {
    it("should create product", async () => {});
    it("should validate input", async () => {});
  });
});
```

**Why BDD style?**

1. **Structure** - Nested describes organize tests by feature, then by
   operation.

2. **Readability** - Test names read like specifications: "Products API GET
   /products should return all products."

3. **Shared setup** - `beforeAll` and `afterAll` scope to describe blocks. Setup
   code lives near tests that need it.

4. **Output clarity** - Test runner shows hierarchical results:

   ```text
   Products API
     GET /products
       [ok] should return all products (23ms)
       [ok] should filter by category (18ms)
     POST /products
       [ok] should create product (31ms)
       [ok] should validate input (12ms)
   ```

**Why not simple test() functions?**

```typescript
// Deno's built-in style
Deno.test("GET /products returns all products", async () => {});
Deno.test("GET /products filters by category", async () => {});
```

Works for small test suites. Falls apart at scale:

- No grouping or hierarchy
- No shared setup (each test repeats setup)
- Flat output is hard to scan
- Related tests spread across file

### Test Isolation Strategy

Each test should be independent:

```typescript
describe("Products API", () => {
  let testProduct: Product;

  beforeAll(async () => {
    // Create test data for this describe block
    [testProduct] = await db
      .insert(products)
      .values({ name: "Test Product", price: 10 })
      .returning();
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(products).where(eq(products.id, testProduct.id));
  });

  it("should find product by ID", async () => {
    const res = await app.request(`/api/products/${testProduct.id}`);
    assertEquals(res.status, 200);
  });
});
```

**Rules for isolation:**

1. **Create what you need** - Each describe block creates its own test data
2. **Clean up after** - Remove test data in afterAll, not afterEach
3. **Don't share across describes** - Data created in one describe is not
   visible to others
4. **Use unique values** - Email: `test-${Date.now()}@test.local` avoids
   conflicts

**Why afterAll, not afterEach?**

afterEach cleans up after every test. For CRUD tests, this breaks the flow:

```typescript
// With afterEach (broken)
it("should create product", async () => {
  // Creates product
});
// afterEach runs, deletes product
it("should read product", async () => {
  // Fails! Product was deleted
});
```

```typescript
// With afterAll (correct)
it("should create product", async () => {
  // Creates product, stores ID
});
it("should read product", async () => {
  // Works! Product still exists
});
it("should delete product", async () => {
  // Deletes product
});
// afterAll runs, cleans up any remaining data
```

### The testClient Pattern

TStack tests use Hono's `app.request()`:

```typescript
const res = await app.request("/api/products", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Test" }),
});
```

**Why not fetch() or supertest?**

1. **No server needed** - `app.request()` calls handlers directly. No HTTP
   server to start/stop.

2. **Faster** - No network overhead. Request goes directly to handler.

3. **Simpler** - No port management, no race conditions, no cleanup.

4. **Type safe** - Response types match your app's types.

**Tradeoff:**

Does not test HTTP parsing edge cases (malformed requests, connection timeouts).
For API testing, handler-level testing is sufficient.

### Authentication in Tests

Every test that needs auth follows this pattern:

```typescript
async function createTestUser(role: "user" | "admin" | "superadmin") {
  const email = `${role}-${Date.now()}@test.local`;
  const password = "test-password-123";

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email,
      password: await hashPassword(password),
      role,
    })
    .returning();

  // Get token
  const res = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const { data } = await res.json();
  return { user, token: data.token };
}
```

**Why create real users?**

1. **Tests auth flow** - Login must work for tests to pass
2. **Tests authorization** - Real roles, real permission checks
3. **No mock JWT** - Token is valid, signature is correct
4. **Reflects production** - Same code path as real users

**Why timestamp in email?**

```typescript
const email = `${role}-${Date.now()}@test.local`;
```

Parallel tests create users simultaneously. Unique emails prevent conflicts.

### What to Test

TStack scaffolds tests for:

1. **CRUD operations** - Create, Read, Update, Delete work correctly
2. **Validation** - Invalid input returns 400 with error details
3. **Authentication** - Protected routes require valid token
4. **Authorization** - Role-restricted routes check roles

**What TStack does NOT scaffold tests for:**

1. **Unit tests for services** - Test through API instead
2. **Database migrations** - Trust Drizzle
3. **Framework internals** - Trust Hono
4. **Third-party integrations** - Mock at boundaries if needed

**Philosophy:**

Test your code, not your dependencies. API tests exercise your business logic
through the same path users take.

### Test Naming Conventions

Good test names are specifications:

```typescript
// Good - describes behavior
it("should return 401 when token is missing", async () => {});
it("should return 400 when name exceeds 255 characters", async () => {});
it("should soft delete and return 200", async () => {});

// Bad - describes implementation
it("calls authMiddleware", async () => {});
it("runs validateName function", async () => {});
it("sets deletedAt to current timestamp", async () => {});
```

**The "should" convention:**

Every test name starts with "should". This forces you to describe expected
behavior, not implementation details.

### Test Organization

Tests live alongside the code they test:

```text
src/entities/products/
├── product.model.ts
├── product.service.ts
├── product.controller.ts
├── product.route.ts
├── product.admin.route.ts
├── product.test.ts          # Tests for product.route.ts
└── product.admin.test.ts    # Tests for product.admin.route.ts
```

**Why co-located tests?**

1. **Discoverability** - Test file is right next to source file
2. **Ownership** - Modify entity, modify its tests in same commit
3. **Import simplicity** - Relative imports: `./product.service.ts`
4. **Delete together** - Remove entity, remove its tests

**Alternative: `tests/` folder:**

Some projects put all tests in a top-level `tests/` folder. TStack doesn't
because:

- Harder to find tests for specific code
- File paths drift as project grows
- Easy to forget tests when modifying code

### Coverage Philosophy

TStack provides coverage tooling but doesn't enforce coverage thresholds:

```bash
deno task test:coverage
```

**Why no enforced coverage?**

1. **Coverage is not quality** - 100% coverage with bad assertions catches
   nothing
2. **False confidence** - High coverage feels safe but isn't
3. **Metric gaming** - Enforced thresholds lead to low-value tests written just
   to hit numbers

**What to actually measure:**

- Do tests catch real bugs? (Track bugs that escaped testing)
- Are critical paths tested? (Auth, payment, data integrity)
- Do tests run fast? (Slow tests get skipped)

### Running Tests in CI

TStack projects include GitHub Actions workflow:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: deno task test
  env:
    DATABASE_URL: postgres://postgres:postgres@localhost:5432/app_test
```

**CI-specific considerations:**

1. **Test database** - CI creates fresh database per run
2. **No watch mode** - `deno task test`, not `deno task test:watch`
3. **Exit codes** - Tests fail CI on any assertion failure
4. **Parallelization** - Deno runs tests in parallel by default

Next: [Architecture](./architecture.md)
