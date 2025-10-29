export interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  allowedOrigins: string[];
}

function loadConfig(): Config {
  return {
    nodeEnv: Deno.env.get("NODE_ENV") || "development",
    port: parseInt(Deno.env.get("PORT") || "8000", 10),
    databaseUrl: Deno.env.get("DATABASE_URL") ||
      "postgresql://postgres:password@localhost:5432/tonystack",
    allowedOrigins: (Deno.env.get("ALLOWED_ORIGINS") || "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim()),
  };
}

export const config = loadConfig();
export const isDevelopment = config.nodeEnv === "development";
export const isProduction = config.nodeEnv === "production";
