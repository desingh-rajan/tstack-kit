# Testing Guide

This guide covers testing in TonyStack projects built with **Deno** - including
setup, running tests, and troubleshooting.

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Full test setup in one command
deno task test:full
```

This single command:

- Creates test database
- Runs migrations
- Seeds test data
- Runs all tests
- Shows clean results

### Option 2: Manual Steps

```bash
# 1. Setup test database and run migrations
deno task test:setup

# 2. Run tests
deno task test

# 3. Clean reset (if needed)
deno task test:reset
```

## Available Test Tasks

| Task                     | Description                         | Use Case                         |
| ------------------------ | ----------------------------------- | -------------------------------- |
| `deno task test:full`    | **Complete test workflow**          | First run, CI/CD, clean slate    |
| `deno task test`         | Run tests only                      | Quick testing during development |
| `deno task test:setup`   | Create test DB + migrations + seeds | Initial setup                    |
| `deno task test:reset`   | Clean reset everything              | Fix broken test state            |
| `deno task test:migrate` | Run migrations on test DB           | After schema changes             |
| `deno task test:check`   | Health check test environment       | Validate setup                   |

## Database Setup

### Test Database

TonyStack automatically creates a separate test database:

- **Development DB**: `your_project_dev`
- **Test DB**: `your_project_test`

### Environment Configuration

Test environment uses:

- `ENVIRONMENT=test` (Deno-style environment variable)
- Separate database connection
- Test-specific seeds (superadmin + alpha user)

## Test Structure

### Current Test Suites

1. **Authentication Tests** (`src/auth/auth.test.ts`)
   - 19 test scenarios covering:
   - User registration/login
   - JWT token validation
   - Password changes
   - Admin operations
   - RBAC scenarios

2. **Article Tests** (`src/entities/articles/article.test.ts`)
   - 16 test scenarios covering:
   - CRUD operations
   - Authorization checks
   - Ownership validation
   - Public/private access

### Test Users

Automatically seeded for testing:

```typescript
// Superadmin (full access)
{
  email: "superadmin@tstack.in",
  password: "TonyStack@2025!",
  role: "superadmin"
}

// Alpha user (regular user)
{
  email: "alpha@tstack.in", 
  password: "Alpha@2025!",
  role: "user"
}
```

## Writing Tests

### Test File Structure

```typescript
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { app } from "../main.ts";
import { db } from "../config/database.ts";

// Test data cleanup
async function cleanupTestData() {
  // Clean up your test data here
}

// API request helper
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const fullEndpoint = endpoint.startsWith("/api")
    ? endpoint
    : `/api${endpoint}`;
  const response = await app.request(fullEndpoint, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
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

Deno.test("Your Feature Tests", async (t) => {
  try {
    await cleanupTestData();

    await t.step("Test scenario 1", async () => {
      // Your test logic
    });
  } finally {
    // Clean up resources
    try {
      await db.$client.end();
    } catch {
      // Ignore cleanup errors
    }
  }
});
```

### Best Practices

1. **Always use cleanup functions**
   - Clean test data before tests
   - Close database connections in `finally` blocks

2. **Use descriptive test names**

   ```typescript
   await t.step("POST /articles - without auth should fail", async () => {
     // Test logic
   });
   ```

3. **Test both success and error cases**
   - Valid requests (200, 201)
   - Invalid auth (401, 403)
   - Not found (404)
   - Validation errors (400)

4. **Use helper functions**
   - `apiRequest()` for HTTP calls
   - `cleanupTestData()` for data cleanup
   - Shared authentication tokens

## Troubleshooting

### Common Issues

#### "Database does not exist"

```bash
# Fix: Setup test database
deno task test:setup
```

#### "Tests hanging or not completing"

```bash
# Fix: Reset test environment
deno task test:reset
```

#### "Token expired" or auth failures

```bash
# Fix: Test users might be missing
deno task db:seed
```

#### "Resource leaks" warnings

- Tests not properly closing database connections
- Check `finally` blocks in test files
- Use `db.$client.end()` in cleanup

#### "0 passed" confusing output

- This is normal Deno test output format
- Look for "X passed (Y steps)" for actual results

### Debug Mode

Run tests with verbose output:

```bash
# Detailed test output
ENVIRONMENT=test deno test --allow-all src/ --reporter=verbose

# Run specific test file
ENVIRONMENT=test deno test --allow-all src/auth/auth.test.ts
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x

      - name: Run tests
        run: |
          cd packages/starter
          deno task test:full
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db
          ENVIRONMENT: test
```

## Test Coverage

### View Coverage

```bash
# Run tests with coverage
deno test --coverage=coverage --allow-all src/

# Generate coverage report
deno coverage coverage --html
```

### Coverage Goals

- **Controllers**: >90% (HTTP handlers)
- **Services**: >95% (Business logic)
- **Models**: >80% (Database schemas)
- **Overall**: >85%

## Performance Testing

### Load Testing Example

```typescript
// Example: Load test article creation
Deno.test("Load test - create 100 articles", async () => {
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(apiRequest("/articles", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: `Article ${i}`,
        content: "Test content",
        isPublished: true,
      }),
    }));
  }

  const results = await Promise.all(promises);
  const successful = results.filter((r) => r.status === 201);

  assertEquals(successful.length, 100);
});
```

## Testing Checklist

Before submitting a PR:

- [ ] All tests pass: `deno task test:full`
- [ ] No resource leaks or warnings
- [ ] New features have tests
- [ ] Error cases are covered
- [ ] Tests are clean and readable
- [ ] Database cleanup is proper

## Advanced Topics

### Mocking External APIs

```typescript
// Mock external service
const mockFetch = (url: string) => {
  if (url.includes("external-api.com")) {
    return Promise.resolve(new Response(JSON.stringify({ success: true })));
  }
  return fetch(url);
};

// Replace global fetch in tests
const originalFetch = globalThis.fetch;
globalThis.fetch = mockFetch;

// Restore after tests
globalThis.fetch = originalFetch;
```

### Testing File Uploads

```typescript
await t.step("Upload file", async () => {
  const formData = new FormData();
  formData.append(
    "file",
    new File(["test"], "test.txt", { type: "text/plain" }),
  );

  const result = await apiRequest("/upload", {
    method: "POST",
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });

  assertEquals(result.status, 200);
});
```

### Database Transaction Testing

```typescript
await t.step("Test rollback on error", async () => {
  const tx = await db.transaction();

  try {
    // Perform operations that should fail
    await tx.insert(users).values({/* invalid data */});
    await tx.rollback();
  } catch (error) {
    await tx.rollback();
  }

  // Verify no data was committed
  const count = await db.select().from(users);
  assertEquals(count.length, originalCount);
});
```

---

## Getting Help

1. **Check this guide first** - Common issues are covered
2. **Run `deno task test:reset`** - Fixes most setup issues
3. **Check test output** - Error messages are usually clear
4. **Open GitHub issue** - Include test output and error messages

---

## How to Remember This Stuff

### Quick Mental Model

Think **Deno = Environment**, **Node = ENVIRONMENT**:

```bash
# Node.js way (old habits!)
ENVIRONMENT=test npm test

# Deno way (clean and proper)
ENVIRONMENT=test deno task test
```

### Key Reminders

1. **We're in Deno-land** - use `ENVIRONMENT` not `ENVIRONMENT`
2. **Tests are colocated** - next to the code they test
3. **One command rules all** - `deno task test:full`
4. **Always clean up** - try/finally blocks for database connections
5. **Health check first** - `deno task test:check` when in doubt

### The Golden Workflow

```bash
# New project or after git pull
deno task test:full

# Daily development
deno task test:watch

# Something feels broken?
deno task test:check

# Nuclear option (when all else fails)
deno task test:reset
```

### Cheat Sheet

```
DENO TESTING CHEAT SHEET
========================
deno task test:full     → Complete workflow
deno task test         → Run tests only  
deno task test:check   → Health check
deno task test:reset   → Nuclear reset
deno task test:watch   → Watch mode
deno task test:coverage → With coverage

REMEMBER: ENVIRONMENT=test (not ENVIRONMENT!)
```

---

**Happy Testing!**
