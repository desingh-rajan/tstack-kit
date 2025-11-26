# Quick Testing Guide

## Testing Your TonyStack API

### 1. Authentication Tests (19 test cases)

Test the complete auth system with registration, login, protected routes, admin
management, etc.

**Setup:**

```bash
# Terminal 1: Start server
docker compose up -d
deno task migrate:run
deno task db:seed
deno task dev
```

**Run Tests:**

```bash
# Terminal 2: Run auth tests
deno test --allow-all tests/auth.test.ts
```

**What it tests:**

- [SUCCESS] User registration & duplicate prevention
- [SUCCESS] Login with valid/invalid credentials
- [SUCCESS] Protected route access with tokens
- [SUCCESS] Password change & token revocation
- [SUCCESS] Admin user creation & management
- [SUCCESS] User CRUD operations (list, get, update, delete)

---

### 2. Entity CRUD Tests (10 test cases per entity)

Test any scaffolded entity (articles, products, orders, etc.)

**Setup:**

```bash
# 1. Scaffold your entity
tstack scaffold articles

# 2. Generate and run migrations
deno task migrate:generate
deno task migrate:run

# 3. Copy test template
cp tests/crud.template.test.ts tests/articles.test.ts
```

**Configure Test (in `tests/articles.test.ts`):**

```typescript
// Update these 4 things:
const ENTITY_NAME = "Article";
const ENTITY_ENDPOINT = "/articles";

const sampleData = {
  title: "Test Article",
  content: "Article content...",
  author: "John Doe",
  // ... your entity fields
};

const updatedData = {
  title: "Updated Article",
  content: "Updated content...",
  author: "Jane Smith",
  // ... your entity fields
};
```

**Run Tests:**

```bash
# Terminal 1: Server running
deno task dev

# Terminal 2: Run entity tests
deno test --allow-all tests/articles.test.ts
```

**What it tests:**

- [SUCCESS] Create entity
- [SUCCESS] Get all entities
- [SUCCESS] Get entity by ID
- [SUCCESS] Get non-existent (404)
- [SUCCESS] Update entity
- [SUCCESS] Update non-existent (404)
- [SUCCESS] Validation (invalid data)
- [SUCCESS] Delete entity
- [SUCCESS] Verify deletion
- [SUCCESS] Delete non-existent (404)

---

### 3. Manual API Testing with cURL

**Auth Endpoints:**

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123","username":"john"}'

# Login (save token)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@tstack.in","password":"TonyStack@2025!"}'

# Get current user
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create admin user
curl -X POST http://localhost:8000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","username":"admin1","password":"AdminPass123"}'
```

**Entity CRUD (example: articles):**

```bash
# Create
curl -X POST http://localhost:8000/api/articles \
  -H "Content-Type: application/json" \
  -d '{"title":"My Article","content":"Article content...","author":"John"}'

# Get all
curl http://localhost:8000/api/articles

# Get by ID
curl http://localhost:8000/api/articles/1

# Update
curl -X PUT http://localhost:8000/api/articles/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","content":"Updated content..."}'

# Delete
curl -X DELETE http://localhost:8000/api/articles/1
```

---

## Test All APIs at Once

```bash
# Run all tests
deno test --allow-all tests/

# Run with verbose output
deno test --allow-all tests/ --reporter=dot

# Run specific test
deno test --allow-all tests/auth.test.ts
deno test --allow-all tests/articles.test.ts
```

---

## Troubleshooting

### [ERROR] Error: Connection refused

**Solution:** Start server with `deno task dev`

### [ERROR] Error: Database connection failed

**Solution:** Start PostgreSQL with `docker compose up -d`

### [ERROR] Error: relation "users" does not exist

**Solution:** Run migrations with `deno task migrate:run`

### [ERROR] Error: Invalid credentials (superadmin)

**Solution:** Seed superadmin with `deno task db:seed`

### [ERROR] Error: 404 Not Found on entity endpoint

**Solution:** Make sure entity is scaffolded and migrations are applied

---

## Expected Test Output

```text
running 1 test from ./tests/auth.test.ts
Auth API Tests ...
  1. Register new user ... ok (45ms)
  2. Register duplicate user (should fail) ... ok (12ms)
  3. Login with superadmin ... ok (34ms)
  ...
  19. Access with revoked token (should fail) ... ok (8ms)
Auth API Tests ... ok (523ms)

running 1 test from ./tests/articles.test.ts
Articles CRUD API Tests ...
  1. Create article ... ok (23ms)
  2. Get all articles ... ok (12ms)
  ...
  10. Delete non-existent article (should fail) ... ok (9ms)
Articles CRUD API Tests ... ok (187ms)

ok | 2 passed (29 steps) | 0 failed (710ms)
```

---

## Next Steps

1. [SUCCESS] Run auth tests to verify authentication system
2. [SUCCESS] Scaffold your entities: `tstack scaffold products`
3. [SUCCESS] Create entity tests using the template
4. [SUCCESS] Run all tests before deployment
5. [SUCCESS] Set up CI/CD with test automation

Happy testing!
