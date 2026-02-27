import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5174,
    cors: {
      // Dev-only: restrict to local origins. Vite dev server is never used in production.
      origin: ["http://localhost:8000", "http://localhost:3000"],
    },
  },
});
