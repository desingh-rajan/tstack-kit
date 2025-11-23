/**
 * Seed Regular User
 *
 * Creates a regular test user for development and testing.
 *
 * In test environment, uses hardcoded credentials:
 * - Email: user@tonystack.dev
 * - Password: UserSecurePassword123!
 * - Role: user
 *
 * In other environments, requires environment variables:
 * - REGULAR_USER_EMAIL (required)
 * - REGULAR_USER_PASSWORD (required, min 12 chars)
 * - REGULAR_USER_USERNAME (optional, defaults to "Regular User")
 */

import { db } from "../src/config/database.ts";
import { users } from "../src/auth/user.model.ts";
import { hashPassword } from "../src/shared/utils/password.ts";
import { eq } from "drizzle-orm";

/**
 * Seed Regular User
 */
async function seedRegularUser() {
  console.log("[SEED] Seeding regular user...");

  // Use hardcoded test credentials in test environment
  const isTestEnv = Deno.env.get("ENVIRONMENT") === "test";

  const REGULAR_USER_EMAIL = isTestEnv
    ? "user@tonystack.dev"
    : Deno.env.get("REGULAR_USER_EMAIL");

  const REGULAR_USER_PASSWORD = isTestEnv
    ? "UserSecurePassword123!"
    : Deno.env.get("REGULAR_USER_PASSWORD");

  const REGULAR_USER_USERNAME = Deno.env.get("REGULAR_USER_USERNAME") ||
    "Regular User";

  if (!REGULAR_USER_EMAIL) {
    console.log(
      "[SKIP] REGULAR_USER_EMAIL not set — skipping regular user seeding (optional)",
    );
    Deno.exit(0);
  }

  if (!REGULAR_USER_PASSWORD) {
    console.error(
      "\n[ERROR] REGULAR_USER_PASSWORD is required when REGULAR_USER_EMAIL is set",
    );
    console.error(
      "[INFO] Set it before running: export REGULAR_USER_PASSWORD='YourPassword123!'",
    );
    Deno.exit(1);
  }

  if (REGULAR_USER_PASSWORD.length < 12) {
    console.error(
      "\n[ERROR] REGULAR_USER_PASSWORD must be at least 12 characters long",
    );
    Deno.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, REGULAR_USER_EMAIL))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("[OK] Regular user already exists");
      console.log(`   Email: ${REGULAR_USER_EMAIL}`);
      console.log(`   User ID: ${existingUser[0].id}`);
      Deno.exit(0);
    }

    // Hash password
    const hashedPassword = await hashPassword(REGULAR_USER_PASSWORD);

    // Create regular user
    const [newUser] = await db
      .insert(users)
      .values({
        email: REGULAR_USER_EMAIL,
        username: REGULAR_USER_USERNAME,
        password: hashedPassword,
        role: "user", // Regular user role
        isEmailVerified: true,
        isActive: true,
      })
      .returning();

    console.log("[OK] Regular user created successfully");
    console.log(`   Email: ${REGULAR_USER_EMAIL}`);
    console.log(`   Username: ${REGULAR_USER_USERNAME}`);
    console.log(`   Role: user`);
    console.log(`   User ID: ${newUser.id}`);
    console.log("");
    console.log("[WARNING]  IMPORTANT: This is a development/test user only!");
    console.log("");
    console.log("[SUCCESS] Seeding completed successfully");
    Deno.exit(0);
  } catch (error) {
    console.error("[ERROR] Error seeding regular user:", error);
    Deno.exit(1);
  }
}

// Run seeding
seedRegularUser();
