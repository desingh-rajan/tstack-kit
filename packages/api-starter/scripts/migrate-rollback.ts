#!/usr/bin/env -S deno run --allow-all

/**
 * Migration Rollback Script
 *
 * Removes the last applied migration record from __drizzle_migrations.
 * NOTE: This only removes the tracking record. The DDL changes (table
 * creates, column adds, etc.) are NOT automatically reversed.
 * You must manually write and apply a compensating SQL migration
 * or regenerate the schema.
 *
 * Usage: deno task db:migrate:rollback
 */

import postgres from "postgres";

// Load .env file manually
try {
  const envFile = Deno.env.get("ENVIRONMENT") === "test"
    ? ".env.test.local"
    : ".env.development.local";

  let envContent: string;
  try {
    envContent = await Deno.readTextFile(envFile);
  } catch {
    envContent = await Deno.readTextFile(".env");
  }

  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex !== -1) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        if (!Deno.env.get(key)) {
          Deno.env.set(key, value);
        }
      }
    }
  }
} catch {
  // No env file found, rely on environment variables
}

const DATABASE_URL = Deno.env.get("DATABASE_URL");
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  Deno.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

try {
  // Check if table exists
  const tableCheck = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = '__drizzle_migrations'
    ) as exists
  `;

  if (!tableCheck[0]?.exists) {
    console.error("No __drizzle_migrations table found. Nothing to rollback.");
    Deno.exit(1);
  }

  // Get the last applied migration
  const lastMigration = await sql`
    SELECT hash, created_at
    FROM __drizzle_migrations
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (lastMigration.length === 0) {
    console.log("No migrations to rollback.");
    Deno.exit(0);
  }

  const migrationName = lastMigration[0].hash;
  const appliedAt = lastMigration[0].created_at;

  console.log(`\nRolling back migration: ${migrationName}`);
  console.log(`Applied at: ${new Date(Number(appliedAt)).toISOString()}`);
  console.log();

  // Delete the record
  await sql`
    DELETE FROM __drizzle_migrations
    WHERE hash = ${migrationName}
  `;

  console.log("Migration record removed from __drizzle_migrations.");
  console.log();
  console.log(
    "IMPORTANT: The DDL changes from this migration have NOT been reversed.",
  );
  console.log(
    "You must manually undo the schema changes (drop tables, remove columns, etc.)",
  );
  console.log(
    "or create a new migration with the compensating SQL.",
  );
} catch (error) {
  console.error("Rollback failed:", error);
  Deno.exit(1);
} finally {
  await sql.end();
}
