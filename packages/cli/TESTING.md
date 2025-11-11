# Testing Guide for TonyStack CLI

> Simple, effective testing without overcomplication

## Philosophy

- **Test what matters**: Focus on behavior, not implementation details
- **Keep it simple**: No complex mocking frameworks or tooling overhead
- **Fast feedback**: Tests should run quickly
- **Readable tests**: Tests are documentation

## Folder Structure

```
packages/cli/
├── src/
│   ├── commands/
│   │   ├── create.ts
│   │   ├── create.test.ts          ← Test next to source
│   │   ├── scaffold.ts
│   │   ├── scaffold.test.ts
│   │   └── destroy.ts
│   │   └── destroy.test.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── logger.test.ts
│   │   ├── stringUtils.ts
│   │   ├── stringUtils.test.ts
│   │   ├── fileWriter.ts
│   │   ├── fileWriter.test.ts
│   │   ├── versionFetcher.ts
│   │   └── versionFetcher.test.ts  ← ✅ Already done!
│   └── templates/
├── tests/
│   ├── helpers/
│   │   ├── tempDir.ts              ← Temp directory management
│   │   ├── fixtures.ts             ← Test fixtures
│   │   └── assertions.ts           ← Custom assertions
│   └── integration/
│       ├── full-workflow.test.ts   ← E2E tests
│       └── error-handling.test.ts
└── TESTING.md                       ← This file
```

## Test Organization

### 1. **Unit Tests** (Next to Source)

- Test individual functions/classes
- Fast, isolated, no file system operations
- File pattern: `*.test.ts` next to the source file
- Example: `src/utils/stringUtils.test.ts`

### 2. **Integration Tests** (`tests/integration/`)

- Test full command workflows
- Use real file system (in temp directories)
- Test error scenarios
- Example: `tests/integration/full-workflow.test.ts`

### 3. **Test Helpers** (`tests/helpers/`)

- Reusable utilities for tests
- Temp directory creation/cleanup
- Common assertions
- Test fixtures

## Running Tests

```bash
# Run all tests
deno task test

# Run specific file
deno test src/utils/stringUtils.test.ts

# Run with coverage
deno task test:coverage

# Watch mode
deno test --watch src/

# Run only integration tests
deno test tests/integration/
```

## Writing Tests

### Basic Test Structure

```typescript
import { assertEquals } from "@std/assert";
import { myFunction } from "./myFile.ts";

Deno.test("myFunction - does what it should", () => {
  const result = myFunction("input");
  assertEquals(result, "expected output");
});

Deno.test("myFunction - handles edge case", () => {
  const result = myFunction("");
  assertEquals(result, "");
});
```

### Testing File Operations

```typescript
import { join } from "@std/path";
import { createTempDir, cleanupTempDir } from "../tests/helpers/tempDir.ts";

Deno.test("creates file correctly", async () => {
  const tempDir = await createTempDir();
  
  try {
    // Test file creation
    await myFileOperation(tempDir);
    
    // Assert file exists
    const filePath = join(tempDir, "myfile.txt");
    const fileExists = await Deno.stat(filePath);
    assertEquals(fileExists.isFile, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});
```

### Testing Commands

```typescript
Deno.test("scaffold command - generates all files", async () => {
  const tempDir = await createTempDir();
  
  try {
    await scaffoldEntity({
      entityName: "products",
      targetDir: tempDir,
    });
    
    // Assert files were created
    const modelExists = await exists(join(tempDir, "src/entities/products/product.model.ts"));
    assertEquals(modelExists, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});
```

## Coverage Goals

- **Overall**: 80%+ coverage
- **Critical paths**: 100% (create, scaffold commands)
- **Utilities**: 90%+ (stringUtils, fileWriter)
- **Error handling**: All error paths tested

## Test Naming Convention

```
functionName - expected behavior
     ↓              ↓
kebabCase - does something specific
     ↓              ↓
Example: "toKebabCase - converts BlogPost to blog-post"
```

## What to Test

✅ **DO Test:**

- Public API behavior
- Edge cases (empty strings, invalid input)
- Error handling
- File generation correctness
- Naming convention conversions

❌ **DON'T Test:**

- Implementation details
- Third-party libraries (Deno std, etc.)
- Console output (unless critical)
- Private functions (test through public API)

## Test Isolation

- Each test should be independent
- Use temp directories for file operations
- Clean up after each test
- No shared state between tests

## Common Patterns

### 1. **Setup/Teardown with Temp Directories**

```typescript
let tempDir: string;

beforeEach(async () => {
  tempDir = await createTempDir();
});

afterEach(async () => {
  await cleanupTempDir(tempDir);
});
```

### 2. **Testing Error Cases**

```typescript
import { assertRejects } from "@std/assert";

Deno.test("function - throws on invalid input", async () => {
  await assertRejects(
    async () => await myFunction("invalid"),
    Error,
    "Expected error message",
  );
});
```

### 3. **Snapshot Testing (for generated files)**

```typescript
Deno.test("generates correct model file", async () => {
  const generated = await generateModel("Product");
  const expected = await Deno.readTextFile("tests/fixtures/expected-model.ts");
  assertEquals(generated, expected);
});
```

## Debugging Tests

```bash
# Show detailed error messages
DEBUG=1 deno test

# Run single test
deno test --filter="test name"

# Show console output
deno test -- --log-level=debug
```

## CI/CD (Future - Post v2.0)

We'll add GitHub Actions later. For now, contributors run tests locally:

```bash
# Before committing
deno task test

# Before creating PR
deno task test:coverage
```

## FAQ

**Q: Where do I put test fixtures?**
A: In `tests/helpers/fixtures.ts` or create a `tests/fixtures/` folder

**Q: Should I mock file system operations?**
A: No, use real temp directories. It's simpler and more reliable.

**Q: How do I test the CLI commands end-to-end?**
A: Use integration tests in `tests/integration/` with real temp directories.

**Q: Do I need to test every private function?**
A: No, test through the public API. If a private function is complex enough to need testing, it should probably be public.

**Q: What about testing database operations?**
A: Mock database commands or use test databases. Keep CLI tests focused on file/config generation.

## Examples

See these files for reference:

- ✅ `src/utils/versionFetcher.test.ts` - Unit tests with network calls
- 🔜 `src/utils/stringUtils.test.ts` - Pure function tests
- 🔜 `tests/integration/full-workflow.test.ts` - E2E tests

## Contributing

When adding new features:

1. Write tests first (TDD) or alongside the feature
2. Aim for 80%+ coverage on new code
3. Update this guide if you add new patterns
4. Run `deno task test` before committing

---

**Remember**: Tests are documentation. Write them so future contributors can understand what the code does by reading the tests.
