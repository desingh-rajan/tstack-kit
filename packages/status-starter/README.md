# TStack Status Page

A lightweight, self-hosted service status page for TStack workspaces. Monitors
your API, Storefront, and Admin UI services with 90-day uptime history.

## Features

- Real-time health monitoring of all TStack services
- 90-day uptime history with per-day resolution
- Server-rendered HTML (no client-side JS required)
- Deno KV storage (persistent, zero dependencies)
- Auto-refresh every 60 seconds
- Dark theme, responsive design
- JSON API endpoint for programmatic access

## Quick Start

```bash
# Copy environment file
cp .env.example .env

# Edit service URLs
# API_URL=http://localhost:8000
# STOREFRONT_URL=http://localhost:3000
# ADMIN_URL=http://localhost:3001

# Start development server
deno task dev
```

Visit http://localhost:8001 to see the status page.

## Configuration

| Variable                 | Default                 | Description                   |
| ------------------------ | ----------------------- | ----------------------------- |
| `PORT`                   | `8001`                  | Server port                   |
| `CHECK_INTERVAL_SECONDS` | `60`                    | Polling interval in seconds   |
| `CHECK_TIMEOUT_MS`       | `5000`                  | Timeout per health check (ms) |
| `HISTORY_DAYS`           | `90`                    | Days of history to retain     |
| `API_URL`                | `http://localhost:8000` | API service base URL          |
| `STOREFRONT_URL`         | `http://localhost:3000` | Storefront base URL           |
| `ADMIN_URL`              | `http://localhost:3001` | Admin UI base URL             |
| `SITE_TITLE`             | `TStack Status`         | Page title                    |
| `ENVIRONMENT`            | `development`           | Current environment           |

## Endpoints

| Path              | Description                           |
| ----------------- | ------------------------------------- |
| `GET /`           | HTML status page                      |
| `GET /health`     | JSON health check for the status page |
| `GET /api/status` | JSON status data (same as /)          |

## Docker

```bash
docker build -t myapp-status .
docker run -p 8001:8001 \
  -e API_URL=http://sc-api-internal:8000 \
  -e STOREFRONT_URL=http://sc-store:8000 \
  -e ADMIN_URL=http://sc-admin-ui:8000 \
  -e SITE_TITLE="My App Status" \
  myapp-status
```

## How It Works

1. A background poller checks each service's `/health` endpoint at the
   configured interval
2. Results are stored in Deno KV with daily aggregation (uptime %, avg latency)
3. The status page reads from KV and renders server-side HTML
4. Old entries beyond the history window are pruned automatically
5. The page auto-refreshes via `<meta http-equiv="refresh">`

## Tests

```bash
deno task test
```
