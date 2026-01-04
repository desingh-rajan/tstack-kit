# Coding Standards

**Philosophy:** Clarity, consistency, and professional rigor.

## 1. AI-Assisted Development Protocol

**Rule:** Treat AI output as a draft, not a final deliverable.

Since many developers use advanced models (Claude Opus, Gemini 3 Pro, etc.),
strict discipline is required:

- **Iterative Refinement**: Initial AI code often lacks context. Revise
  iteratively to align with existing architecture.
- **Verification**: AI can hallucinate imports or use deprecated patterns.
  Verify every line.
- **Standard Enforcement**: explicitly instruct the AI to follow these Coding
  Standards.
- **No shortcuts**: Do not commit code you do not understand.

## 2. Code Quality & Formatting

**Rule:** TStack mandates a strictly professional, text-based log format.

- **NO Emojis**: Do not use emojis in code, comments, logs, or commit messages.
- **Log Prefixes**: Use standard text prefixes for grep-ability.
  - `[INFO]`, `[WARN]`, `[ERROR]`, `[DEBUG]`, `[SUCCESS]`
- **Formatting**: All code must pass `deno fmt`.

**Example:**

```typescript
// BAD
console.log("Server started! [emoji]");
throw new Error("Failed [emoji]");

// GOOD
console.log("[INFO] Server started on port 8000");
throw new Error("[ERROR] Database connection failed: Connection refused");
```

## 3. Naming Conventions

Follow these patterns strictly to maintain project consistency.

| Type                 | Convention         | Example                                 |
| :------------------- | :----------------- | :-------------------------------------- |
| **Files**            | `kebab-case`       | `user-service.ts`, `auth-middleware.ts` |
| **Classes**          | `PascalCase`       | `UserService`, `AuthMiddleware`         |
| **Functions**        | `camelCase`        | `createUser`, `validateToken`           |
| **Variables**        | `camelCase`        | `userProfile`, `isValid`                |
| **Constants**        | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `DEFAULT_PORT`           |
| **Database Tables**  | `snake_case`       | `user_profiles`, `orders`               |
| **Database Columns** | `snake_case`       | `user_id`, `created_at`                 |

## 4. TypeScript Guidelines

- **Strict Mode**: Always enabled.
- **Explicit Returns**: Public methods must have explicit return types.
- **No Any**: Do not use `any`. Use `unknown` if necessary, or specific types.
  - _Exception_: Controlled usage with `// deno-lint-ignore no-explicit-any`
    where strictly required.
- **Interfaces**: Prefer `interface` over `type` for object definitions.

## 5. Architecture & Organization

TStack follows a rigorous MVC + Service layer architecture.

- **Controllers**: Handle HTTP transport only (Requests, Responses, Status
  Codes).
- **Services**: Contain all business logic. No HTTP concerns.
- **DTOs**: Define data shapes and validation schemas (Zod).
- **Entities**: Database schemas (Drizzle).

**Directory Structure:**

```text
src/
├── entities/
│   └── users/
│       ├── user.model.ts      # Drizzle Schema
│       ├── user.dto.ts        # Zod Validation
│       ├── user.service.ts    # Business Logic
│       ├── user.controller.ts # HTTP Handler
│       ├── user.route.ts      # Route Definition
│       └── user.test.ts       # Integration Test
```

## 6. Error Handling

- **Contextual**: Errors must explain _why_ something failed, not just _that_ it
  failed.
- **Typed**: Use custom error classes where possible.
- **Propagation**: Let errors bubble up to the global error handler unless
  specific recovery is needed.

```typescript
// BAD
throw new Error("Invalid input");

// GOOD
throw new Error(
  `[ERROR] Invalid input: Email '${email}' is already registered`,
);
```

## 7. Testing Standards

- **Colocation**: Test files live next to the source (`user.service.ts` ->
  `user.service.test.ts`).
- **Isolation**: Tests must not depend on shared global state. Use
  `beforeEach`/`afterEach` for cleanup.
- **Directness**: Test specific behaviors, avoiding complex mocks where
  integration tests suffice.

## 8. Git Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

`type(scope): description`

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or correcting tests
- `chore`: Changes to build process or auxiliary tools

**Example:**

```bash
feat(auth): implement google oauth provider
fix(users): resolve unique constraint violation on email
docs(readme): update critical configuration table
```
