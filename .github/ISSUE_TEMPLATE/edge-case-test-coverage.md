---
name: Add Comprehensive Edge Case Test Coverage
about: Improve test coverage for project creation edge cases and error scenarios
title: "[TEST] Add comprehensive edge case and error scenario tests for project creation"
labels: testing, enhancement, good first issue
assignees: ""
---

## Description

The current test suite covers the happy path and basic scenarios for project
creation (API and Admin UI). We need to add comprehensive tests for edge cases,
error handling, and failure scenarios to ensure robustness.

## Current Coverage

✅ **Implemented (41 tests passing):**

- Basic project creation (API and Admin UI)
- Flag combinations (`--latest`, `forceOverwrite`)
- Folder naming (suffix detection, hyphenated names)
- Database setup and metadata tracking
- Template copying and configuration
- Concurrent project types with same base name

## Missing Test Coverage

### 1. Invalid Project Name Validation

- [ ] Project names starting with numbers (e.g., `123-project`)
- [ ] Project names with invalid special characters (e.g., `project@#$`)
- [ ] Empty string as project name
- [ ] Very long names (>255 characters, filesystem limit)
- [ ] Unicode characters and emoji in project names
- [ ] Reserved words or system names (e.g., `CON`, `NUL` on Windows)

### 2. Directory and File System Errors

- [ ] Directory exists but not tracked by CLI (manually created outside tstack)
- [ ] Template path not found (corrupted installation)
- [ ] Disk full scenarios during project creation
- [ ] Permission denied errors (readonly target directory)
- [ ] Concurrent project creation causing race conditions
- [ ] Symbolic link handling in target directory

### 3. Network and Dependency Failures

- [ ] Version fetching failures with `--latest` flag (network offline)
- [ ] JSR/npm registry timeout during version fetch
- [ ] Malformed version responses from registries
- [ ] Partial download failures

### 4. Template and Configuration Errors

- [ ] Malformed `deno.json` in template
- [ ] Missing required files in template directory
- [ ] Corrupted template files
- [ ] Template copy failures (partial file copy, out of space mid-copy)
- [ ] Invalid environment variable format in `.env.example`

### 5. Database-Related Failures (API Projects)

- [ ] PostgreSQL not running when creating API project
- [ ] Database creation failure (insufficient permissions)
- [ ] Database already exists with different owner
- [ ] Invalid database credentials
- [ ] Docker not available when attempting Docker-based setup
- [ ] `sudo` not available or password incorrect

### 6. KV Store and Metadata Errors

- [ ] KV store corruption or unavailable
- [ ] Metadata write failures
- [ ] Inconsistent state recovery (status stuck in "creating")
- [ ] Concurrent metadata updates

### 7. Cleanup and Rollback

- [ ] Failed creation with cleanup verification
- [ ] Partial rollback on error mid-creation
- [ ] forceOverwrite with cleanup of previous artifacts

## Acceptance Criteria

- [ ] All edge cases listed above have corresponding test cases
- [ ] Tests properly handle async errors and timeouts
- [ ] Tests verify error messages are user-friendly
- [ ] Tests clean up resources properly even on failure
- [ ] Test execution time remains reasonable (<10s for full suite)
- [ ] Documentation updated with error handling patterns

## Implementation Notes

**Test Structure:**

- Group tests by category (validation, filesystem, network, etc.)
- Use descriptive test names following pattern:
  `createProject - [scenario]: [expected behavior]`
- Add appropriate `sanitizeResources` and timeout options

**Helper Functions Needed:**

- `mockNetworkFailure()` - Simulate network errors
- `createReadonlyDirectory()` - Setup permission-denied scenarios
- `corruptTemplate()` - Test error recovery from bad templates
- `fillDisk()` - Simulate disk-full conditions (careful with this!)

**Priority:**

1. **High:** Invalid names, filesystem errors, network failures
2. **Medium:** Template errors, database failures
3. **Low:** Edge cases like symbolic links, concurrent operations

## Related Files

- `packages/cli/src/commands/create.test.ts` - Main test file (add TODO
  reference)
- `packages/cli/src/commands/create-admin-ui.test.ts` - Admin UI tests
- `packages/cli/src/commands/creators/base-creator.ts` - Validation logic
- `packages/cli/src/commands/creators/api-creator.ts` - Database logic

## References

- Current test coverage: 41/41 tests passing (happy path only)
- Issue #44: Fresh Admin UI Kit Integration (completed)
- Testing guide: `TESTING.md`
