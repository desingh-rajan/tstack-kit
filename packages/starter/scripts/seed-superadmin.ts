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
  console.log("🌱 Seeding superadmin user...");

  const superadminEmail = "superadmin@tstack.in";

  // Check if superadmin already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, superadminEmail))
    .limit(1);

  if (existing.length > 0) {
    console.log("✓ Superadmin already exists");
    return;
  }

  // Hash the default password
  const hashedPassword = await hashPassword("TonyStack@2025!");

  // Create superadmin user
  await db.insert(users).values({
    email: superadminEmail,
    username: "superadmin",
    password: hashedPassword,
    isActive: true,
    isEmailVerified: true,
  });

  console.log("✓ Superadmin user created successfully");
  console.log(`   Email: ${superadminEmail}`);
  console.log(`   Password: TonyStack@2025!`);
  console.log("\n⚠️  IMPORTANT: Change this password in production!");
}

// Run seed
if (import.meta.main) {
  try {
    await seedSuperAdmin();
    console.log("\n✅ Seeding completed successfully");
    Deno.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    Deno.exit(1);
  }
}
