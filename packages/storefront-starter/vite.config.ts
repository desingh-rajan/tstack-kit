import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  server: {
    cors: {
      // Dev-only: restrict to local origins. Vite dev server is never used in production.
      origin: ["http://localhost:8000", "http://localhost:3000"],
    },
  },
});
