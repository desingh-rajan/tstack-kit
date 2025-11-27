# Copilot Instructions for TStack Kit

## Response Style

- No emojis in code, comments, or responses
- Keep output concise and professional
- Use plain text for status indicators (e.g., "Updated", "Done", "Error" instead
  of checkmarks or icons)

## Code Standards

- Follow existing patterns in the codebase
- Use TypeScript strict mode conventions
- Prefer Deno standard library imports from JSR

## Architecture Context

- This is a multi-service starter kit, NOT a monorepo
- `packages/cli` is the CLI tool (future: JSR as @tonystack/cli once polished)
- `packages/api-starter` and `packages/admin-ui-starter` are templates copied to
  user projects
- `packages/admin` is independently versioned and published to JSR as
  @tstack/admin
- Root `deno.json` version is the kit release version
