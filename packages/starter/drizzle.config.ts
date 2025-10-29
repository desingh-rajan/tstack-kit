import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/entities/*/*.model.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: Deno.env.get("DATABASE_URL") ||
      "postgresql://postgres:postgres@localhost:5432/tstack_dev",
  },
  verbose: true,
  strict: true,
});
