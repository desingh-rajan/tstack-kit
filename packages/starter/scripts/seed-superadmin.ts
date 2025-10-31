import { db } from "../src/config/database.ts";
import { users } from "../src/auth/user.model.ts";
import { hashPassword } from "../src/shared/utils/password.ts";
import { eq } from "drizzle-orm";

/**
 * Seed superadmin user
 * Email: superadmin@tstack.in
 * Password: TonyStack@2025!
 */
async function seedSuperAdmin() {
  console.log("[SEED] Seeding superadmin user...");

  const superadminEmail = "superadmin@tstack.in";

  // Check if superadmin already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, superadminEmail))
    .limit(1);

  if (existing.length > 0) {
    console.log("[OK] Superadmin already exists");
    return true; // Return success flag
  }

  // Hash the default password
  const hashedPassword = await hashPassword("TonyStack@2025!");

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
  console.log(`   Password: TonyStack@2025!`);
  console.log(`   Role: superadmin (system-defined)`);
  console.log("\n[WARNING]  IMPORTANT: Change this password in production!");
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
