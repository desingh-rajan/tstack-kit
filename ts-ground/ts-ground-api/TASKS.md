# Deno Tasks Reference

Quick reference for all available `deno task` commands.

## Development

| Task     | Description                      |
| -------- | -------------------------------- |
| `dev`    | Start dev server with hot reload |
| `start`  | Start production server          |
| `routes` | List all registered API routes   |

## Database

| Task          | Description                             |
| ------------- | --------------------------------------- |
| `db:create`   | Create PostgreSQL database              |
| `db:migrate`  | Run pending migrations                  |
| `db:generate` | Generate migrations from schema changes |
| `db:seed`     | Seed all default data                   |
| `db:studio`   | Open Drizzle Studio (database GUI)      |

> **Aliases**: `migrate:run` and `migrate:generate` also work for backward
> compatibility.

## Testing

| Task         | Description                                   |
| ------------ | --------------------------------------------- |
| `test`       | Run full test suite (setup + tests + cleanup) |
| `test:watch` | Run tests in watch mode                       |

## Code Quality

| Task    | Description                   |
| ------- | ----------------------------- |
| `check` | Verify formatting and linting |
| `fmt`   | Format code                   |
| `lint`  | Lint code                     |

## First Time Setup

```bash
deno task setup    # Runs db:migrate + db:seed
```

Or step by step:

```bash
deno task db:create    # Create database (if needed)
deno task db:migrate   # Run migrations
deno task db:seed      # Seed initial data
deno task dev          # Start development
```
