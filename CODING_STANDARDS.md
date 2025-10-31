# TonyStack Coding Standards

## Code Quality Rules

### 1. NO Emojis or Emoticons in Code or Logs

**Rule**: Never use emojis or emoticons in:

- Console.log statements
- Error messages
- Comments  
- Variable names
- Function names
- Test output

**Why**:

- Not all terminals support emoji rendering properly
- Creates inconsistent display across different environments
- Professional code should use plain text
- Better for CI/CD logs and log aggregation tools
- Improves searchability and grep-ability

**Bad**:

```typescript
console.log("✅ User created successfully");
console.error("❌ Database connection failed");
Logger.info("🚀 Server started!");
```

**Good**:

```typescript
console.log("[SUCCESS] User created successfully");
console.error("[ERROR] Database connection failed");
Logger.info("[INFO] Server started");
```

**Prefixes to use**:

- `[SUCCESS]` or `[OK]` for successful operations
- `[ERROR]` or `[FAIL]` for errors
- `[WARNING]` or `[WARN]` for warnings
- `[INFO]` for informational messages
- `[DEBUG]` for debug output

### 2. Clean Console Output

**Rule**: Console logs should be clear, parseable, and professional.

**Good patterns**:

```typescript
console.log("[INFO] Environment loaded from .env.development");
console.log("[SUCCESS] Database migrated successfully");
console.error("[ERROR] Failed to connect to database:", error.message);
console.warn("[WARNING] Missing optional configuration: SMTP_HOST");
```

### 3. Comments

**Rule**: Comments should explain WHY, not WHAT.

**Bad**:

```typescript
// Create user
const user = await db.insert(users).values(data);
```

**Good**:

```typescript
// Password is already hashed by auth middleware
const user = await db.insert(users).values(data);
```

**Remove**:

- TODO comments that are never done
- Commented-out code (use git history instead)
- Redundant comments that repeat the code

### 4. Error Handling

**Rule**: Always provide context in error messages.

**Bad**:

```typescript
throw new Error("Failed");
```

**Good**:

```typescript
throw new Error(`Failed to create user: ${email} already exists`);
```

### 5. Naming Conventions

- **Files**: kebab-case (`user-service.ts`, `auth-middleware.ts`)
- **Classes**: PascalCase (`UserService`, `AuthMiddleware`)
- **Functions/Methods**: camelCase (`createUser`, `validateToken`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_PORT`)
- **Interfaces/Types**: PascalCase (`User`, `AuthToken`)

### 6. TypeScript

- Always specify return types for public functions
- Use strict mode
- No `any` without `// deno-lint-ignore no-explicit-any` comment
- Prefer interfaces over type aliases for object shapes
- Use enums for fixed sets of values

### 7. Testing

- Test files next to code (colocated)
- Clear test names describing behavior
- NO console.log with emojis in tests
- Use descriptive assertions

**Good test**:

```typescript
await t.step("POST /users - creates user successfully", async () => {
  const result = await apiRequest("/users", {
    method: "POST",
    body: JSON.stringify({ email: "test@example.com" }),
  });
  
  assertEquals(result.status, 201);
  assertEquals(result.data.email, "test@example.com");
});
```

### 8. API Responses

- Consistent response structure
- Use proper HTTP status codes
- Include helpful error messages
- NO emojis in API responses

**Good**:

```typescript
return c.json({
  status: "success",
  data: user,
  message: "User created successfully"
}, 201);
```

### 9. File Organization

```
src/
├── auth/           # Auth feature
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.route.ts
│   ├── auth.dto.ts
│   ├── auth.model.ts
│   └── auth.test.ts    # Colocated test
├── entities/       # Business entities
│   └── users/
│       ├── user.controller.ts
│       ├── user.service.ts
│       └── user.test.ts
└── shared/         # Shared utilities
    ├── middleware/
    ├── utils/
    └── types/
```

### 10. Git Commits

**Format**: `<type>(<scope>): <subject>`

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks

**Examples**:

```bash
feat(auth): add role-based access control
fix(users): prevent duplicate email registration
docs(readme): update installation instructions
refactor(articles): remove emoji from logs
test(auth): add tests for password change
```

### 11. Database

- Use migrations for all schema changes
- Never modify migrations after they're committed
- Use meaningful constraint names
- Add indexes for foreign keys
- Use snake_case for column names in database

### 12. Security

- Never log sensitive data (passwords, tokens)
- Validate all user input
- Use parameterized queries (Drizzle handles this)
- Hash passwords with bcrypt
- Use environment variables for secrets
- Implement rate limiting
- Use HTTPS in production

## Code Review Checklist

Before committing:

- [ ] NO emojis in code or logs
- [ ] All functions have return types
- [ ] Tests pass
- [ ] No commented-out code
- [ ] Error messages are descriptive
- [ ] Console logs use proper prefixes ([INFO], [ERROR], etc.)
- [ ] Files formatted with `deno fmt`
- [ ] No `any` types without lint-ignore
- [ ] Commit message follows format

## Auto-fix Commands

```bash
# Format code
deno fmt

# Check types
deno check src/main.ts

# Run tests
NODE_ENV=test deno test --allow-all src/

# Search for emojis (to remove them)
grep -r "✅\|❌\|🚀\|⚠️\|💡\|🎉\|🌱" src/
```

## Why These Standards Matter

1. **Consistency**: Code looks the same regardless of who wrote it
2. **Maintainability**: Easy to understand and modify
3. **Professionalism**: Production-ready code quality
4. **Debuggability**: Clear logs make troubleshooting easier
5. **Collaboration**: Standards make teamwork smoother
6. **CI/CD**: Clean logs work better in automated pipelines

## Enforcement

These standards are enforced through:

- Code reviews
- Linting tools
- Automated formatters
- This documentation

When in doubt, prioritize clarity and simplicity over cleverness.
