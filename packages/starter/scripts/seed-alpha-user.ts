/**
 * Seed Alpha User
 *
 * Creates a regular test user for development:
 * - Email: alpha@tstack.in
 * - Password: Alpha@2025!
 * - Username: Alpha User
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

const ALPHA_EMAIL = "alpha@tstack.in";
const ALPHA_PASSWORD = "Alpha@2025!";
const ALPHA_USERNAME = "Alpha User";

async function seedAlphaUser() {
  console.log("[SEED] Seeding Alpha user...");

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
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(ALPHA_PASSWORD);

    // Create alpha user (regular user role)
    const [newUser] = await db
      .insert(users)
      .values({
        email: ALPHA_EMAIL,
        username: ALPHA_USERNAME,
        password: hashedPassword,
        role: "user", // Regular user, not admin
        isEmailVerified: true,
        isActive: true,
      })
      .returning();

    console.log("[OK] Alpha user created successfully");
    console.log(`   Email: ${ALPHA_EMAIL}`);
    console.log(`   Password: ${ALPHA_PASSWORD}`);
    console.log(`   Username: ${ALPHA_USERNAME}`);
    console.log(`   Role: user (regular user)`);
    console.log(`   User ID: ${newUser.id}`);
    console.log("");
    console.log("[WARNING]  IMPORTANT: This is a development/test user only!");
    console.log("");
    console.log("[SUCCESS] Seeding completed successfully");
  } catch (error) {
    console.error("[ERROR] Error seeding alpha user:", error);
    Deno.exit(1);
  }
}

// Run seeding
seedAlphaUser();
