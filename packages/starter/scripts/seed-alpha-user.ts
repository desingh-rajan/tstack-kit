/**
 * Seed Alpha User
 *
 * Creates a regular test user for development.
 * Requires environment variables (optional):
 * - ALPHA_EMAIL (optional, skips if not set)
 * - ALPHA_PASSWORD (required if ALPHA_EMAIL is set, min 12 chars)
 * - ALPHA_USERNAME (optional, defaults to "Alpha User")
 *
 * This user is used in article tests to demonstrate:
 * - Regular user authentication
 * - Creating/updating own content
 * - Permission boundaries (can't edit others' content)
 */

import { db } from "../src/config/database.ts";
import { users } from "../src/auth/user.model.ts";
import { hashPassword } from "../src/shared/utils/password.ts";
import { eq } from "drizzle-orm";

/**
 * Seed Alpha User
 * Optional: will be skipped if ALPHA_EMAIL is not set
 */
async function seedAlphaUser() {
  console.log("[SEED] Seeding Alpha user...");

  // Use hardcoded test credentials in test environment
  const isTestEnv = Deno.env.get("ENVIRONMENT") === "test";

  const ALPHA_EMAIL = isTestEnv
    ? "alpha@tonystack.dev"
    : Deno.env.get("ALPHA_EMAIL");

  const ALPHA_PASSWORD = isTestEnv
    ? "AlphaSecurePassword123!"
    : Deno.env.get("ALPHA_PASSWORD");

  const ALPHA_USERNAME = Deno.env.get("ALPHA_USERNAME") || "Alpha User";

  if (!ALPHA_EMAIL) {
    console.log(
      "[SKIP] ALPHA_EMAIL not set — skipping Alpha user seeding (optional)",
    );
    Deno.exit(0);
  }

  if (!ALPHA_PASSWORD) {
    console.error(
      "\n[ERROR] ALPHA_PASSWORD is required when ALPHA_EMAIL is set",
    );
    console.error(
      "[INFO] Set it before running: export ALPHA_PASSWORD='YourPassword123!'",
    );
    Deno.exit(1);
  }

  if (ALPHA_PASSWORD.length < 12) {
    console.error(
      "\n[ERROR] ALPHA_PASSWORD must be at least 12 characters long",
    );
    Deno.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, ALPHA_EMAIL))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("[OK] Alpha user already exists");
      console.log(`   Email: ${ALPHA_EMAIL}`);
      console.log(`   User ID: ${existingUser[0].id}`);
      Deno.exit(0);
    }

    // Hash password
    const hashedPassword = await hashPassword(ALPHA_PASSWORD);

    // Create alpha user (admin role for testing)
    const [newUser] = await db
      .insert(users)
      .values({
        email: ALPHA_EMAIL,
        username: ALPHA_USERNAME,
        password: hashedPassword,
        role: isTestEnv ? "admin" : "user", // Admin in test, regular user otherwise
        isEmailVerified: true,
        isActive: true,
      })
      .returning();

    console.log("[OK] Alpha user created successfully");
    console.log(`   Email: ${ALPHA_EMAIL}`);
    console.log(`   Username: ${ALPHA_USERNAME}`);
    console.log(`   Role: ${isTestEnv ? "admin" : "user"}`);
    console.log(`   User ID: ${newUser.id}`);
    console.log("");
    console.log("[WARNING]  IMPORTANT: This is a development/test user only!");
    console.log("");
    console.log("[SUCCESS] Seeding completed successfully");
    Deno.exit(0);
  } catch (error) {
    console.error("[ERROR] Error seeding alpha user:", error);
    Deno.exit(1);
  }
}

// Run seeding
seedAlphaUser();
