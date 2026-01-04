# Environment Configuration Guide

TonyStack uses environment-specific configuration files for better separation
between development, testing, and production environments.

## Quick Start

```bash
# 1. Copy the example file to your local dev config
cp .env.example .env.development.local

# 2. Generate secure secrets
openssl rand -hex 64  # for JWT_SECRET
openssl rand -base64 32 # for passwords

# 3. Edit .env.development.local with your keys
nano .env.development.local
```

---

## Environment Variables Reference

### 1. Core Configuration (Required)

| Variable       | Description                                    | Example                                        |
| :------------- | :--------------------------------------------- | :--------------------------------------------- |
| `ENVIRONMENT`  | Run mode (`development`, `test`, `production`) | `development`                                  |
| `PORT`         | Server port                                    | `8000`                                         |
| `DATABASE_URL` | PostgreSQL connection string                   | `postgresql://postgres:pass@localhost:5432/db` |
| `JWT_SECRET`   | Secret for signing tokens (HS256)              | `openssl rand -hex 64` output                  |
| `APP_URL`      | Public URL of this API                         | `http://localhost:8000`                        |

### 2. User Credentials (Required for Seeding)

| Variable              | Description            |
| :-------------------- | :--------------------- |
| `SUPERADMIN_EMAIL`    | Initial admin email    |
| `SUPERADMIN_PASSWORD` | Initial admin password |
| `ALPHA_EMAIL`         | Test user email        |
| `ALPHA_PASSWORD`      | Test user password     |

### 3. Google OAuth 2.0 (Auth)

Get credentials from [Google Cloud Console](https://console.cloud.google.com/).

| Variable               | Description                                      |
| :--------------------- | :----------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | OAuth Client ID                                  |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret                              |
| `GOOGLE_CALLBACK_URL`  | `http://localhost:8000/api/auth/google/callback` |

### 4. Razorpay (Payments)

Get keys from [Razorpay Dashboard](https://dashboard.razorpay.com/).

| Variable                  | Description                           | Note                                   |
| :------------------------ | :------------------------------------ | :------------------------------------- |
| `RAZORPAY_KEY_ID`         | API Key ID                            | Starts with `rzp_test_` or `rzp_live_` |
| `RAZORPAY_KEY_SECRET`     | API Key Secret                        |                                        |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification secret | Required for payment confirmation      |

### 5. Email Service (Transactional)

The system supports **Resend** (recommended) or **AWS SES**.

**Option A: Resend (Simpler)**

| Variable         | Description                                   |
| :--------------- | :-------------------------------------------- |
| `RESEND_API_KEY` | API Key starting with `re_`                   |
| `EMAIL_FROM`     | Sender address (e.g. `onboarding@resend.dev`) |

**Option B: AWS SES (Scalable)**

| Variable                | Description                    |
| :---------------------- | :----------------------------- |
| `SES_ACCESS_KEY_ID`     | IAM User Access Key            |
| `SES_SECRET_ACCESS_KEY` | IAM User Secret Key            |
| `SES_REGION`            | AWS Region (e.g. `ap-south-1`) |
| `EMAIL_FROM`            | Verified sender address        |

### 6. AWS S3 (File Storage)

Required for uploading product images and avatars.

| Variable                | Description                     |
| :---------------------- | :------------------------------ |
| `AWS_ACCESS_KEY_ID`     | Access Key (can share with SES) |
| `AWS_SECRET_ACCESS_KEY` | Secret Key (can share with SES) |
| `S3_BUCKET_NAME`        | Public-read enabled bucket name |
| `AWS_REGION`            | Bucket region                   |

---

## Environment Files

| File                     | Use Case                    | Git Status                         |
| :----------------------- | :-------------------------- | :--------------------------------- |
| `.env.development.local` | Local development overrides | **Committed** (safe defaults only) |
| `.env.test.local`        | Test runner config          | **Committed**                      |
| `.env.production.local`  | Production secrets          | **NEVER COMMIT**                   |
| `.env.example`           | Template for new devs       | **Committed**                      |

## Loading Priority

1. **System ENV** (e.g. Kubernetes/Docker env vars) - _Highest_
2. **.env.production.local** (if `ENVIRONMENT=production`)
3. **.env.development.local** (if `ENVIRONMENT=development`)
4. **.env** (Generic fallback) - _Lowest_
