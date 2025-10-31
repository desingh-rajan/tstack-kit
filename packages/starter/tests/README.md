# Tests

This directory contains all test files for the TonyStack starter application.

## Structure

```
tests/
├── unit/ # Unit tests
│ ├── entities/ # Entity-specific tests
│ │ └── users/ # User entity tests
│ ├── shared/ # Shared utilities tests
│ └── config/ # Config tests
├── integration/ # Integration tests
│ └── api/ # API endpoint tests
└── helpers/ # Test utilities and helpers
```

## Running Tests

```bash
# Run all tests
deno task test

# Run auth API tests (requires server running)
deno test --allow-all tests/auth.test.ts

# Run specific test file
deno test tests/unit/entities/users/user.service.test.ts --allow-all

# Run with coverage
deno test --coverage=coverage tests/
deno coverage coverage/
```

## Authentication API Tests

### Prerequisites

1. **Database is running**: `docker compose up -d`
2. **Migrations applied**: `deno task migrate:run`
3. **Superadmin seeded**: `deno task db:seed`
4. **Server running**: `deno task dev` (in separate terminal)

### Run Auth Tests

```bash
deno test --allow-all tests/auth.test.ts
```

### Test Coverage (19 Test Cases)

The auth tests cover:

- ✅ User registration (success + duplicate prevention)
- ✅ User login (success + wrong password)
- ✅ Protected routes (with/without/invalid tokens)
- ✅ Password change functionality
- ✅ Token revocation on logout
- ✅ Admin user creation
- ✅ User management (list, get, update, delete)
- ✅ Soft delete verification

### Manual Testing with cURL

#### Register User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123", "username": "johndoe"}'
```

#### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@tstack.in", "password": "TonyStack@2025!"}'
```

#### Get Current User (Protected)

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Create Admin (Admin Only)

```bash
curl -X POST http://localhost:8000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "username": "admin1", "password": "AdminPass123"}'
```

See `tests/auth.test.ts` for complete test implementation.

## Entity CRUD Tests

### Testing Scaffolded Entities

After scaffolding an entity with `tstack scaffold <entity>`, you can test its CRUD operations:

#### Option 1: Use Template (Recommended)

```bash
# 1. Scaffold your entity
tstack scaffold articles

# 2. Apply migrations
deno task migrate:generate
deno task migrate:run

# 3. Copy test template
cp tests/crud.template.test.ts tests/articles.test.ts

# 4. Update configuration in articles.test.ts:
#    - ENTITY_NAME = "Article"
#    - ENTITY_ENDPOINT = "/articles"
#    - sampleData = { your entity fields }
#    - updatedData = { your entity fields }

# 5. Run tests
deno task dev # (in separate terminal)
deno test --allow-all tests/articles.test.ts
```

#### Option 2: Use Articles Example

A complete example is provided in `tests/articles.test.ts`:

```bash
# 1. Scaffold articles entity
tstack scaffold articles

# 2. Run migrations
deno task migrate:generate
deno task migrate:run

# 3. Start server
deno task dev

# 4. Run tests (in separate terminal)
deno test --allow-all tests/articles.test.ts
```

### CRUD Test Coverage (10 Test Cases)

Each entity test covers:

1. ✅ Create entity (POST)
2. ✅ Get all entities (GET)
3. ✅ Get entity by ID (GET)
4. ✅ Get non-existent entity - 404 (GET)
5. ✅ Update entity (PUT)
6. ✅ Update non-existent entity - 404 (PUT)
7. ✅ Validation - invalid data (POST)
8. ✅ Delete entity (DELETE)
9. ✅ Verify deletion - 404 (GET)
10. ✅ Delete non-existent entity - 404 (DELETE)

### Quick Test Guide

```bash
# Test auth system
deno test --allow-all tests/auth.test.ts

# Test specific entity
deno test --allow-all tests/articles.test.ts

# Test all
deno test --allow-all tests/
```

## Writing Tests

### Unit Test Example

```typescript
// tests/unit/entities/users/user.service.test.ts
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { UserService } from "../../../../src/entities/users/user.service.ts";

Deno.test("UserService - should get all users", async () => {
  const users = await UserService.getAll();
  assertExists(users);
  assertEquals(Array.isArray(users), true);
});
```

### Integration Test Example

```typescript
// tests/integration/api/auth.test.ts
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import app from "../../../src/main.ts";

Deno.test("POST /api/auth/register - should register a new user", async () => {
  const req = new Request("http://localhost:8000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    }),
  });

  const res = await app.fetch(req);
  assertEquals(res.status, 201);
});
```

## Best Practices

1. **Mirror src structure** - Keep test files in the same structure as source
   files
2. **Naming convention** - Use `*.test.ts` for all test files
3. **Test isolation** - Each test should be independent
4. **Setup/Teardown** - Use test database for integration tests
5. **Mock external dependencies** - Use mocks for external services

## Coverage Goals

- **Unit tests**: Aim for 80%+ coverage
- **Integration tests**: Cover all API endpoints
- **E2E tests**: Cover critical user flows
