# TStack-Kit Implementation TODO List

**Date:** November 23, 2025  
**Issues:** #42, #45, #44  
**Priority Order:** Issue #42 → Issue #45 → Issue #44

---

## 📋 Pre-Implementation Setup

### ✅ Setup & Preparation

- [ ] Create `ts-ground/` folder at project root for testing workspace
- [ ] Add `ts-ground/` to `.gitignore`
- [ ] Copy `/home/desingh/projects/test-projects/blog-v1` → `reference-kit/blog-v1`
- [ ] Copy `/home/desingh/projects/test-projects/blog-v1-ui` → `reference-kit/blog-v1-ui`
- [ ] Add `reference-kit/` to `.gitignore` (temporary reference, will be removed after implementation)
- [ ] Update CLI test commands to use `ts-ground/` instead of `tmp/` or `projects/`

---

## 🎯 Issue #42: TStack Workspace - Multi-Project Namespace Management

### Phase 1: Core Workspace Structure (Priority: CRITICAL)

- [ ] Create `packages/cli/src/commands/workspace.ts` - Main workspace command file
- [ ] Implement `tstack workspace create <name>` command
  - [ ] Validate workspace name (lowercase, alphanumeric, hyphens only)
  - [ ] Create workspace root directory
  - [ ] Create `.tstack/` metadata folder
  - [ ] Generate `.tstack/config.yaml` with workspace configuration
  - [ ] Generate `.tstack/README.md` with workspace overview
- [ ] Add support for component flags:
  - [ ] `--with-api` - Creates `<workspace>-api/` with TStack starter
  - [ ] `--with-ui` - Creates `<workspace>-ui/` (placeholder for now, Issue #44)
  - [ ] `--with-infra` - Creates `<workspace>-infra/` (basic docker-compose)
  - [ ] `--with-mobile` - Creates `<workspace>-mobile/` (placeholder)
  - [ ] `--with-admin` - Creates `<workspace>-admin/` (placeholder)
- [ ] Implement namespace management
  - [ ] Auto-generate namespace from workspace name
  - [ ] Support custom namespace with `--namespace=<name>`
  - [ ] Apply namespace to all sub-projects

### Phase 2: Git Integration - Local Repositories

- [ ] Implement Git initialization for each project
  - [ ] Run `git init` in each project folder
  - [ ] Set default branch to `main`
  - [ ] Generate appropriate `.gitignore` per project type
    - [ ] API project: `.env`, `*.db`, `node_modules/`, `dist/`
    - [ ] UI project: `node_modules/`, `.next/`, `dist/`, `.env.local`
    - [ ] Infra project: `.terraform/`, `*.tfstate`, `.env`
  - [ ] Create initial commit with message: "Initial commit: TStack project scaffolding"
- [ ] Handle existing Git repos gracefully (skip if `.git/` exists)

### Phase 3: Remote Repository Creation (GitHub Integration)

- [ ] Create `src/utils/githubClient.ts` - GitHub API wrapper
  - [ ] Implement authentication with `GITHUB_TOKEN`
  - [ ] Implement `createRepo()` method
  - [ ] Support personal accounts and organizations
  - [ ] Handle errors (repo exists, auth failure, rate limits)
- [ ] Add command flags for remote creation:
  - [ ] `--create-remote` - Enable remote repository creation
  - [ ] `--github-org=<name>` - Target GitHub organization
  - [ ] `--github-token=<token>` - GitHub PAT (or use env var)
  - [ ] `--visibility=<private|public>` - Repository visibility
  - [ ] `--push` - Push initial commit after creation
- [ ] Implement remote repository workflow:
  - [ ] Create repo via GitHub API
  - [ ] Add remote URL: `git remote add origin <url>`
  - [ ] Push initial commit: `git push -u origin main`
- [ ] Environment variable support:
  - [ ] `GITHUB_TOKEN` - Personal Access Token
  - [ ] `GITHUB_ORG` - Default organization name
  - [ ] `GITHUB_VISIBILITY` - Default visibility (private/public)

### Phase 4: Testing & Documentation

- [ ] Create unit tests:
  - [ ] Test workspace structure creation
  - [ ] Test namespace validation
  - [ ] Test component flag combinations
  - [ ] Test `.tstack/config.yaml` generation
- [ ] Create integration tests:
  - [ ] Test Git initialization
  - [ ] Test `.gitignore` generation
  - [ ] Test initial commit creation
  - [ ] Test remote creation (mocked GitHub API)
- [ ] Update documentation:
  - [ ] Update main README with workspace feature
  - [ ] Create `WORKSPACE.md` guide with examples
  - [ ] Document GitHub API setup and token creation
  - [ ] Add troubleshooting section
- [ ] Test in `ts-ground/`:
  - [ ] Create test workspace: `tstack workspace create test-client --with-api`
  - [ ] Verify structure, Git, and metadata
  - [ ] Clean up after testing

---

## 🔥 Issue #45: Backend Refactoring - BaseService & BaseController

### Phase 1: Core Infrastructure (Priority: CRITICAL)

- [ ] Analyze reference implementations:
  - [ ] Study `reference-kit/blog-v1/` controller/service patterns
  - [ ] Document current code duplication percentage
  - [ ] Identify reusable patterns
- [ ] Create `packages/starter/src/shared/services/base.service.ts`
  - [ ] Implement `BaseService<T, CreateDTO, UpdateDTO, ResponseDTO>` abstract class
  - [ ] Implement CRUD methods:
    - [ ] `getAll(): Promise<ResponseDTO[]>`
    - [ ] `getById(id: number): Promise<ResponseDTO | null>`
    - [ ] `create(data: CreateDTO): Promise<ResponseDTO>`
    - [ ] `update(id: number, data: UpdateDTO): Promise<ResponseDTO | null>`
    - [ ] `delete(id: number): Promise<boolean>`
  - [ ] Add lifecycle hooks:
    - [ ] `beforeCreate?(data: CreateDTO): Promise<CreateDTO>`
    - [ ] `afterCreate?(result: ResponseDTO): Promise<ResponseDTO>`
    - [ ] `beforeUpdate?(id: number, data: UpdateDTO): Promise<UpdateDTO>`
    - [ ] `afterUpdate?(result: ResponseDTO): Promise<ResponseDTO>`
  - [ ] Add full TypeScript generic support with constraints
- [ ] Create `packages/starter/src/shared/controllers/base.controller.ts`
  - [ ] Implement `BaseController<ServiceType>` abstract class
  - [ ] Implement handler methods:
    - [ ] `getAll(c: Context): Promise<Response>`
    - [ ] `getById(c: Context): Promise<Response>`
    - [ ] `create(c: Context): Promise<Response>`
    - [ ] `update(c: Context): Promise<Response>`
    - [ ] `delete(c: Context): Promise<Response>`
  - [ ] Add utility methods:
    - [ ] `parseId(c: Context): number`
    - [ ] `abstract validateCreate(data: unknown): any`
    - [ ] `abstract validateUpdate(data: unknown): any`
  - [ ] Integrate with existing error handling (`NotFoundError`, `BadRequestError`, etc.)
  - [ ] Integrate with `ApiResponse.success()` wrapper
- [ ] Create `packages/starter/src/shared/routes/factory.ts`
  - [ ] Implement `RouteFactory.createCRUD()` method
  - [ ] Support middleware injection per route
  - [ ] Generate standard REST routes: GET, POST, PUT, DELETE
  - [ ] Return configured Hono router instance

### Phase 2: Migrate Existing Entities (Reference-Driven)

- [ ] Refactor Article entity (if exists in starter):
  - [ ] Update `article.service.ts` to extend `BaseService`
  - [ ] Update `article.controller.ts` to extend `BaseController`
  - [ ] Update `article.route.ts` to use `RouteFactory`
  - [ ] Verify all tests pass
  - [ ] Measure code reduction (before/after line count)
- [ ] Refactor SiteSetting entity (if exists in starter):
  - [ ] Update `site-setting.service.ts` to extend `BaseService`
  - [ ] Update `site-setting.controller.ts` to extend `BaseController`
  - [ ] Update `site-setting.route.ts` to use `RouteFactory`
  - [ ] Verify all tests pass
- [ ] Refactor Auth entities:
  - [ ] Review `auth.service.ts` and `auth.controller.ts`
  - [ ] Apply base patterns where applicable (may need custom overrides)
- [ ] Review `reference-kit/blog-v1/` for additional refactoring insights
  - [ ] Identify any missed patterns
  - [ ] Document custom implementations that deviate from base pattern

### Phase 3: Update CLI Scaffold Templates

- [ ] Update `packages/cli/src/templates/service.ts`
  - [ ] Generate service extending `BaseService`
  - [ ] Include only custom logic and overrides
  - [ ] Add example lifecycle hook usage (commented out)
  - [ ] Reduce from ~172 lines to ~25 lines
- [ ] Update `packages/cli/src/templates/controller.ts`
  - [ ] Generate controller extending `BaseController`
  - [ ] Implement required abstract methods (`validateCreate`, `validateUpdate`)
  - [ ] Add example override for authorization (commented out)
  - [ ] Reduce from ~157 lines to ~30 lines
- [ ] Update `packages/cli/src/templates/route.ts`
  - [ ] Use `RouteFactory.createCRUD()` instead of manual route registration
  - [ ] Include middleware configuration example
  - [ ] Reduce from ~35 lines to ~10 lines
- [ ] Update all template tests to match new patterns

### Phase 4: Testing & Documentation

- [ ] Create unit tests for base classes:
  - [ ] Test `BaseService` CRUD operations (with mocked database)
  - [ ] Test lifecycle hooks execution order
  - [ ] Test `BaseController` request/response handling
  - [ ] Test `RouteFactory` route generation
- [ ] Create integration tests:
  - [ ] Scaffold new entity with CLI in `ts-ground/`
  - [ ] Verify generated code extends base classes
  - [ ] Test CRUD operations end-to-end
  - [ ] Verify 80%+ code reduction achieved
- [ ] Update documentation:
  - [ ] Create `BASE_PATTERNS.md` explaining architecture
  - [ ] Update starter README with base class usage
  - [ ] Add migration guide for existing projects
  - [ ] Document when to override base methods vs use lifecycle hooks
- [ ] Code quality verification:
  - [ ] Run all existing tests - ensure 100% pass
  - [ ] Measure code reduction (quantify 85% claim)
  - [ ] Check for any regressions in functionality

---

## 🎨 Issue #44: Fresh Admin UI Kit Integration

### Phase 1: Copy & Setup Fresh Admin UI

- [ ] Study reference implementation:
  - [ ] Analyze `reference-kit/blog-v1-ui/` structure
  - [ ] Review DRY patterns and config-driven CRUD system
  - [ ] Read `DRY_ADMIN_ARCHITECTURE.md` and `FRESH_UI_SCAFFOLD_PATTERN.md` (if exists)
  - [ ] Document entity config system
- [ ] Create `packages/admin-ui/` directory structure
  - [ ] Copy entire `blog-v1-ui` contents to `packages/admin-ui/`
  - [ ] Clean up example entities (keep as templates/examples)
  - [ ] Update `deno.json` for workspace context
  - [ ] Update `README.md` with TStack integration context
- [ ] Update all imports and references:
  - [ ] Replace project-specific paths with generic paths
  - [ ] Update API endpoint configurations
  - [ ] Ensure all dependencies are in `deno.json`
- [ ] Verify Fresh Admin UI runs standalone:
  - [ ] `cd packages/admin-ui && deno task dev`
  - [ ] Test in browser at `http://localhost:5173`
  - [ ] Verify all generic components work (DataTable, GenericForm, ShowPage)

### Phase 2: Entity Configuration System

- [ ] Create entity config template:
  - [ ] Define `EntityConfig<T>` TypeScript interface
  - [ ] Document field types (string, number, boolean, date, select, json, etc.)
  - [ ] Create example config: `config/entities/example.config.ts`
- [ ] Create generic CRUD handlers:
  - [ ] `createCRUDHandlers(config: EntityConfig)` utility
  - [ ] Auto-generate index/list handler
  - [ ] Auto-generate show/detail handler
  - [ ] Auto-generate create handler
  - [ ] Auto-generate edit/update handler
  - [ ] Auto-generate delete handler
- [ ] Document entity config schema:
  - [ ] `name`, `singularName`, `pluralName`
  - [ ] `apiPath` - backend API endpoint
  - [ ] `fields` array - field configurations
  - [ ] `service` - API service layer
  - [ ] Field rendering options (`render` function, `showInList`, `showInForm`, etc.)

### Phase 3: CLI Integration - Admin UI Scaffolding

- [ ] Update `packages/cli/src/commands/scaffold.ts`
  - [ ] Add `--skip-admin-ui` flag (default: false, includes admin UI by default)
  - [ ] When admin UI not skipped:
    - [ ] Generate `packages/admin-ui/config/entities/<entity>.config.ts`
    - [ ] Generate 4 CRUD route files in `packages/admin-ui/routes/admin/<entity>/`:
      - [ ] `index.tsx` - List page
      - [ ] `[id].tsx` - Show/detail page
      - [ ] `new.tsx` - Create form page
      - [ ] `[id]/edit.tsx` - Edit form page
  - [ ] Copy templates from admin-ui package or create in CLI templates
- [ ] Create new command: `tstack ui-scaffold <entity>`
  - [ ] Scaffold admin UI only (for existing backend entities)
  - [ ] Generate entity config
  - [ ] Generate CRUD routes
  - [ ] Check if backend entity exists, warn if not
- [ ] Update CLI templates:
  - [ ] Create `packages/cli/src/templates/admin-entity-config.ts`
  - [ ] Create `packages/cli/src/templates/admin-route-index.ts`
  - [ ] Create `packages/cli/src/templates/admin-route-show.ts`
  - [ ] Create `packages/cli/src/templates/admin-route-new.ts`
  - [ ] Create `packages/cli/src/templates/admin-route-edit.ts`

### Phase 4: Backend Integration

- [ ] Document backend API requirements:
  - [ ] Expected response format:

    ```json
    {
      "status": "success",
      "message": "Items retrieved successfully",
      "data": [...],
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "total": 100,
        "totalPages": 5
      }
    }
    ```

  - [ ] Pagination query params: `?page=1&pageSize=20`
  - [ ] Sorting query params: `?sortBy=createdAt&sortOrder=desc`
- [ ] Update `BaseController` (from Issue #45) to support admin UI format:
  - [ ] Add pagination support to `getAll()` method
  - [ ] Parse and apply query params (`page`, `pageSize`, `sortBy`, `sortOrder`)
  - [ ] Return standardized response format
- [ ] Add auth integration:
  - [ ] JWT token in HttpOnly cookies
  - [ ] Fresh middleware for auth validation
  - [ ] Role-based access (superadmin/admin only)

### Phase 5: Docker Support

- [ ] Create `packages/admin-ui/Dockerfile` (production)
  - [ ] Alpine-based Fresh build
  - [ ] Multi-stage build for optimization
  - [ ] Serve on port 3000
- [ ] Create `packages/admin-ui/Dockerfile.dev` (development)
  - [ ] Hot reload enabled
  - [ ] Mount source code as volume
  - [ ] Serve on port 5173
- [ ] Create `packages/admin-ui/Dockerfile.test` (testing)
  - [ ] Test environment with Fresh
  - [ ] Run unit and integration tests
- [ ] Update root `docker-compose.yml`:
  - [ ] Add `admin-ui` service
  - [ ] Map ports: `5173:5173` (dev), `3000:3000` (prod)
  - [ ] Set `VITE_API_URL` environment variable
  - [ ] Link to backend API service

### Phase 6: Documentation & Examples

- [ ] Create `packages/admin-ui/README.md`
  - [ ] Installation and setup
  - [ ] Quick start guide
  - [ ] Entity config examples
  - [ ] Customization guide
- [ ] Create `packages/admin-ui/ARCHITECTURE.md`
  - [ ] Explain config-driven CRUD philosophy
  - [ ] Document component architecture
  - [ ] Explain generic vs custom components
- [ ] Create `packages/admin-ui/SCAFFOLDING.md`
  - [ ] Step-by-step: Add new entity to admin UI
  - [ ] CLI scaffolding workflow
  - [ ] Manual setup (without CLI)
- [ ] Create example: "Adding Products Entity"
  - [ ] Backend setup (model, service, controller)
  - [ ] Admin UI config creation
  - [ ] CRUD route generation
  - [ ] Customization examples

### Phase 7: Testing

- [ ] Unit tests:
  - [ ] Test entity config parsing
  - [ ] Test CRUD handler generation
  - [ ] Test generic components (DataTable, GenericForm, ShowPage)
- [ ] Integration tests:
  - [ ] Scaffold new entity with CLI
  - [ ] Verify admin UI routes generated
  - [ ] Test CRUD operations (create, read, update, delete)
  - [ ] Test pagination, sorting, filtering
- [ ] End-to-end tests:
  - [ ] Start backend + admin-ui in `ts-ground/`
  - [ ] Login to admin UI
  - [ ] Perform CRUD operations via UI
  - [ ] Verify data in backend database
- [ ] Docker tests:
  - [ ] Build production Docker image
  - [ ] Start with docker-compose
  - [ ] Verify services communicate correctly

---

## 🧪 Post-Implementation Testing & Cleanup

### Final Verification in `ts-ground/`

- [ ] Create complete test workspace:

  ```bash
  tstack workspace create test-app --with-api --with-ui
  cd test-app
  ```

- [ ] Test backend scaffolding with new base patterns:

  ```bash
  tstack scaffold products
  deno task migrate:generate
  deno task migrate:run
  ```

- [ ] Verify admin UI scaffolding:
  - [ ] Check `packages/admin-ui/config/entities/products.config.ts` generated
  - [ ] Check CRUD routes in `packages/admin-ui/routes/admin/products/`
- [ ] Start services:

  ```bash
  docker-compose up -d
  ```

- [ ] Test end-to-end:
  - [ ] Backend API: `http://localhost:8000/products`
  - [ ] Admin UI: `http://localhost:3000/admin/products`
  - [ ] Perform CRUD operations
- [ ] Run all tests:

  ```bash
  deno task test           # Backend tests
  cd packages/admin-ui && deno task test  # Admin UI tests
  ```

### Test Coverage Verification

- [ ] Ensure 100% test coverage for:
  - [ ] New workspace command
  - [ ] Base service and controller
  - [ ] Admin UI config system
  - [ ] CLI scaffolding (all templates)
- [ ] Review and update existing tests if needed
- [ ] Add missing tests for any uncovered features

### Documentation Update

- [ ] Update main `README.md` with new features
- [ ] Update `DEVELOPER_NOTES.md` with architecture changes
- [ ] Update `TESTING.md` with new test patterns (BDD for API tests, Deno.test for internal)
- [ ] Create migration guide for existing projects

### Cleanup

- [ ] Review `reference-kit/` folder
  - [ ] Confirm all patterns extracted and implemented
  - [ ] Delete `reference-kit/` folder
- [ ] Clean up `ts-ground/` test files
  - [ ] Keep `ts-ground/` folder in `.gitignore`
  - [ ] Document its purpose in main README

---

## 📊 Success Criteria Checklist

### Issue #42 - Workspace Management

- [ ] ✅ `tstack workspace create <name>` command works
- [ ] ✅ Workspace structure with `.tstack/config.yaml` created
- [ ] ✅ Component flags (`--with-api`, `--with-ui`, etc.) functional
- [ ] ✅ Git repos initialized with proper `.gitignore`
- [ ] ✅ Initial commits created
- [ ] ✅ Remote repo creation via GitHub API works (with `--create-remote`)
- [ ] ✅ Comprehensive test suite passes (unit + integration + e2e)
- [ ] ✅ Documentation complete with examples

### Issue #45 - Backend Refactoring

- [ ] ✅ `BaseService` and `BaseController` implemented
- [ ] ✅ At least 2 entities migrated successfully
- [ ] ✅ CLI generates new base pattern templates
- [ ] ✅ 80%+ code reduction achieved per entity
- [ ] ✅ All existing tests pass
- [ ] ✅ Full TypeScript generic support
- [ ] ✅ Documentation updated with new patterns

### Issue #44 - Fresh Admin UI

- [ ] ✅ `packages/admin-ui/` integrated into TStack
- [ ] ✅ Entity config system documented
- [ ] ✅ `tstack scaffold <entity>` auto-generates admin UI (by default)
- [ ] ✅ `tstack scaffold <entity> --skip-admin-ui` skips UI scaffolding
- [ ] ✅ `tstack ui-scaffold <entity>` adds UI to existing entity
- [ ] ✅ Admin UI connects to backend API successfully
- [ ] ✅ Docker support complete (Dockerfile + docker-compose)
- [ ] ✅ End-to-end testing passes (backend + admin-ui)
- [ ] ✅ Documentation complete with step-by-step examples

### Overall Quality

- [ ] ✅ 100% test coverage for new features
- [ ] ✅ All tests pass (API tests use BDD style, internal tools use Deno.test)
- [ ] ✅ No breaking changes to existing functionality
- [ ] ✅ `ts-ground/` folder works as testing workspace
- [ ] ✅ All three issues closed successfully

---

## 📝 Notes & Questions for Review

### Clarifications Needed

1. **Workspace Monorepo Structure:** Issue #42 mentions "monorepo structure" - should all components be in one Git repo or separate repos?
   - **Current assumption:** Each component (`<workspace>-api`, `<workspace>-ui`) is a separate Git repo within the workspace folder

2. **Admin UI Framework:** Issue #44 mentions Fresh 2.2.0 - should we pin this version or use latest?
   - **Current assumption:** Use versions from `blog-v1-ui` reference project

3. **Backend Response Format:** Should we enforce the admin UI response format globally or only for admin endpoints?
   - **Current assumption:** Admin-specific endpoints follow admin UI format, public API can have different format

4. **Test Pattern Consistency:** Confirm BDD (describe/it) for API tests only, Deno.test for all internal utils/services?
   - **Current assumption:** Yes, as stated in requirement #7

5. **Reference Kit Removal:** When exactly should we remove `reference-kit/` folder?
   - **Current assumption:** After all three issues are implemented and verified

### Implementation Priorities

- **CRITICAL:** Issue #45 (BaseService/BaseController) - blocks efficient Issue #44 implementation
- **HIGH:** Issue #42 (Workspace) - independent, can be done in parallel
- **HIGH:** Issue #44 (Admin UI) - depends on Issue #45 backend patterns

### Suggested Order (if doing sequentially)

1. Issue #42 (Workspace) - 1 day
2. Issue #45 (Refactoring) - 2 days  
3. Issue #44 (Admin UI) - 2-3 days

---

**Ready to start implementation? Please review and approve this plan before I proceed!** ✅
