// Automatically load .env file
import "@std/dotenv/load";

export interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  allowedOrigins: string[];
}

function loadConfig(): Config {
  const databaseUrl = Deno.env.get("DATABASE_URL");

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is required");
    console.error(
      "   Make sure your .env file exists and contains DATABASE_URL",
    );
    Deno.exit(1);
  }

  return {
    nodeEnv: Deno.env.get("NODE_ENV") || "development",
    port: parseInt(Deno.env.get("PORT") || "8000", 10),
    databaseUrl,
    allowedOrigins: (Deno.env.get("ALLOWED_ORIGINS") || "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim()),
  };
}

export const config = loadConfig();
export const isDevelopment = config.nodeEnv === "development";
export const isProduction = config.nodeEnv === "production";
