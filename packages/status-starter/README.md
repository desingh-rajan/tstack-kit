# TStack Status Page

A lightweight, self-hosted service status page for TStack workspaces. Monitors
your API, Storefront, and Admin UI services with 90-day uptime history.

## Features

- Real-time health monitoring of all TStack services
- 90-day uptime history with per-day resolution bar chart
- Dark **and** light theme with toggle (preference saved in localStorage)
- Server-rendered HTML — no JavaScript frameworks, no build step
- Deno KV storage — persistent, zero extra dependencies
- Auto-refresh every 60 seconds
- JSON API endpoint (`/api/status`) for programmatic access
- Per-service configurable health check paths
- Works locally (Vite dev ports) and in production (Docker internal network)

## Quick Start

```bash
# Copy environment file and edit service URLs
cp .env.example .env

# Start development server (loads .env automatically)
deno task dev
```

Visit **<http://localhost:8001>** to see the status page.

## Configuration

| Variable                 | Default                 | Description                            |
| ------------------------ | ----------------------- | -------------------------------------- |
| `PORT`                   | `8001`                  | Server port                            |
| `CHECK_INTERVAL_SECONDS` | `60`                    | Polling interval in seconds            |
| `CHECK_TIMEOUT_MS`       | `5000`                  | Timeout per health check (ms)          |
| `HISTORY_DAYS`           | `90`                    | Days of history to retain              |
| `API_URL`                | `http://localhost:8000` | API service base URL                   |
| `STOREFRONT_URL`         | `http://localhost:5173` | Storefront base URL (Vite dev default) |
| `ADMIN_URL`              | `http://localhost:5174` | Admin UI base URL (Vite dev default)   |
| `API_HEALTH_PATH`        | `/health`               | Health check path for the API          |
| `STOREFRONT_HEALTH_PATH` | `/health`               | Health check path for the Storefront   |
| `ADMIN_HEALTH_PATH`      | `/health`               | Health check path for the Admin UI     |
| `SITE_TITLE`             | `TStack Status`         | Page title                             |
| `ENVIRONMENT`            | `development`           | Current environment                    |

### Local vs Production URLs

**Local development** (Vite dev servers):

```env
API_URL=http://localhost:8000
STOREFRONT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```

**Production** (Docker internal network — status page reaches services directly,
bypassing kamal-proxy):

```env
API_URL=http://myapp-api-internal:8000
STOREFRONT_URL=http://myapp-store-internal:8000
ADMIN_URL=http://myapp-admin-internal:8000
```

The `network-alias` values come from your `deploy.yml`. See
[docs/deployment.md](../../docs/deployment.md) for the full Kamal multi-service
guide.

## Endpoints

| Path              | Description                           |
| ----------------- | ------------------------------------- |
| `GET /`           | HTML status page                      |
| `GET /health`     | JSON health check for the status page |
| `GET /api/status` | JSON status data for all services     |

## Docker

```bash
docker build -t myapp-status .
docker run -p 8001:8001 \
  -e API_URL=http://sc-api-internal:8000 \
  -e STOREFRONT_URL=http://sc-store-internal:8000 \
  -e ADMIN_URL=http://sc-admin-internal:8000 \
  -e SITE_TITLE="My App Status" \
  myapp-status
```

## How It Works

1. A background poller checks each service's health endpoint at the configured
   interval
2. Results are stored in Deno KV with daily aggregation (uptime %, checks count)
3. The status page reads from KV and renders server-side HTML — no framework
4. Old entries beyond the history window are pruned automatically
5. The page auto-refreshes via `<meta http-equiv="refresh">`
6. Theme is toggled client-side and persisted in `localStorage`

## Tests

```bash
deno task test
```
