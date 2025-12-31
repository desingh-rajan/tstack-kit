# [WARNING] Testing Pattern Change

## TonyStack now uses **Colocated Tests**

Tests now live **next to the code they test**, not in this folder!

### New Structure (Current)

```text
src/
├── auth/
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── auth.test.ts          ← Auth tests here!
│
├── entities/
│   └── articles/
│       ├── article.service.ts
│       ├── article.controller.ts
│       └── article.test.ts   ← CRUD tests here!
│
└── _test_setup.ts            ← Runs before all tests
```

### Why Colocated?

[SUCCESS] **Easy to find** - Tests right next to code\
[SUCCESS] **Better organized** - Each feature is self-contained\
[SUCCESS] **Microservice ready** - Move features with their tests\
[SUCCESS] **Standard pattern** - Used by Next.js, Remix, Go, Rust

### Running Tests

```bash
# Run all tests (searches src/ folder)
deno task test

# Run specific module
ENVIRONMENT=test deno test --allow-all src/auth/auth.test.ts
ENVIRONMENT=test deno test --allow-all src/entities/articles/article.test.ts

# Setup test database
deno task test:reset
```

### Scaffolding Generates Tests

When you scaffold an entity, tests are automatically created **in the entity
folder**:

```bash
tstack scaffold products

# Creates:
src/entities/products/
├── product.service.ts
├── product.controller.ts
├── product.route.ts
└── product.test.ts  ← Test file here!
```

### Test Pattern (Hono Style)

No server needed! Uses `app.request()` directly:

```typescript
import { assertEquals } from "@std/assert";
import { app } from "../main.ts";

Deno.test("Product API - create product", async () => {
  const response = await app.request("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ name: "Test", price: 99 }),
  });

  assertEquals(response.status, 201);
});
```

### Migration from Old Pattern

If you have tests in this `tests/` folder, move them:

```bash
# Move entity tests
mv tests/articles.test.ts src/entities/articles/article.test.ts

# Move auth tests
mv tests/auth.test.ts src/auth/auth.test.ts
```

---

**This folder** may contain:

- Integration test helpers
- Shared test utilities
- Legacy test templates

For **feature tests**, use the colocated pattern above!
