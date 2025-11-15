# Testing in TonyStack

> **Comprehensive testing guide for TonyStack monorepo**
>
> Last Updated: November 14, 2025

This is the **root-level testing guide** for the entire TonyStack project. For package-specific testing instructions, see:

-  **[CLI Testing](./packages/cli/TESTING.md)** - Command-line tool tests
-  **[Admin Testing](./packages/admin/TESTING.md)** - Admin interface tests  
-  **[Starter Testing](./packages/starter/TESTING.md)** - Application tests with setup guide

---

##  Testing Philosophy

### 1. Colocated Tests

Tests live **next to the code they test**, not in separate `test/` folders:

```text
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.test.ts          ← Test next to source
├── entities/
│   └── articles/
│       ├── article.model.ts
│       ├── article.service.ts
│       └── article.test.ts    ← Test next to source
└── shared/
    └── utils/
        ├── validation.ts
        └── validation.test.ts ← Test next to source
```

**Benefits:**

- Easy to find tests
- Better organization by feature
- Microservice-ready
- Standard modern pattern (Next.js, Remix, Go, Rust)

### 2. Real Database Testing (No Mocks)

**We test against real PostgreSQL databases:**

```typescript
// [ERROR] BAD: Mocking database
const mockDB = {
  query: () => Promise.resolve({ rows: [] })
};

// [SUCCESS] GOOD: Real database
const db = drizzle(postgres(Deno.env.get("DATABASE_URL")));
const result = await db.select().from(users);
```

**Why?**

- Catches SQL errors mocks miss
- Tests real query performance
- Validates database constraints
- No mock maintenance burden

### 3. Test Environment Separation

Each package uses separate test databases:

| Package | Dev Database | Test Database |
|---------|-------------|---------------|
| Starter | `tonystack_db` | `tonystack_test_db` |
| Admin   | `admin_dev_db` | `admin_test_db` |
| CLI     | N/A | Uses temp dirs |

---

##  Quick Start (New Developers)

### Prerequisites

```bash
# 1. Install Deno
curl -fsSL https://deno.land/x/install/install.sh | sh

# 2. Verify PostgreSQL is running
psql --version

# 3. Clone repository
git clone <repo-url>
cd tonystack
```

### Running Tests By Package

#### Starter Package (Full Application)

```bash
cd packages/starter

# First time setup (creates DB, runs migrations, seeds data)
deno task test:full

# Daily development
deno task test
deno task test:watch
```

**See detailed setup:** [packages/starter/TESTING.md](./packages/starter/TESTING.md)

#### CLI Package (Command-line Tool)

```bash
cd packages/cli

# Run all tests
deno task test

# Watch mode
deno task test:watch
```

**See CLI testing guide:** [packages/cli/TESTING.md](./packages/cli/TESTING.md)

#### Admin Package (Admin Interface)

```bash
cd packages/admin

# Run all tests (requires PostgreSQL)
deno task test

# With coverage
deno task test:coverage
```

**See admin testing guide:** [packages/admin/TESTING.md](./packages/admin/TESTING.md)

---

## 📁 Project Structure

```text
tonystack/
├── packages/
│   ├── cli/                    # Command-line tool
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── create.ts
│   │   │   │   └── create.test.ts
│   │   │   └── utils/
│   │   │       ├── stringUtils.ts
│   │   │       └── stringUtils.test.ts
│   │   └── TESTING.md         ← CLI testing guide
│   │
│   ├── admin/                  # Admin interface library
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── pagination.ts
│   │   │   │   └── pagination.test.ts
│   │   │   ├── orm/
│   │   │   │   ├── drizzle.ts
│   │   │   │   └── drizzle.test.ts
│   │   │   └── framework/
│   │   │       ├── hono.ts
│   │   │       └── hono.test.ts
│   │   └── TESTING.md         ← Admin testing guide
│   │
│   └── starter/                # Full application template
│       ├── src/
│       │   ├── auth/
│       │   │   ├── auth.service.ts
│       │   │   ├── auth.test.ts
│       │   │   └── user.admin.test.ts
│       │   └── entities/
│       │       └── articles/
│       │           ├── article.service.ts
│       │           ├── article.test.ts
│       │           └── article.admin.test.ts
│       └── TESTING.md         ← Starter testing guide
│
└── TESTING.md                  ← This file (root guide)
```

---

## 🧪 Testing Standards

### Test Naming Convention

```typescript
// Format: "describe what it does - expected behavior"

Deno.test("findMany - returns paginated results", async () => {
  // Test implementation
});

Deno.test("findMany - filters by search term", async () => {
  // Test implementation
});

Deno.test("create - throws error when email exists", async () => {
  // Test implementation
});
```

### Test Organization

Each test file should follow this structure:

```typescript
import { assertEquals, assertExists } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";

// Imports
import { myFunction } from "./myFile.ts";

// Setup/teardown
let testResource: Resource;

beforeEach(async () => {
  testResource = await setupTestResource();
});

afterEach(async () => {
  await cleanupTestResource(testResource);
});

// Tests grouped by functionality
Deno.test("Feature Name Tests", async (t) => {
  await t.step("happy path scenario", async () => {
    // Test implementation
  });
  
  await t.step("error case scenario", async () => {
    // Test implementation
  });
});
```

### What to Test

[SUCCESS] **DO Test:**

- Public API behavior
- Edge cases (null, undefined, empty strings)
- Error handling and validation
- Database constraints (foreign keys, unique constraints)
- Authorization and authentication
- HTTP status codes and response formats
- Pagination, search, and filtering

[ERROR] **DON'T Test:**

- Implementation details
- Third-party library internals
- Private functions (test through public API)
- Trivial getters/setters
- Framework behavior

---

##  Environment Setup

### Environment Variables

Each package needs a `.env.test.local` file:

#### Starter Package

```bash
# packages/starter/.env.test.local
ENVIRONMENT=test
DATABASE_URL=postgresql://postgres:password@localhost:5432/tonystack_test_db
PORT=8001
LOG_LEVEL=error
JWT_SECRET=test-secret-key-for-testing-only
```

#### Admin Package

```bash
# packages/admin/.env.test.local
ENVIRONMENT=test
DATABASE_URL=postgresql://postgres:password@localhost:5432/admin_test_db
LOG_LEVEL=error
```

### Database Setup

**Create test databases:**

```bash
# Starter test database
psql -U postgres -c "CREATE DATABASE tonystack_test_db;"

# Admin test database
psql -U postgres -c "CREATE DATABASE admin_test_db;"
```

**Run migrations:**

```bash
# Starter package
cd packages/starter
deno task test:setup

# Admin package
cd packages/admin
deno task test:setup
```

---

##  Test Coverage Goals

| Package | Target Coverage | Current Status |
|---------|----------------|----------------|
| **CLI** | 85%+ | [SUCCESS] 90% |
| **Admin** | 90%+ | [SUCCESS] 100% (73/73 tests) |
| **Starter** | 85%+ | [SUCCESS] 100% (5 suites, 81 steps) |

### Viewing Coverage

```bash
# Generate coverage for specific package
cd packages/[package-name]
deno task test:coverage

# View HTML report
deno coverage coverage --html
open coverage/html/index.html
```

---

## 🐛 Debugging Tests

### Run Specific Tests

```bash
# Run single file
ENVIRONMENT=test deno test --allow-all src/auth/auth.test.ts

# Run tests matching pattern
ENVIRONMENT=test deno test --allow-all --filter="login" src/

# Run with detailed output
ENVIRONMENT=test deno test --allow-all --trace-ops src/
```

### Common Issues

#### "Database does not exist"

```bash
# Solution: Create and setup test database
cd packages/[package-name]
deno task test:setup
```

#### "Tests hang or timeout"

```bash
# Check for unclosed database connections
# Add cleanup in test files:
try {
  // Test code
} finally {
  await db.$client.end();
}
```

#### "Resource leaks" warnings

```bash
# Disable sanitizers for admin tests (they use persistent connections)
Deno.test({
  name: "Admin tests",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async (t) => {
    // Test code
  },
});
```

---

##  Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test All Packages

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
          deno-version: v2.x
      
      - name: Test CLI
        run: |
          cd packages/cli
          deno task test
      
      - name: Test Admin
        run: |
          cd packages/admin
          deno task test:full
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/admin_test_db
      
      - name: Test Starter
        run: |
          cd packages/starter
          deno task test:full
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/tonystack_test_db
```

---

## 📚 Best Practices

### 1. Test Independence

Each test should be completely independent:

```typescript
// [ERROR] BAD: Tests depend on execution order
let userId: number;

Deno.test("Create user", async () => {
  userId = await createUser();
});

Deno.test("Get user", async () => {
  const user = await getUser(userId); // Depends on previous test
});

// [SUCCESS] GOOD: Self-contained tests
Deno.test("Get user - returns user data", async () => {
  const userId = await createTestUser();
  const user = await getUser(userId);
  assertEquals(user.id, userId);
  await cleanupUser(userId);
});
```

### 2. Descriptive Assertions

```typescript
// [ERROR] BAD: Generic assertion
assertEquals(result, true);

// [SUCCESS] GOOD: Descriptive assertion
assertEquals(
  result.isAuthenticated,
  true,
  "User should be authenticated after successful login"
);
```

### 3. Cleanup in finally Blocks

```typescript
// [SUCCESS] GOOD: Always cleanup, even on failure
Deno.test("Article CRUD", async () => {
  const articleId = await createArticle();
  
  try {
    const article = await getArticle(articleId);
    assertEquals(article.title, "Test Article");
  } finally {
    await deleteArticle(articleId);
    await db.$client.end();
  }
});
```

### 4. Use Test Helpers

```typescript
// Create reusable helpers
async function loginAsAdmin(): Promise<string> {
  const response = await app.request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "superadmin@tstack.in",
      password: "TonyStack@2025!",
    }),
  });
  const data = await response.json();
  return data.token;
}

// Use in tests
Deno.test("Admin operations", async () => {
  const token = await loginAsAdmin();
  // Test admin operations
});
```

---

## 🔗 Package-Specific Guides

For detailed testing instructions for each package:

- **[CLI Testing Guide](./packages/cli/TESTING.md)** - Testing commands, utilities, and file operations
- **[Admin Testing Guide](./packages/admin/TESTING.md)** - Testing admin adapters with real databases
- **[Starter Testing Guide](./packages/starter/TESTING.md)** - Testing full application with setup instructions

---

## 🤝 Contributing

When adding new features:

1. Write tests first (TDD) or alongside implementation
2. Aim for 85%+ coverage on new code
3. Test against real databases, not mocks
4. Include both happy path and error cases
5. Add cleanup to prevent resource leaks
6. Run full test suite before submitting PR

---
