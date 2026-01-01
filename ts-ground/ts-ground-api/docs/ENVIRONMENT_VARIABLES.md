# Environment Variables Reference

Complete reference for all environment variables used in TStack API.

---

## Quick Setup

```bash
# Copy example and edit
cp .env.example .env.development.local

# Generate secure JWT secret
openssl rand -hex 64

# Generate secure passwords
openssl rand -base64 32
```

---

## Core Configuration

| Variable          | Required | Default                 | Description                         |
| ----------------- | -------- | ----------------------- | ----------------------------------- |
| `ENVIRONMENT`     | Yes      | `development`           | `development`, `test`, `production` |
| `PORT`            | No       | `8000`                  | API server port                     |
| `DATABASE_URL`    | Yes      | -                       | PostgreSQL connection string        |
| `ALLOWED_ORIGINS` | No       | `http://localhost:3000` | CORS origins (comma-separated)      |
| `LOG_LEVEL`       | No       | `info`                  | `debug`, `info`, `warn`, `error`    |

**Database URL Format:**

```
postgresql://user:password@host:port/database
```

---

## URL Configuration

| Variable         | Required | Default                 | Description                            |
| ---------------- | -------- | ----------------------- | -------------------------------------- |
| `APP_URL`        | No       | `http://localhost:8000` | API/backend URL                        |
| `STOREFRONT_URL` | No       | `http://localhost:5174` | Customer-facing site (for email links) |
| `ADMIN_URL`      | No       | `http://localhost:5173` | Admin dashboard URL                    |

---

## JWT Authentication

| Variable     | Required | Default     | Description                          |
| ------------ | -------- | ----------- | ------------------------------------ |
| `JWT_SECRET` | Yes      | -           | Secret for signing tokens            |
| `JWT_ISSUER` | No       | `tonystack` | Token issuer claim                   |
| `JWT_EXPIRY` | No       | `7d`        | Token expiration (`1h`, `7d`, `30d`) |

**Generate JWT Secret:**

```bash
openssl rand -hex 64
```

---

## User Credentials

| Variable              | Required | Description            |
| --------------------- | -------- | ---------------------- |
| `SUPERADMIN_EMAIL`    | Yes      | Initial admin email    |
| `SUPERADMIN_PASSWORD` | Yes      | Initial admin password |
| `ALPHA_EMAIL`         | No       | Test user email        |
| `ALPHA_PASSWORD`      | No       | Test user password     |
| `ALPHA_USERNAME`      | No       | Test user display name |

---

## Email Configuration

The system auto-detects provider. Set `EMAIL_PROVIDER` to override: `resend`,
`ses`, `smtp`, `auto`

### Common Variables

| Variable         | Required | Description                 |
| ---------------- | -------- | --------------------------- |
| `EMAIL_FROM`     | Yes      | Sender email address        |
| `EMAIL_REPLY_TO` | No       | Reply-to address            |
| `APP_NAME`       | No       | App name in email templates |
| `SUPPORT_EMAIL`  | No       | Support email in templates  |

### Option 1: Resend (Recommended)

Simplest setup. Free tier: 100 emails/day.

| Variable         | Value                   | How to Get                          |
| ---------------- | ----------------------- | ----------------------------------- |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx`       | [resend.com](https://resend.com)    |
| `EMAIL_FROM`     | `onboarding@resend.dev` | For testing (or verify your domain) |

### Option 2: AWS SES

| Variable                | Description                                 |
| ----------------------- | ------------------------------------------- |
| `SES_ACCESS_KEY_ID`     | AWS access key (or `AWS_ACCESS_KEY_ID`)     |
| `SES_SECRET_ACCESS_KEY` | AWS secret key (or `AWS_SECRET_ACCESS_KEY`) |
| `AWS_REGION`            | SES region (default: `us-east-1`)           |
| `EMAIL_FROM`            | Must be verified in SES console             |

### Option 3: SMTP

| Variable    | Gmail            | SendGrid            | Mailgun             |
| ----------- | ---------------- | ------------------- | ------------------- |
| `SMTP_HOST` | `smtp.gmail.com` | `smtp.sendgrid.net` | `smtp.mailgun.org`  |
| `SMTP_PORT` | `587`            | `587`               | `587`               |
| `SMTP_USER` | Your email       | `apikey`            | `postmaster@domain` |
| `SMTP_PASS` | App Password     | API key             | Password            |

**Gmail App Password:**

1. Enable 2FA: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords

---

## Razorpay (Payments)

| Variable                  | Required | Description                               |
| ------------------------- | -------- | ----------------------------------------- |
| `RAZORPAY_KEY_ID`         | Yes      | API Key ID (`rzp_test_*` or `rzp_live_*`) |
| `RAZORPAY_KEY_SECRET`     | Yes      | API Key Secret                            |
| `RAZORPAY_WEBHOOK_SECRET` | No       | Webhook signature verification            |

**Get Keys:**

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Settings > API Keys
3. Generate Test/Live keys

**Test Mode:** Keys start with `rzp_test_` **Live Mode:** Keys start with
`rzp_live_`

---

## Google OAuth

| Variable               | Required | Description                                              |
| ---------------------- | -------- | -------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Yes      | OAuth Client ID                                          |
| `GOOGLE_CLIENT_SECRET` | Yes      | OAuth Client Secret                                      |
| `GOOGLE_CALLBACK_URL`  | No       | Callback URL (default: `{APP_URL}/auth/google/callback`) |

**Setup:**

1. Go to
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Add redirect URI: `http://localhost:8000/auth/google/callback`

---

## AWS S3 (File Uploads)

| Variable                | Required | Default      | Description                         |
| ----------------------- | -------- | ------------ | ----------------------------------- |
| `AWS_ACCESS_KEY_ID`     | Yes      | -            | AWS access key                      |
| `AWS_SECRET_ACCESS_KEY` | Yes      | -            | AWS secret key                      |
| `AWS_REGION`            | No       | `ap-south-1` | AWS region                          |
| `S3_BUCKET_NAME`        | Yes      | -            | Bucket name                         |
| `S3_PREFIX`             | No       | -            | Path prefix (e.g., `myproject/dev`) |

**Bucket Setup for Public Images:**

1. S3 > Bucket > Permissions > Block public access
2. Uncheck "Block all public access"
3. Save

---

## Environment-Specific Files

| File                     | Environment | Commit to Git?   |
| ------------------------ | ----------- | ---------------- |
| `.env.development.local` | Development | Yes (no secrets) |
| `.env.test.local`        | Testing     | Yes              |
| `.env.production.local`  | Production  | NO               |
| `.env.example`           | Reference   | Yes              |

**Loading Priority:**

1. System environment variables
2. `.env.{ENVIRONMENT}.local`
3. `.env`

---

## Example .env.development.local

```bash
# Core
ENVIRONMENT=development
PORT=8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/ts_ground_dev
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174

# JWT
JWT_SECRET=your-64-char-hex-secret-here
JWT_ISSUER=tonystack
JWT_EXPIRY=7d

# URLs
APP_URL=http://localhost:8000
STOREFRONT_URL=http://localhost:5174
ADMIN_URL=http://localhost:5173

# Users
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=your-secure-password

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev

# Razorpay (Test)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx

# S3 (Optional)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# S3_BUCKET_NAME=
```

---

## Security Checklist

- [ ] Never commit `.env` or `.env.production.local`
- [ ] Use `openssl rand -hex 64` for JWT_SECRET
- [ ] Use `openssl rand -base64 32` for passwords
- [ ] Use test keys (`rzp_test_*`) in development
- [ ] Rotate secrets regularly
- [ ] Different credentials per environment
