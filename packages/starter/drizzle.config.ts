import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/entities/*/*.model.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: Deno.env.get("DATABASE_URL") || "./data/dev.db",
  },
  verbose: true,
  strict: true,
});
