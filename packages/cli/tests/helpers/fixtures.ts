/**
 * Common test fixtures and data
 */

export const VALID_PROJECT_NAMES = [
  "my-backend",
  "acme-api",
  "blog_backend",
  "MyProject",
  "api123",
];

export const INVALID_PROJECT_NAMES = [
  "123-project", // starts with number
  "my project", // contains space
  "my-project!", // special char
  "", // empty
  "-project", // starts with hyphen
];

export const VALID_ENTITY_NAMES = [
  "user",
  "product",
  "blog-post",
  "blog_post",
  "BlogPost",
  "site_settings",
];

export const SAMPLE_DENO_JSON = {
  name: "@test/project",
  version: "0.1.0",
  tasks: {
    dev: "deno run --allow-all src/main.ts",
  },
  imports: {
    "@std/dotenv": "jsr:@std/dotenv@^0.225.0",
    "hono": "jsr:@hono/hono@^4.6.0",
    "drizzle-orm": "npm:drizzle-orm@^0.36.0",
    "zod": "npm:zod@^3.23.0",
  },
};

export const SAMPLE_ENV_CONTENT = `# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/test_db

# Server Configuration
PORT=8000
ENVIRONMENT=development
`;

export const SAMPLE_DOCKER_COMPOSE = `version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
`;
