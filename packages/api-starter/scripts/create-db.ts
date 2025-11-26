#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read

/**
 * Database Creation Script
 *
 * This script creates the database if it doesn't exist.
 * Run this if you're using an existing PostgreSQL server (not Docker).
 *
 * Usage: deno run --allow-env --allow-net --allow-read scripts/create-db.ts
 */

import postgres from "postgres";

// Load .env file manually
try {
  const envContent = await Deno.readTextFile(".env");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        Deno.env.set(key.trim(), valueParts.join("=").trim());
      }
    }
  }
} catch {
  // .env file doesn't exist, will use environment variables
}

const DATABASE_URL = Deno.env.get("DATABASE_URL");

if (!DATABASE_URL) {
  console.error("[ERROR] DATABASE_URL not set in environment");
  console.log("Run: cp .env.example .env");
  Deno.exit(1);
}

// Parse the DATABASE_URL
const url = new URL(DATABASE_URL);
const dbName = url.pathname.slice(1); // Remove leading /
const username = url.username;
const password = url.password;
const host = url.hostname;
const port = parseInt(url.port || "5432");

console.log("[INFO] Database Configuration:");
console.log(`   Host: ${host}:${port}`);
console.log(`   Database: ${dbName}`);
console.log(`   User: ${username}`);
console.log();

// For local PostgreSQL, we need to connect as a superuser (postgres)
// In production, the user and database are already created
const pgUser = Deno.env.get("POSTGRES_SUPERUSER") || "postgres";
const pgPassword = Deno.env.get("POSTGRES_SUPERUSER_PASSWORD") || "";
const adminUrl = pgPassword
  ? `postgres://${pgUser}:${pgPassword}@${host}:${port}/postgres`
  : `postgres://${pgUser}@${host}:${port}/postgres`;

try {
  console.log("[INFO] Connecting to PostgreSQL as superuser...");
  const sql = postgres(adminUrl, { max: 1 });

  // Check if user exists
  console.log(`[INFO] Checking if user "${username}" exists...`);
  const userResult = await sql`
    SELECT 1 FROM pg_user WHERE usename = ${username}
  `;

  if (userResult.length === 0) {
    console.log(`[INFO] Creating user "${username}"...`);
    await sql.unsafe(
      `CREATE USER "${username}" WITH PASSWORD '${password}'`,
    );
    console.log(`[SUCCESS] User "${username}" created!`);
  } else {
    console.log(`[SUCCESS] User "${username}" already exists`);
  }

  // Check if database exists
  console.log(`[INFO] Checking if database "${dbName}" exists...`);
  const result = await sql`
    SELECT 1 FROM pg_database WHERE datname = ${dbName}
  `;

  if (result.length > 0) {
    console.log(`[SUCCESS] Database "${dbName}" already exists!`);
  } else {
    console.log(`[INFO] Creating database "${dbName}"...`);
    await sql.unsafe(`CREATE DATABASE "${dbName}" OWNER "${username}"`);
    console.log(`[SUCCESS] Database "${dbName}" created successfully!`);
  }

  // Grant all privileges
  console.log(` Granting privileges to "${username}"...`);
  await sql.unsafe(
    `GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${username}"`,
  );
  console.log(`[SUCCESS] Privileges granted!`);

  await sql.end();
  console.log();
  console.log("[SUCCESS] Done! You can now run migrations:");
  console.log("   deno task migrate:generate");
  console.log("   deno task migrate:run");
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("[ERROR] Error:", errorMessage);
  console.log();
  console.log("[TIP] Make sure PostgreSQL is running and accessible.");
  console.log();
  console.log("   Option A - Use existing PostgreSQL:");
  console.log(`   sudo -u postgres psql -c "CREATE DATABASE ${dbName}"`);
  console.log();
  console.log("   Option B - Use Docker:");
  console.log("   docker compose up -d");
  Deno.exit(1);
}
