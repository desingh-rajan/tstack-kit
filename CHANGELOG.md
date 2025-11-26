# Changelog

All notable changes to TStack Kit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.1] - 2025-11-26

### Added

- GitHub Actions CI workflow with parallel test jobs (CLI, API Starter, Admin)
- PostgreSQL 16 service containers for integration testing
- Deno caching for faster CI builds
- Lint and format checking in CI

### Changed

- Streamlined README from 1100+ lines to ~340 lines
- Added admin-ui project structure documentation
- Added AI cost savings calculation section
- Clarified that JWT auth is included by default (not optional)
- Removed `.github/` from gitignore to enable CI

---

## [1.2.0] - 2025-11-26

### Highlights

Major feature release introducing the **Admin UI Starter** package, complete
workspace management with GitHub integration, and significant improvements to
the CLI and API starter templates.

### Added

#### Admin UI Starter (New Package)

- Fresh 2.2.0 admin panel framework with DaisyUI 5.5.5 and Preact
- Config-driven CRUD system - define entity once, get complete CRUD for free
- Generic `DataTable`, `ShowPage`, and `GenericForm` components
- Auto-generated admin routes from entity configurations
- Rails ActiveAdmin-style architecture
- Full authentication integration with JWT
- Responsive design with DaisyUI themes

#### Workspace Management

- `tstack create workspace <name>` - Create full-stack workspaces with API +
  Admin UI
- `tstack destroy workspace <name>` - Clean destruction of entire workspaces
- GitHub Integration - Auto-create repos with `--github-org` flag
- Deno KV Project Tracking - Track all projects with status lifecycle
  (active/destroyed)
- `tstack list` - List all tracked projects with status, type, and path
- `--status` filter - Filter list by project status (`active`, `destroyed`,
  `all`)

#### CLI Rebrand and UX

- Rebranded to TStack CLI with colorful banner and clickable links
- Improved logging with better visual hierarchy
- Version display in banner (`TStack CLI v1.2.0`)

#### Base Abstractions Pattern

- `BaseController` - Generic CRUD controller with auth, pagination, search, sort
- `BaseService` - Generic service layer with Drizzle ORM integration
- Route factories - `createPublicRoutes()` and `createAdminRoutes()` for quick
  setup
- Reduces boilerplate by ~70% for new entities

#### Auto-Sidebar Updates

- `tstack scaffold <entity>` now automatically updates sidebar menu
- Adds new entity links to `components/layout/Sidebar.tsx`

### Fixed

#### CLI

- Fixed workspace destroy path resolution - Folders now properly deleted when
  running from different directories (relative vs absolute path fix)
- Fixed project filtering - Destroyed projects no longer appear in `tstack list`
  by default
- Fixed database cleanup patterns - Test databases now match exact patterns to
  avoid accidental deletion
- Renamed `TONYSTACK_TEST_DB` to `TSTACK_TEST_DB` - Consistent naming

#### API Starter

- Fixed migrations strategy - Template now ships WITHOUT migrations; developers
  generate their own
- Fixed test database cleanup - Auto-generated migrations are tracked and
  cleaned up properly
- Skip database operations for admin-ui - No DB drops when destroying admin-ui
  projects

#### Tests

- Trustworthy tests - Use `destroyProject` properly, keep destroyed entries for
  tracking
- Test isolation - Each test uses unique temp directories and databases

### Changed (Breaking)

#### Package Rename

- `packages/starter` renamed to `packages/api-starter` - Import paths changed
- Update any references from `@tonystack/starter` to `@tonystack/api-starter`

#### Migrations Strategy

- API Starter no longer ships with pre-generated migrations
- After creating a project, run:

  ```bash
  deno task migrate:generate
  deno task migrate:run
  ```

- This allows developers to modify schemas before generating migrations

#### Environment Variables

- `TONYSTACK_TEST_DB` renamed to `TSTACK_TEST_DB`
- `TONYSTACK_TEST_GITHUB` renamed to `TSTACK_TEST_GITHUB`

#### CLI Commands

- Deprecated commands removed (cleanup of legacy code)
- `tstack create` now requires explicit type or workspace flag

### Package Versions

| Package                       | Version | Notes                               |
| ----------------------------- | ------- | ----------------------------------- |
| `@tonystack/cli`              | 1.2.0   | CLI tool                            |
| `@tonystack/api-starter`      | 1.2.0   | API template (renamed from starter) |
| `@tonystack/admin-ui-starter` | 1.2.0   | NEW - Admin UI template             |
| `@tstack/admin`               | 2.0.1   | ORM/Core (independent versioning)   |

### Known Issues

- **Deno Formatter Corruption** - VS Code's `formatOnSave` with Deno formatter
  can corrupt test files containing multi-line `assertEquals()` calls.
  Workaround: Disable `formatOnSave` for `*.test.ts` files. See
  [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)
- **GitHub Integration** - Requires `GITHUB_TOKEN` or `GH_TOKEN` environment
  variable. Organization repos require appropriate permissions.

### Upgrade Guide

From v1.1.x:

1. Update CLI:

   ```bash
   deno install -gArf jsr:@tonystack/cli
   ```

2. For existing projects using starter template:
   - No action needed - existing projects continue to work
   - New projects will use the updated `api-starter` template

3. For new workspaces with Admin UI:

   ```bash
   tstack create workspace my-app --with-admin-ui
   ```

4. Environment variable rename (if using tests):
   - Rename `TONYSTACK_TEST_DB` to `TSTACK_TEST_DB`
   - Rename `TONYSTACK_TEST_GITHUB` to `TSTACK_TEST_GITHUB`

---

## [1.1.3] - 2025-11-20

Previous stable release. See
[GitHub Compare](https://github.com/desingh-rajan/tstack-kit/compare/v1.1.3...v1.2.0)
for full diff.

---

[1.2.1]: https://github.com/desingh-rajan/tstack-kit/releases/tag/v1.2.1
[1.2.0]: https://github.com/desingh-rajan/tstack-kit/releases/tag/v1.2.0
[1.1.3]: https://github.com/desingh-rajan/tstack-kit/releases/tag/v1.1.3
