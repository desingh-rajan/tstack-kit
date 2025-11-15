import { db } from "../src/config/database.ts";
import { users } from "../src/auth/user.model.ts";
import { hashPassword } from "../src/shared/utils/password.ts";
import { eq } from "drizzle-orm";

/**
 * Seed superadmin user
 * Requires environment variables:
 * - SUPERADMIN_EMAIL (required)
 * - SUPERADMIN_PASSWORD (required, min 12 chars)
 */
async function seedSuperAdmin() {
  console.log("[SEED] Seeding superadmin user...");

  // Use hardcoded test credentials in test environment
  const isTestEnv = Deno.env.get("ENVIRONMENT") === "test";

  const superadminEmail = isTestEnv
    ? "superadmin@tonystack.dev"
    : Deno.env.get("SUPERADMIN_EMAIL");

  const superadminPassword = isTestEnv
    ? "SuperSecurePassword123!"
    : Deno.env.get("SUPERADMIN_PASSWORD");

  if (!superadminEmail) {
    console.error(
      "\n[ERROR] SUPERADMIN_EMAIL environment variable is required!",
    );
    console.error(
      "[INFO] Set it before running: export SUPERADMIN_EMAIL='admin@example.com'",
    );
    Deno.exit(1);
  }

  if (!superadminPassword) {
    console.error(
      "\n[ERROR] SUPERADMIN_PASSWORD environment variable is required!",
    );
    console.error(
      "[INFO] Set it before running: export SUPERADMIN_PASSWORD='YourPassword123!'",
    );
    console.error("[INFO] Generate secure password: openssl rand -base64 32");
    Deno.exit(1);
  }

  if (superadminPassword.length < 12) {
    console.error(
      "\n[ERROR] SUPERADMIN_PASSWORD must be at least 12 characters long",
    );
    Deno.exit(1);
  }

  // Check if superadmin already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, superadminEmail))
    .limit(1);

  if (existing.length > 0) {
    console.log("[OK] Superadmin already exists");
    console.log(`   Email: ${superadminEmail}`);
    return true; // Return success flag
  }

  // Hash the provided password
  const hashedPassword = await hashPassword(superadminPassword);

  // Create superadmin user (system-defined role)
  await db.insert(users).values({
    email: superadminEmail,
    username: "superadmin",
    password: hashedPassword,
    role: "superadmin", // System-defined, cannot be changed via API
    isActive: true,
    isEmailVerified: true,
  });

  console.log("[OK] Superadmin user created successfully");
  console.log(`   Email: ${superadminEmail}`);
  console.log(`   Role: superadmin (system-defined)`);
  console.log("\n[WARNING]  IMPORTANT: Do NOT commit credentials to git!");
}

// Run seed
if (import.meta.main) {
  try {
    await seedSuperAdmin();
    console.log("\n[SUCCESS] Seeding completed successfully");
    Deno.exit(0);
  } catch (error) {
    console.error("\n[ERROR] Seeding failed:", error);
    Deno.exit(1);
  }
}
