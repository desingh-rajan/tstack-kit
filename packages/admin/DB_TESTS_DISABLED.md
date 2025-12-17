# Database Tests Temporarily Disabled

## Status: DISABLED

The following test files have been renamed to `.disabled` due to hanging issues
with Deno 2.6.x and postgres.js:

- `src/orm/drizzle.test.ts` -> `drizzle.test.ts.disabled`
- `src/framework/hono.test.ts` -> `hono.test.ts.disabled`

## Problem Description

Tests hang indefinitely after database operations complete. The test process
never exits because postgres.js connections are not properly closed.

### Root Cause

In Deno 2.x, `globalThis.addEventListener("unload", ...)` no longer fires
reliably, which was the previous mechanism for cleanup. The postgres.js library
keeps connections open, preventing the test process from exiting.

## What Was Tried

1. Adding cleanup tests with explicit `sql.end()` calls
2. Using `sanitizeResources: false` and `sanitizeOps: false`
3. Running cleanup scripts after tests
4. Using `--trace-leaks` flag
5. Exporting sql connections for external cleanup

## Tests Still Running

- `src/core/pagination.test.ts` - Pure logic tests, no DB required (22 tests)

## To Re-enable Database Tests

Potential solutions to investigate:

1. **Use connection pool with timeout**

   ```typescript
   const sql = postgres(connectionString, {
     max: 1,
     idle_timeout: 1,
     connect_timeout: 10,
   });
   ```

2. **Use Deno's built-in postgres driver** instead of postgres.js

3. **Restructure tests** to use `beforeAll`/`afterAll` with proper lifecycle

4. **Mock the database layer** instead of using real connections for unit tests

## Date Disabled

December 17, 2025

## Deno Version

2.6.1
