# Environment Configuration Guide

TonyStack uses environment-specific configuration files for better separation
between development, testing, and production environments.

## Quick Start

## Security: User Credentials Setup

### For Development (Default)

```bash
# Option 1: Use the development env file (recommended)
cp .env.development.local .env

# Option 2: Copy from example
cp .env.example .env

# Start development server
deno task dev
```

### For Testing

```bash
# Setup test database
deno task test:reset

# Run tests
deno task test
```

### For Production

```bash
# Copy and configure production env
cp .env.production.local .env.production.local
# Edit .env.production.local with real credentials

# Set ENVIRONMENT and start
ENVIRONMENT=production deno task start
```

## Environment Files

### `.env.development.local`

- Used automatically when `ENVIRONMENT=development` (default)
- Contains development database and local service configs
- Safe to commit (no real secrets)

### `.env.test.local`

- Used automatically when `ENVIRONMENT=test`
- Separate test database (`*_test_db`)
- Tests run on port 8001 to avoid conflicts
- Isolated from development data

### `.env.production.local`

- Used when `ENVIRONMENT=production`
- **NEVER commit this file** - contains real secrets
- Must configure with actual production credentials

### `.env.example`

- Generic environment file
- Loaded if no environment-specific file exists
- Not committed to git

## Configuration Priority

Environment variables are loaded in this order (highest to lowest priority):

1. **System environment variables** (e.g., set in shell or CI/CD)
2. **`.env.{ENVIRONMENT}.local`** (environment-specific file)
3. **`.env`** (fallback generic file)

Example:

```bash
# This will use .env.test.local
ENVIRONMENT=test deno task dev

# This will use .env.production.local
ENVIRONMENT=production deno task start
```

## Database Setup Per Environment

### Development Database

```bash
# Database: project_name_dev
# Created automatically by tstack create

deno task migrate:run
deno task db:seed  # If using --with-auth
deno task dev
```

### Test Database

```bash
# Database: project_name_test
# Separate from development to prevent data pollution

deno task test:reset    # Creates db + runs migrations
deno task test          # Runs tests
```

### Production Database

```bash
# Database: project_name_prod
# Configure in .env.production.local
# Use managed database service (not local PostgreSQL)

ENVIRONMENT=production deno task migrate:run
ENVIRONMENT=production deno task start
```

## Security Best Practices

### Development

- [SUCCESS] Use `.env.development.local` with safe defaults
- [SUCCESS] Commit `.env.development.local` to git
- [SUCCESS] Share same dev config across team

### Test

- [SUCCESS] Use `.env.test.local` with test-specific config
- [SUCCESS] Commit `.env.test.local` to git
- [SUCCESS] Separate test database from development

### Production

- [ERROR] **NEVER** commit `.env.production.local`
- [SUCCESS] Use strong random secrets (e.g., `openssl rand -hex 64`)
- [SUCCESS] Use environment variables in CI/CD instead of files
- [SUCCESS] Rotate secrets regularly
- [SUCCESS] Use different credentials for each environment
- [SUCCESS] Use managed database services (not local PostgreSQL)

## Environment Variables Reference

### Required

- `ENVIRONMENT` - Environment mode (development, test, production)
- `PORT` - Server port (default: 8000)
- `DATABASE_URL` - PostgreSQL connection string
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)

### Authentication (if using --with-auth)

- `JWT_SECRET` - Secret key for JWT signing (must be strong in production)
- `JWT_ISSUER` - JWT issuer claim (default: tonystack)
- `JWT_EXPIRY` - Token expiration time (default: 7d)

### Optional

- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `EMAIL_SERVICE_API_KEY` - Email service credentials
- `S3_BUCKET_NAME` - S3 bucket for file uploads
- `S3_ACCESS_KEY` - S3 access credentials
- `S3_SECRET_KEY` - S3 secret credentials

## Testing Workflow

```bash
# 1. Reset test database (drops + creates + migrates)
deno task test:reset

# 2. Run all tests
deno task test

# 3. Run specific test file
ENVIRONMENT=test deno test --allow-all tests/articles.test.ts

# 4. Run tests with coverage
ENVIRONMENT=test deno test --allow-all --coverage=coverage tests/
deno coverage coverage/
```

## Common Issues

### "DATABASE_URL environment variable is required"

- Make sure you have created the appropriate `.env` file
- Check that `ENVIRONMENT` matches your env file (e.g., `test` →
  `.env.test.local`)
- Verify the env file contains `DATABASE_URL`

### Tests fail with "relation does not exist"

- Run migrations on test database: `deno task test:migrate`
- Or reset test database: `deno task test:reset`

### Port already in use

- Development uses port 8000
- Tests use port 8001
- Make sure no other processes are using these ports

### Authentication not working

- Check `JWT_SECRET` is set in your env file
- Verify you ran `deno task db:seed` to create superadmin
- Make sure `jose` is in `deno.json` imports

## CI/CD Integration

### GitHub Actions Example

```yaml
env:
  ENVIRONMENT: test
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
  JWT_SECRET: test-secret-for-ci

steps:
  - name: Setup Test Database
    run: deno task test:reset

  - name: Run Tests
    run: deno task test
```

### Using System Environment Variables

```bash
# Override any config with system env vars
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export JWT_SECRET="my-secret-key"
deno task dev
```

System environment variables take highest priority and override env files.
