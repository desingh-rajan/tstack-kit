/**
 * TStack Templates Command
 *
 * Lists available starter templates.
 * Usage: tstack templates
 */

import { blue, bold, cyan, gray, green } from "@std/fmt/colors";

interface Template {
  name: string;
  command: string;
  description: string;
  features: string[];
}

const TEMPLATES: Template[] = [
  {
    name: "API",
    command: "tstack create api <name>",
    description: "REST API with Hono, Drizzle ORM, PostgreSQL",
    features: [
      "Hono web framework",
      "Drizzle ORM with PostgreSQL",
      "JWT authentication",
      "Zod validation",
      "Docker support",
      "Test setup with real database",
    ],
  },
  {
    name: "Admin UI",
    command: "tstack create admin-ui <name>",
    description: "Admin panel with Fresh, Preact, Tailwind",
    features: [
      "Fresh framework (Deno)",
      "Preact with Islands architecture",
      "Tailwind CSS",
      "Config-driven entity management",
      "CRUD interfaces",
      "Dark mode support",
    ],
  },
  {
    name: "Workspace",
    command: "tstack create workspace <name>",
    description: "Full-stack workspace with API + Admin UI",
    features: [
      "Creates both API and Admin UI",
      "Shared namespace",
      "GitHub integration (optional)",
      "Deno KV project tracking",
      "Pre-configured for development",
    ],
  },
];

/**
 * List available templates
 */
export function listTemplatesCommand(): void {
  console.log("");
  console.log(bold("Available Templates"));
  console.log("====================");
  console.log("");

  for (const template of TEMPLATES) {
    console.log(green(bold(template.name)));
    console.log(gray(`  ${template.description}`));
    console.log(cyan(`  $ ${template.command}`));
    console.log("");
    console.log(blue("  Features:"));
    for (const feature of template.features) {
      console.log(gray(`    - ${feature}`));
    }
    console.log("");
  }

  console.log("====================");
  console.log("");
  console.log("Scaffold entities within a project:");
  console.log(cyan("  $ tstack scaffold <entity-name>"));
  console.log(gray("  Generates: routes, handlers, service, repository, schema, tests"));
  console.log("");
  console.log("Documentation: https://github.com/desingh-rajan/tstack-kit/tree/main/docs");
  console.log("");
}
