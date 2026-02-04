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
| A    | staging | 167.71.225.50  | 600 |

**Multi-Service Setup (API, Admin, Store on same server):**

TStack uses a **path prefix** approach for the API instead of subdomains:

```
yourdomain.com              → Store/Frontend
yourdomain.com/ts-be/api/*  → API (path prefix, no separate DNS)
admin.yourdomain.com        → Admin UI
```

This means:

- **Store**: `https://yourdomain.com`
- **API**: `https://yourdomain.com/ts-be/api/health`, `/ts-be/api/auth/login`,
  etc.
- **Admin**: `https://admin.yourdomain.com`

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

## Overview

TStack provides a CLI command to generate all deployment infrastructure:

```bash
tstack infra
```

This creates:

- `config/deploy.yml` - Kamal production configuration
- `config/deploy.staging.yml` - Kamal staging configuration (optional)
- `.kamal/secrets` - Secrets template
- `.github/workflows/deploy.yml` - CI/CD workflow
- `Dockerfile` - Optimized for Deno applications

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

## Further Reading

- [Kamal Documentation](https://kamal-deploy.org)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/guidelines/)
