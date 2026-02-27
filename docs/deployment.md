# Deployment Guide

This guide covers deploying TStack applications to production using Kamal, a
zero-downtime deployment tool from the creators of Ruby on Rails.

## Prerequisites

Before deploying, you need the following set up:

### 1. Server Infrastructure

| Environment | Requirement      | Example                    |
| ----------- | ---------------- | -------------------------- |
| Production  | 1 server with IP | `159.89.162.100`           |
| Staging     | 1 server with IP | `167.71.225.50` (optional) |

**Note:** You can use the same server for both environments, but separate
servers are recommended for isolation.

**Recommended Providers:**

- DigitalOcean Droplets ($6-12/month)
- Hetzner Cloud (2-5 EUR/month)
- AWS EC2 / Lightsail
- Linode
- Vultr

### 2. Domain & DNS Setup

You need a domain with DNS A records pointing to your server IPs.

**Example DNS Configuration (GoDaddy, Cloudflare, Namecheap, etc.):**

| Type | Name    | Value          | TTL |
| ---- | ------- | -------------- | --- |
| A    | @       | 159.89.162.100 | 600 |
| A    | www     | 159.89.162.100 | 600 |
| A    | admin   | 159.89.162.100 | 600 |
| A    | status  | 159.89.162.100 | 600 |
| A    | logs    | 159.89.162.100 | 600 |
| A    | metrics | 159.89.162.100 | 600 |
| A    | staging | 167.71.225.50  | 600 |

All subdomains point to the **same VPS IP**. A single `kamal-proxy` instance
runs on the server, reads the `Host` header of every incoming request, and
routes it to the correct container automatically. You only need one server, one
IP — kamal-proxy handles all routing.

**Full routing picture for a production workspace:**

```
example.com              → sc-store  (kamal-proxy: host=example.com)
example.com/sc-be/*      → sc-api    (kamal-proxy: host=example.com, path_prefix=/sc-be)
admin.example.com        → sc-admin-ui  (kamal-proxy: host=admin.example.com)
status.example.com       → sc-status    (kamal-proxy: host=status.example.com)
logs.example.com         → dozzle       (kamal-proxy: host=logs.example.com)
metrics.example.com      → netdata      (kamal-proxy: host=metrics.example.com)
```

**Why path prefix for API?**

- Fewer DNS records to manage
- Single SSL certificate for main domain
- Simpler CORS configuration (same origin)
- Works better with some CDN setups

**Wait for DNS propagation** (usually 5-30 minutes, can take up to 48 hours).
Verify with:

```bash
dig +short yourdomain.com
# Should return: 159.89.162.100

dig +short status.yourdomain.com
# Should also return: 159.89.162.100
```

### 3. SSH Key Setup

Generate a deployment SSH key (if you don't have one):

```bash
ssh-keygen -t ed25519 -C "deploy@yourdomain.com" -f ~/.ssh/deploy_key
```

Add the public key to your server:

```bash
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@159.89.162.100
```

### 4. GitHub Repository Secrets

In your repository: **Settings > Secrets and variables > Actions**

| Secret           | Value                                  |
| ---------------- | -------------------------------------- |
| `DEPLOY_SSH_KEY` | Contents of `~/.ssh/deploy_key`        |
| `KAMAL_SECRETS`  | Contents of your `.kamal/secrets` file |

### 5. GitHub Environments (Optional but Recommended)

In your repository: **Settings > Environments**

Create environments for deployment protection:

- `your-project-prod` - For production (can require approval)
- `your-project-staging` - For staging

---

## Quick Start: Generate Infrastructure

TStack provides a CLI command to generate all deployment infrastructure:

```bash
tstack infra
```

**Interactive prompts guide you through:**

1. **Docker Registry** - GHCR (default), Docker Hub, or AWS ECR
2. **Domain Name** - Your production domain (e.g., `myapp.com`)
3. **SSH User** - Deployment user (default: `deploy`)
4. **Staging Environment** - Enable staging configuration (y/n)
5. **Database** - Use Kamal Postgres accessory or external DB

**Generated Files:**

- `config/deploy.yml` - Production Kamal configuration
- `config/deploy.staging.yml` - Staging configuration (if enabled)
- `.kamal/secrets` - Environment variables template
- `.kamal/secrets.staging` - Staging secrets template
- `.github/workflows/deploy.yml` - CI/CD pipeline
- `Dockerfile` - Optimized for Deno applications

**Example:**

```bash
$ tstack infra

🚀 Infrastructure Setup
━━━━━━━━━━━━━━━━━━━━━━

Select Docker Registry:
› GHCR (GitHub Container Registry)
  Docker Hub
  AWS ECR

Enter domain name: myapp.com
Enter SSH user [deploy]: deploy
Enable staging environment? (y/n): y
Use Kamal Postgres accessory? (y/n): n

✅ Generated:
   - config/deploy.yml
   - config/deploy.staging.yml
   - .kamal/secrets
   - .kamal/secrets.staging
   - .github/workflows/deploy.yml
   - Dockerfile

📝 Next Steps:
   1. Fill in .kamal/secrets with your credentials
   2. Update config/deploy.yml with server IPs
   3. Commit and push to trigger CI/CD
```

See [CLI Reference](./cli-reference.md#infrastructure-commands) for all options.

---

## Docker Registry Support

TStack supports three Docker registries:

### GHCR (GitHub Container Registry) - Default

Best for GitHub-hosted projects. Uses your GitHub token for authentication.

```yaml
# config/deploy.yml
registry:
  server: ghcr.io
  username:
    - KAMAL_REGISTRY_USERNAME
  password:
    - KAMAL_REGISTRY_PASSWORD
```

**Required secrets:**

- `KAMAL_REGISTRY_USERNAME` - Your GitHub username
- `KAMAL_REGISTRY_PASSWORD` - GitHub Personal Access Token with `write:packages`
  scope

### Docker Hub

For Docker Hub repositories.

```yaml
registry:
  server: docker.io
  username:
    - KAMAL_REGISTRY_USERNAME
  password:
    - KAMAL_REGISTRY_PASSWORD
```

**Required secrets:**

- `KAMAL_REGISTRY_USERNAME` - Docker Hub username
- `KAMAL_REGISTRY_PASSWORD` - Docker Hub access token

### AWS ECR

For Amazon Elastic Container Registry.

```yaml
registry:
  server: <account-id>.dkr.ecr.<region>.amazonaws.com
  username: AWS
  password:
    - KAMAL_REGISTRY_PASSWORD
```

**Required secrets:**

- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `KAMAL_REGISTRY_PASSWORD` - Generated via
  `aws ecr get-login-password --region <region>`

## Server Requirements

### Minimum Specs

- 1 vCPU, 1GB RAM (for single service)
- 2 vCPU, 2GB RAM (recommended for API + DB)
- Ubuntu 22.04 or Debian 12 recommended

### Required Software

Kamal will install Docker automatically, but you need:

1. SSH access with key-based authentication
2. A user with sudo privileges (e.g., `deploy`)

### Setup Deploy User

```bash
# On your server
sudo adduser deploy
sudo usermod -aG sudo deploy

# Add your SSH key
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy nano /home/deploy/.ssh/authorized_keys
# Paste your public key

# Allow passwordless sudo for deploy user (for Docker commands)
echo "deploy ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/deploy
```

## Quick Start

### 1. Generate Infrastructure

```bash
cd your-project
tstack infra
```

Follow the prompts:

- Select registry (GHCR, Docker Hub, or ECR)
- Enter your domain
- Configure staging (optional)
- Set SSH user

### 2. Update Configuration

Edit `config/deploy.yml`:

```yaml
servers:
  web:
    hosts:
      - 123.45.67.89 # Your server IP
```

### 3. Configure Secrets

Edit `.kamal/secrets`:

```bash
# Registry
KAMAL_REGISTRY_USERNAME=your-github-username
KAMAL_REGISTRY_PASSWORD=ghp_xxxxxxxxxxxx

# Application
DATABASE_URL=postgresql://user:pass@localhost:5432/myapp_production
JWT_SECRET=your-super-secret-jwt-key
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

### 4. Add GitHub Secrets

In your GitHub repository, go to **Settings > Secrets and variables > Actions**
and add:

- `DEPLOY_SSH_KEY` - Your deployment SSH private key (full contents of
  `~/.ssh/id_ed25519`)
- `KAMAL_SECRETS` - Full contents of your `.kamal/secrets` file

The workflow writes `KAMAL_SECRETS` to `.kamal/secrets` at deploy time, so all
your environment variables (DATABASE_URL, JWT_SECRET, etc.) are included there.

**Environment Setup:**

Create environments in **Settings > Environments**:

- `your-project-prod` - For production deployments
- `your-project-staging` - For staging deployments (if enabled)

### 5. Install Kamal

```bash
gem install kamal
```

### 6. Deploy

```bash
# First-time setup
kamal setup

# Subsequent deploys
kamal deploy

# Deploy to staging
kamal deploy -d staging
```

## CI/CD with GitHub Actions

The generated `.github/workflows/deploy.yml` handles:

1. **On push to `main`**: Deploy to production
2. **On push to `staging`**: Deploy to staging (if enabled)

### Workflow Triggers

```yaml
on:
  push:
    branches:
      - main
      - staging # if staging enabled
  workflow_dispatch: # manual trigger
```

### Required GitHub Secrets

| Secret           | Description                               |
| ---------------- | ----------------------------------------- |
| `DEPLOY_SSH_KEY` | Full SSH private key for server access    |
| `KAMAL_SECRETS`  | Contents of .kamal/secrets (all env vars) |

**Note:** The workflow uses GitHub Environments for deployment protection.
Create `your-project-prod` and `your-project-staging` environments in your
repository settings.

## Multi-Service Deployment

TStack deploys 3 services to a single server. This section covers the
architecture, configuration, and deployment of all services together.

### Architecture Overview

```
+---------------------------------------------------------------------+
|                         Single VPS Server                           |
|                                                                     |
|  +-------------------------------------------------------------+   |
|  |                      kamal-proxy                             |   |
|  |                   (reverse proxy)                            |   |
|  |                                                              |   |
|  |  Routes:                                                     |   |
|  |  - example.com/*       -> sc-store     (storefront)          |   |
|  |  - example.com/sc-be/* -> sc-api       (API, path_prefix)    |   |
|  |  - admin.example.com/* -> sc-admin-ui  (admin panel)         |   |
|  +-------------------------------------------------------------+   |
|                              |                                      |
|         +--------------------+--------------------+                 |
|         v                    v                    v                 |
|  +-------------+     +-------------+     +-------------+           |
|  |  sc-store   |     |   sc-api    |     |sc-admin-ui  |           |
|  |   :8000     |     |   :8000     |     |   :8000     |           |
|  +-------------+     +-------------+     +-------------+           |
|                                                                     |
+---------------------------------------------------------------------+
```

### Path Prefix Routing

When multiple services share the same domain, you need path-based routing:

- `example.com/` -> Storefront
- `example.com/sc-be/api/*` -> API Backend

Configure path_prefix in the API service's deploy.yml:

```yaml
# sc-api/config/deploy.yml
proxy:
  host: example.com
  app_port: 8000
  ssl: true
  healthcheck:
    path: /health
    interval: 3
  path_prefix: /sc-be # Routes example.com/sc-be/* to this service
```

**How it works:**

1. Request comes in: `https://example.com/sc-be/api/products`
2. kamal-proxy matches the `/sc-be` prefix
3. Strips the prefix and forwards: `http://sc-api:8000/api/products`
4. API receives clean path without prefix

**API routes must NOT include the prefix:**

```typescript
// WRONG - Don't include path_prefix in your routes
app.get("/sc-be/api/products", handler);

// CORRECT - Routes are relative to the service
app.get("/api/products", handler);
```

**Health check path is also relative to the service:**

```yaml
proxy:
  healthcheck:
    path: /health # Actual path on the service
# kamal-proxy calls: http://container:8000/health
# NOT: http://container:8000/sc-be/health
```

### Environment Variables for Different Contexts

The API service itself does not know about the proxy prefix. But the frontend
needs the full public URL (with path_prefix) for client-side API calls, OAuth
redirect URLs, and CORS configuration.

```yaml
# sc-api/config/deploy.yml
env:
  clear:
    PORT: "8000"
    APP_URL: https://example.com/sc-be
    STOREFRONT_URL: https://example.com
    ADMIN_URL: https://admin.example.com
```

```yaml
# sc-store/config/deploy.yml
env:
  clear:
    API_URL: https://example.com/sc-be/api
    API_BASE_URL: https://example.com/sc-be/api
    # Internal URL (no prefix needed - direct container access)
    API_INTERNAL_URL: http://sc-api-internal:8000
```

### OAuth Redirect URLs

Google OAuth needs exact redirect URLs, including the path prefix:

```
Authorized redirect URIs (Google Cloud Console):
- https://example.com/sc-be/auth/google/callback
- https://admin.example.com/auth/callback
- http://localhost:8000/auth/google/callback (development)
```

```yaml
# sc-api/config/deploy.yml
env:
  clear:
    APP_URL: https://example.com/sc-be
    GOOGLE_CALLBACK_URL: https://example.com/sc-be/auth/google/callback
```

### Subdomain vs Path Routing

**Option A: Subdomain Routing (simpler config, more DNS records)**

```yaml
# Each service gets its own subdomain
# api.example.com -> sc-api
# admin.example.com -> sc-admin-ui
# example.com -> sc-store

# sc-api/config/deploy.yml
proxy:
  host: api.example.com
  # No path_prefix needed
```

Pros: Simpler configuration, no path stripping. Cons: Requires wildcard SSL or
multiple certs, more DNS records.

**Option B: Path Routing (our approach - single domain + single SSL cert)**

```yaml
# Single domain with path prefixes
# example.com/sc-be/* -> sc-api
# example.com/* -> sc-store

# sc-api/config/deploy.yml
proxy:
  host: example.com
  path_prefix: /sc-be
```

Pros: Single domain, single SSL cert, simpler DNS. Cons: More complex proxy
config, must handle prefix correctly.

### Service Discovery and Internal Networking

Services need to communicate. Going through the public internet is slow (~10ms).
Docker network aliases provide direct container access (~1ms).

```yaml
# sc-api/config/deploy.yml
servers:
  web:
    hosts:
      - YOUR_SERVER_IP
    options:
      network-alias: sc-api-internal # Stable internal DNS name
```

Other services can then reach the API directly:

```yaml
# sc-store/config/deploy.yml
env:
  clear:
    API_INTERNAL_URL: http://sc-api-internal:8000
```

```typescript
// In storefront SSR code:
// WRONG - External URL for SSR (slow, ~10ms round trip)
const api = "https://example.com/sc-be/api";

// CORRECT - Internal URL for SSR (fast, ~1ms)
const api = Deno.env.get("API_INTERNAL_URL") || "http://sc-api-internal:8000";
```

### Complete deploy.yml Templates

**API Service:**

```yaml
# sc-api/config/deploy.yml
service: sc-api
image: youruser/sc-api

servers:
  web:
    hosts:
      - YOUR_SERVER_IP
    options:
      network-alias: sc-api-internal

proxy:
  host: example.com
  app_port: 8000
  ssl: true
  healthcheck:
    path: /health
    interval: 3
  path_prefix: /sc-be

registry:
  username: youruser
  password:
    - KAMAL_REGISTRY_PASSWORD

builder:
  arch: amd64
  cache:
    type: registry
    image: youruser/sc-api-build-cache

env:
  clear:
    PORT: "8000"
    NODE_ENV: production
    APP_URL: https://example.com/sc-be
    STOREFRONT_URL: https://example.com
  secret:
    - DATABASE_URL
    - JWT_SECRET
    - GOOGLE_CLIENT_ID
    - GOOGLE_CLIENT_SECRET

accessories:
  postgres:
    image: postgres:16
    host: YOUR_SERVER_IP
    port: "127.0.0.1:5432:5432"
    env:
      secret:
        - POSTGRES_PASSWORD
      clear:
        POSTGRES_USER: sc_user
        POSTGRES_DB: sc_api_production
    directories:
      - data:/var/lib/postgresql/data
    options:
      network-alias: sc-api-postgres
```

**Storefront Service:**

```yaml
# sc-store/config/deploy.yml
service: sc-store
image: youruser/sc-store

servers:
  web:
    hosts:
      - YOUR_SERVER_IP

proxy:
  host: example.com
  app_port: 8000
  ssl: true
  healthcheck:
    path: /health
    interval: 10
    timeout: 60

registry:
  username: youruser
  password:
    - KAMAL_REGISTRY_PASSWORD

builder:
  arch: amd64
  cache:
    type: registry
    image: youruser/sc-store-build-cache

env:
  clear:
    PORT: "8000"
    NODE_ENV: production
    API_URL: https://example.com/sc-be/api
    API_BASE_URL: https://example.com/sc-be/api
    API_INTERNAL_URL: http://sc-api-internal:8000
  secret:
    - SESSION_SECRET
```

**Admin Panel (Subdomain):**

```yaml
# sc-admin-ui/config/deploy.yml
service: sc-admin-ui
image: youruser/sc-admin-ui

servers:
  web:
    hosts:
      - YOUR_SERVER_IP

proxy:
  host: admin.example.com # Subdomain, no path_prefix
  app_port: 8000
  ssl: true
  healthcheck:
    path: /health
    interval: 10
    timeout: 60

env:
  clear:
    PORT: "8000"
    NODE_ENV: production
    API_URL: https://example.com/sc-be/api
    API_BASE_URL: https://example.com/sc-be/api
    API_INTERNAL_URL: http://sc-api-internal:8000
```

### Deployment Order

Deploy in this order (the API creates network aliases and accessories first):

```bash
# 1. API (creates network-alias and accessories)
cd sc-api && kamal setup    # First time only
cd sc-api && kamal deploy

# 2. Storefront (uses API internal URL)
cd sc-store && kamal deploy

# 3. Admin UI (uses API internal URL)
cd sc-admin-ui && kamal deploy
```

### Multi-Service Pitfalls

**1. Health check fails with path_prefix:**

```yaml
# WRONG
healthcheck:
  path: /sc-be/health # Proxy already strips prefix!

# CORRECT
healthcheck:
  path: /health
```

**2. API routes include prefix:**

```typescript
// WRONG
router.get("/sc-be/api/users", handler);

// CORRECT
router.get("/api/users", handler);
```

**3. Frontend uses wrong API URL internally:**

```typescript
// WRONG - External URL for SSR
const api = "https://example.com/sc-be/api";

// CORRECT - Internal URL for SSR
const api = process.env.API_INTERNAL_URL || "http://sc-api-internal:8000";
```

**4. OAuth callback URL mismatch:**

```
Google Console: https://example.com/auth/callback
Actual URL:     https://example.com/sc-be/auth/callback
                                    ^^^^^^
                                    Missing prefix!
```

---

## Common Commands

```bash
# Deploy to production
kamal deploy

# Deploy to staging
kamal deploy -d staging

# View logs
kamal app logs

# View container status
kamal app containers

# SSH into container
kamal app exec -i bash

# Rollback to previous version
kamal rollback

# Run database migrations
kamal app exec "deno task db:migrate"

# View Traefik logs (proxy)
kamal traefik logs
```

## Troubleshooting

### SSH Connection Issues

```bash
# Test SSH connection
ssh -i ~/.ssh/id_ed25519 deploy@your-server

# Check SSH agent
ssh-add -l

# Verify key permissions
chmod 600 ~/.ssh/id_ed25519
```

### Docker Login Failures

```bash
# For GHCR - verify token has write:packages scope
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# For ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

### Health Check Failures

Check your health endpoint:

```bash
# API projects
curl http://localhost:8000/health

# UI projects
curl http://localhost:3000/
```

Ensure your Dockerfile has the correct healthcheck:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD deno eval "try { const res = await fetch('http://localhost:8000/health'); Deno.exit(res.ok ? 0 : 1); } catch { Deno.exit(1); }"
```

### Proxy/Traefik Issues

```bash
# Check Traefik logs
kamal traefik logs

# Restart Traefik
kamal traefik reboot

# Check routing rules
kamal traefik details
```

### Database Connection Issues

```bash
# Verify database URL
kamal app exec 'echo $DATABASE_URL'

# Test connection from container
kamal app exec "deno eval \"const client = new Deno.createHttpClient({});...\""
```

## Database Accessory

For projects without external database hosting, Kamal can manage a Postgres
container:

```yaml
# config/deploy.yml
accessories:
  postgres:
    image: postgres:16-alpine
    host: <your-server-ip>
    port: "127.0.0.1:5432:5432"
    env:
      clear:
        POSTGRES_DB: myapp_production
      secret:
        - POSTGRES_USER
        - POSTGRES_PASSWORD
    directories:
      - data:/var/lib/postgresql/data
    options:
      memory: 512m
```

**Important**: Back up your database regularly! The accessory data persists on
the host, but you should have off-site backups.

## SSL Certificates

Kamal uses Traefik with Let's Encrypt for automatic SSL:

```yaml
# In deploy.yml
servers:
  web:
    labels:
      traefik.http.routers.myapp-secure.tls: true
      traefik.http.routers.myapp-secure.tls.certresolver: letsencrypt
```

Certificates are automatically obtained and renewed.

## Zero-Downtime Deployments

Kamal provides zero-downtime deployments by:

1. Building the new image
2. Starting new containers
3. Waiting for health checks
4. Switching traffic to new containers
5. Stopping old containers

The `retain_containers: 2` setting keeps 2 previous versions for quick rollback.

## Multi-Region Deployment

For multi-region setup, create separate deploy files:

```yaml
# config/deploy.us.yml
servers:
  web:
    hosts:
      - us-server-ip

# config/deploy.eu.yml
servers:
  web:
    hosts:
      - eu-server-ip
```

Deploy to each region:

```bash
kamal deploy -d us
kamal deploy -d eu
```

## Resource Limits

Set memory limits in deploy.yml:

```yaml
servers:
  web:
    options:
      memory: 500m # Limit to 500MB RAM
```

## Status Starter — Production Deployment

The status page (`sc-status`) is a standalone Hono service. It runs as a full
Kamal **service** (not an accessory) so kamal-proxy handles SSL and subdomain
routing automatically.

### DNS

Add an A record for `status.example.com` pointing to the same VPS IP (see
[Domain & DNS Setup](#2-domain--dns-setup) above).

### deploy.yml

```yaml
# sc-status/config/deploy.yml
service: sc-status
image: youruser/sc-status

servers:
  web:
    hosts:
      - YOUR_SERVER_IP
    options:
      # Same Docker network as other services so the status page
      # reaches them via their network-alias without going through
      # the public internet or kamal-proxy
      network: kamal

proxy:
  host: status.example.com # DNS A record must exist
  app_port: 8001
  ssl: true
  healthcheck:
    path: /health
    interval: 10

registry:
  username: youruser
  password:
    - KAMAL_REGISTRY_PASSWORD

builder:
  arch: amd64

env:
  clear:
    PORT: "8001"
    ENVIRONMENT: production
    CHECK_INTERVAL_SECONDS: "60"
    CHECK_TIMEOUT_MS: "5000"
    HISTORY_DAYS: "90"
    SITE_TITLE: "My App Status"
    # Reach other services via Docker internal network aliases
    # (bypasses kamal-proxy — direct container-to-container)
    API_URL: http://sc-api-internal:8000
    STOREFRONT_URL: http://sc-store-internal:8000
    ADMIN_URL: http://sc-admin-internal:8000
  secret:
    - DOZZLE_USERNAME # not required, but keep env consistent
```

> **Important**: `API_URL`, `STOREFRONT_URL`, and `ADMIN_URL` use Docker
> internal network aliases — NOT the public hostnames. This means the status
> page hits `/health` directly on each container without going through SSL or
> the reverse proxy. It is faster, more reliable, and works even if the public
> proxy is overloaded.

### Deno KV persistence

Deno KV stores data on the container filesystem by default. To persist uptime
history across deployments, mount a volume:

```yaml
# Add to the service definition above:
volumes:
  - sc-status-data:/home/deno/.deno/kv
```

### Deploy

```bash
# First deploy
kamal deploy -d sc-status

# Subsequent deployments
kamal deploy
```

### Access

- Status page: `https://status.example.com`
- JSON API: `https://status.example.com/api/status`
- Health check: `https://status.example.com/health`

---

## Dozzle — Docker Log Viewer

[Dozzle](https://dozzle.dev) is a lightweight, real-time Docker log viewer. It
runs as a Kamal **service** (not an accessory) so that kamal-proxy can route
`logs.example.com` to it with automatic SSL — the same way it handles all other
services.

> **Why not an accessory?** Kamal accessories don't go through kamal-proxy, so
> they can't get subdomain routing or SSL automatically. Running Dozzle as a
> full service gives it a proper `proxy:` stanza and full kamal-proxy
> integration.

### DNS

Add an A record for `logs.example.com` pointing to the same VPS IP (see
[Domain & DNS Setup](#2-domain--dns-setup) above).

### deploy.yml

Create a minimal `config/deploy.yml` in whichever repo manages accessories
(typically `sc-api`), or create a standalone `sc-logs/` directory:

```yaml
# sc-api/config/deploy.yml  — add alongside existing services, OR
# sc-logs/config/deploy.yml — standalone directory

service: sc-dozzle
image: amir20/dozzle:latest

servers:
  web:
    hosts:
      - YOUR_SERVER_IP
    labels:
      # Dozzle needs access to the Docker socket
      com.centurylinklabs.watchtower.enable: "false"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

proxy:
  host: logs.example.com # DNS A record must exist
  app_port: 8080 # Dozzle's default internal port
  ssl: true
  healthcheck:
    path: /healthcheck # Dozzle's built-in health endpoint
    interval: 10

registry:
  # Dozzle is pulled from Docker Hub — no private registry needed
  server: registry-1.docker.io
  username: ""
  password: []

builder:
  # No build step — pulling a public image directly
  driver: remote
  remote:
    arch: amd64

env:
  clear:
    DOZZLE_BASE: / # Serve at root of logs.example.com
    DOZZLE_NO_ANALYTICS: "1" # Opt out of usage analytics
    DOZZLE_AUTH_PROVIDER: simple
  secret:
    - DOZZLE_USERNAME # e.g. DOZZLE_USERNAME=admin
    - DOZZLE_PASSWORD # e.g. DOZZLE_PASSWORD=your-secret
```

### Required secrets

Add these to your `.env` (passed via `kamal secrets`):

```bash
DOZZLE_USERNAME=admin
DOZZLE_PASSWORD=your-long-random-password
```

### Deploy and start

```bash
# First deploy
kamal deploy

# Restart after config changes
kamal app restart
```

### Access

- `https://logs.example.com` — protected by username/password

Dozzle has read-only access via the Docker socket (`:ro`). It can tail logs and
inspect container states but cannot exec into containers or start/stop services.

> **Security note**: `DOZZLE_USERNAME` and `DOZZLE_PASSWORD` enable Dozzle's
> built-in simple auth. Never expose Dozzle without authentication. The Docker
> socket is mounted read-only.

---

## Netdata — Container & Host Metrics

[Netdata](https://netdata.cloud) is a zero-configuration, real-time metrics
dashboard. It auto-discovers every running Docker container and exposes host
metrics (CPU, RAM, disk I/O, network) with no instrumentation required in your
app code. Like Dozzle for logs, Netdata is deployed as a Kamal **service** so
that kamal-proxy can route `metrics.example.com` to it with automatic SSL.

> **Why not an accessory?** Kamal accessories don't go through kamal-proxy, so
> they can't get subdomain routing or SSL automatically. Running Netdata as a
> full service gives it a proper `proxy:` stanza and full kamal-proxy
> integration.

### DNS

Add an A record for `metrics.example.com` pointing to the same VPS IP (see
[Domain & DNS Setup](#2-domain--dns-setup) above).

### deploy.yml

Create a minimal `config/deploy.yml` in whichever repo manages accessories
(typically `sc-api`), or create a standalone `sc-metrics/` directory:

```yaml
# sc-api/config/deploy.yml  — add alongside existing services, OR
# sc-metrics/config/deploy.yml — standalone directory

service: sc-netdata
image: netdata/netdata:stable

servers:
  web:
    hosts:
      - YOUR_SERVER_IP
    volumes:
      - /proc:/host/proc:ro # Host process metrics
      - /sys:/host/sys:ro # Host system metrics
      - /var/run/docker.sock:/var/run/docker.sock:ro # Container discovery
      - /etc/passwd:/host/etc/passwd:ro # Username resolution
      - netdata_lib:/var/lib/netdata
      - netdata_cache:/var/cache/netdata

proxy:
  host: metrics.example.com # DNS A record must exist
  app_port: 19999 # Netdata's default internal port
  ssl: true
  healthcheck:
    path: /api/v1/info # Netdata's built-in health endpoint
    interval: 10

registry:
  # Netdata is pulled from Docker Hub — no private registry needed
  server: registry-1.docker.io
  username: ""
  password: []

builder:
  # No build step — pulling a public image directly
  driver: remote
  remote:
    arch: amd64

env:
  clear:
    NETDATA_EXTRA_DEB_PACKAGES: "" # No extra packages needed
  secret:
    - NETDATA_CLAIM_TOKEN # Optional: link to Netdata Cloud for multi-VPS view
    - NETDATA_CLAIM_ROOMS # Optional: Netdata Cloud room ID
```

### Named volumes

Netdata requires persistent storage to retain metric history across restarts.
Declare these volumes on the server before first deploy:

```bash
docker volume create netdata_lib
docker volume create netdata_cache
```

### Required secrets

Add these to your `.env` (passed via `kamal secrets`). Both are optional —
Netdata runs fully without them (local only):

```bash
NETDATA_CLAIM_TOKEN=your-netdata-cloud-claim-token  # optional
NETDATA_CLAIM_ROOMS=your-room-id                    # optional
```

To get a claim token: sign up at [app.netdata.cloud](https://app.netdata.cloud)
→ Space → Connect Nodes.

### Deploy and start

```bash
# First deploy
kamal deploy

# Restart after config changes
kamal app restart
```

### Access

- `https://metrics.example.com` — Netdata dashboard, no login required by
  default (restrict access via firewall or add an auth proxy if needed)

Netdata has read-only access to host metrics and the Docker socket (`:ro`). It
cannot exec into containers or modify any system state.

> **Security note**: Netdata's dashboard has no built-in auth by default.
> Restrict `metrics.example.com` to trusted IPs via your firewall, or place a
> basic-auth reverse proxy in front. Never expose raw Netdata to the public
> internet without protection.

### What Netdata monitors automatically

No app-side instrumentation needed. Out of the box:

- **Host**: CPU, RAM, disk I/O, network traffic, system load
- **Docker containers**: per-container CPU, memory, network, disk — all
  auto-discovered from the Docker socket
- **PostgreSQL**: if the `pg` plugin is enabled (auto-detected when Postgres is
  running on the host)
- **Redis**: auto-detected and monitored with no config

### Scaling to multiple VPS

When you grow beyond a single server, each VPS gets its own Netdata agent
deployed with the same `deploy.yml` pattern. To aggregate all agents into one
dashboard, two options:

1. **Netdata Cloud (free tier)** — add `NETDATA_CLAIM_TOKEN` and
   `NETDATA_CLAIM_ROOMS` to each agent's secrets. All nodes appear in one
   Netdata Cloud dashboard at `app.netdata.cloud`. No extra VPS needed.

2. **Self-hosted parent** — designate one VPS as the Netdata parent. Agents on
   app servers stream metrics to it via `stream.conf`. The parent's
   `metrics.example.com` shows all nodes in a single UI.

For the current single-VPS setup, neither is required — the standalone agent at
`metrics.example.com` covers everything.

## Further Reading

- [Kamal Documentation](https://kamal-deploy.org)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/guidelines/)
