import process from "node:process";

export default {
  schema: ["./src/entities/*/*.model.ts", "./src/auth/*.model.ts"],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ||
      "postgresql://postgres:password@localhost:5432/tonystack",
  },
  verbose: true,
  strict: true,
};
