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

# Run specific test file
deno test tests/unit/entities/users/user.service.test.ts --allow-all

# Run with coverage
deno test --coverage=coverage tests/
deno coverage coverage/
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
