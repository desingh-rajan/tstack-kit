# Copilot Instructions for TStack Kit

## Response Style

- No emojis in code, comments, or responses
- Keep output concise and professional
- Use plain text for status indicators (e.g., "Updated", "Done", "Error" instead
  of checkmarks or icons)

## Terminal Output Policy

- NEVER truncate terminal output with `tail`, `head`, `grep`, or any other
  filtering when running tests or commands. Always show the FULL output.
- Do not pipe command output through filters unless the user explicitly asks.
- If output is large, that is fine -- show it all.

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
