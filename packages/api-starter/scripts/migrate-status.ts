#!/usr/bin/env -S deno run --allow-all

/**
 * Migration Status Script
 *
 * Shows which migrations have been applied and which are pending.
 * Reads the drizzle journal (migrations/meta/_journal.json) for known
 * migrations and queries the __drizzle_migrations table for applied ones.
 *
 * Usage: deno task db:migrate:status
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

// Read journal to get all known migrations
interface JournalEntry {
  idx: number;
  tag: string;
  when: number;
}

interface Journal {
  entries: JournalEntry[];
}

let journal: Journal;
try {
  const journalContent = await Deno.readTextFile(
    "migrations/meta/_journal.json",
  );
  journal = JSON.parse(journalContent);
} catch {
  console.error("Could not read migrations/meta/_journal.json");
  console.error("Run 'deno task db:generate' first to create migrations.");
  Deno.exit(1);
}

const _knownMigrations = new Set(journal.entries.map((e) => e.tag));

// Query the database for applied migrations
const sql = postgres(DATABASE_URL, { max: 1 });

try {
  // Check if __drizzle_migrations table exists
  const tableCheck = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = '__drizzle_migrations'
    ) as exists
  `;

  const appliedSet = new Set<string>();

  if (tableCheck[0]?.exists) {
    const applied = await sql`
      SELECT hash, created_at
      FROM __drizzle_migrations
      ORDER BY created_at ASC
    `;

    for (const row of applied) {
      // Drizzle stores the tag (migration name) as the hash
      appliedSet.add(String(row.hash));
    }
  }

  // Display status
  console.log("\nMigration Status");
  console.log("=".repeat(60));
  console.log(
    `${"Migration".padEnd(40)} ${"Status".padEnd(10)}`,
  );
  console.log("-".repeat(60));

  let pendingCount = 0;

  for (const entry of journal.entries) {
    const isApplied = appliedSet.has(entry.tag);
    const status = isApplied ? "Applied" : "Pending";
    if (!isApplied) pendingCount++;

    console.log(
      `${entry.tag.padEnd(40)} ${status.padEnd(10)}`,
    );
  }

  console.log("-".repeat(60));
  console.log(
    `Total: ${journal.entries.length} migrations, ${pendingCount} pending`,
  );
  console.log();

  if (pendingCount > 0) {
    console.log("Run 'deno task db:migrate' to apply pending migrations.");
  }
} catch (error) {
  console.error("Failed to check migration status:", error);
  Deno.exit(1);
} finally {
  await sql.end();
}
