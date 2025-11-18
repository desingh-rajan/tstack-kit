/**
 * Validate required environment variables are set
 */

const required = [
  "SUPERADMIN_EMAIL",
  "SUPERADMIN_PASSWORD",
  "DATABASE_URL",
  "JWT_SECRET",
];

const optional = [
  "ALPHA_EMAIL",
  "ALPHA_PASSWORD",
  "ALPHA_USERNAME",
];

console.log("[INFO] Validating environment variables...\n");

let hasErrors = false;

for (const varName of required) {
  const value = Deno.env.get(varName);
  if (!value) {
    console.error(`[ERROR] Missing required: ${varName}`);
    hasErrors = true;
  } else if (varName.includes("PASSWORD") && value.length < 12) {
    console.error(
      `[ERROR] ${varName} too short (min 12 chars): ${value.length} chars`,
    );
    hasErrors = true;
  } else {
    console.log(
      `[SUCCESS] ${varName}: ${
        varName.includes("PASSWORD") ? "********" : value
      }`,
    );
  }
}

console.log("\nOptional variables:");
for (const varName of optional) {
  const value = Deno.env.get(varName);
  if (value) {
    console.log(
      `[SUCCESS] ${varName}: ${
        varName.includes("PASSWORD") ? "********" : value
      }`,
    );
  } else {
    console.log(`[WARNING]  ${varName}: not set (optional)`);
  }
}

if (hasErrors) {
  console.error("\n[ERROR] Environment validation failed!");
  console.error("Set missing variables in your .env.development.local file");
  Deno.exit(1);
}

console.log("\n[SUCCESS] Environment validation passed!");
