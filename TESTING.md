# Testing Standards

**Philosophy:** Reliability through reality.

TStack enforces a strict testing strategy designed for confidence, not just
coverage.

1. **Colocation**: Tests live next to the code they verify.
2. **Real Databases**: No mocks for database operations. We test against real
   PostgreSQL instances.
3. **Isolation**: Every test suite manages its own state.

## 1. Structure: Colocated Tests

We do not use a centralized `tests/` folder for unit/integration tests.

```text
src/
├── features/
│   └── auth/
│       ├── auth.service.ts      # Logic
│       ├── auth.test.ts         # Test (Colocated)
│       └── auth.controller.ts   # HTTP
└── shared/
    └── utils/
        ├── calculation.ts
        └── calculation.test.ts
```

**Why?**

- **Discoverability**: You cannot miss the tests when editing the file.
- **Modularity**: Moving a feature moves its tests automatically.
- **Ownership**: The tests are part of the feature, not an afterthought.

## 2. The "No Mocks" Rule

We do **not** mock the database in Service or Repository tests.

**Bad Pattern (Mocked):**

```typescript
// BAD: Tests your mock, not the database
const mockDb = {
  findMany: () => [{ id: 1, name: "Test" }],
};
assertEquals(await service.list(mockDb), 1);
```

**Good Pattern (Real):**

```typescript
// GOOD: Tests the actual SQL execution and constraints
// The 'db' instance connects to a real 'tstack_test' database
await service.create({ name: "Test" });
const results = await service.list(db);
assertEquals(results.length, 1);
```

**Benefits:**

- Catches SQL syntax errors.
- Verifies foreign key and unique constraints.
- Tests actual query performance.
- zero maintenance of complex mock objects.

## 3. Running Tests

Tests are executed via Deno tasks defined in each package's `deno.json`.

### Global CLI

Run from the root or any package:

```bash
# Run all tests in the current package
deno task test

# Run with coverage report
deno task test:coverage

# Watch mode (re-run on save)
deno task test:watch
```

### Environment Setup

Tests require a dedicated test database to avoid clashing with development data.

1. **Create Test Database**:
   ```bash
   psql -U postgres -c "CREATE DATABASE tstack_test;"
   ```

2. **Configure Environment**: Ensure your `.env` or CI environment points to
   this test database.
   ```env
   DATABASE_URL=postgresql://postgres:pass@localhost:5432/tstack_test
   ENVIRONMENT=test
   ```

## 4. Writing Tests

Use the standard Deno test runner (`Deno.test`) with BDD-style steps.

```typescript
import { assertEquals, assertRejects } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

Deno.test("UserService Integration", async (t) => {
  // 1. SETUP: constant state for this suite
  await t.step("Setup", async () => {
    await db.delete(users); // Clear table
  });

  // 2. TEST CASES
  await t.step("create() - enforces unique email", async () => {
    await userService.create({ email: "test@tstack.com" });

    await assertRejects(
      () => userService.create({ email: "test@tstack.com" }),
      Error,
      "Unique constraint violation",
    );
  });

  // 3. CLEANUP
  await t.step("Cleanup", async () => {
    await db.delete(users);
  });
});
```

## 5. CI/CD

Tests are automatically run on GitHub Actions.

- **Parallel Execution**: CLI, API, and Admin tests run in parallel jobs.
- **Services**: A fresh PostgreSQL 16 container is spun up for each workflow
  run.
- **Caching**: Deno dependencies are cached to speed up execution.
