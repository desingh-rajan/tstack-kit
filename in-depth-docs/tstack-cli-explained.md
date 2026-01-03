# TStack CLI: The Human Guide

Welcome to the definitive guide for the TStack CLI. This document is written for
you—the developer—to help you understand not just _what_ the commands are, but
_how_ the system behaves and _why_ it was built this way.

## The Philosophy

Most CLIs are simple file generators: they copy some templates and then forget
about them. TStack is different. It is **state-aware**.

When you create a project with TStack, the CLI remembers it. It records the
location, the type of project, and the databases associated with it in a local
"brain" (a secure database on your computer).

**Why does this matter?**

1. **Safety**: You can delete a project safely, and the CLI will know exactly
   which databases to drop so you don't leave junk behind.
2. **Convenience**: You can list or destroy projects from _any directory_ in
   your terminal. You don't have to `cd` into a folder to manage it.
3. **Intelligence**: When you run a command like `tstack scaffold`, the CLI
   knows if you are inside a workspace and can automatically connect your API
   and Admin UI together.

---

## 1. Creating Your Work

You can create standalone projects or full "workspaces".

### The `create` Command

The `create` command is your starting point. It uses a smart system to clone
premium templates and customize them for you.

**Usage:**

```bash
tstack create <type> <name>
```

**What happens when you run this?**

- The CLI downloads the latest "Starter Kit" for that type.
- It customizes project files (names, versions).
- It generates a secure `.env` file with unique secrets.
- **(Crucial)** It immediately sets up your development, test, and production
  databases for you. No manual SQL needed.
- It registers the project in its internal tracking system.

**Available Types:**

1. **`api`**: A high-performance backend.
   - _Best for_: Building a REST API.
   - _Includes_: Hono server, Drizzle ORM, Postgres setup, Authentication
     system.

2. **`admin-ui`**: A management dashboard.
   - _Best for_: Managing data in your API.
   - _Includes_: Fresh framework, DaisyUI components, Login system.

3. **`store`**: A customer-facing e-commerce site.
   - _Best for_: Selling products.
   - _Includes_: Beautiful landing page, product grid, optimized generic
     components.

### The `workspace` Command (Recommended)

In the real world, you rarely need just an API. You need an API, an Admin Panel
to manage it, and a Frontend to show it. This is where **Workspaces** come in.

**Usage:**

```bash
tstack create workspace <my-app>
```

**Why use a workspace?** Instead of creating three separate folders and trying
to make them talk to each other, `workspace` creates a monorepo setup locally.

- It creates a root folder.
- It creates the API, Admin, and Storefront inside it.
- It **pre-wires** them to communicate. The Admin knows where the API is. The
  Store knows where the API is.

**Power User Flags:**

- `--scope=<level>`: Control which entities are included (see below).
- `--mobile`: Add a React Native mobile app to the workspace.
- `--infra`: Add Terraform and Docker infrastructure files.
- `--github-org <name>`: Automatically create private GitHub repositories for
  every component and push the code for you.

### The `--scope` Flag: Progressive Entity Selection

Starting in v1.4.0, TStack supports progressive entity inclusion. You can start
with a minimal blog and scale up to full e-commerce.

**Available Scopes:**

1. **`core`** - Minimal content management:
   - `articles`: Blog posts, pages, CMS content
   - `site_settings`: Dynamic app configuration
   - `users`: Authentication (always included)
   - _Best for_: Blogs, simple CMS, internal tools

2. **`listing`** - Everything in `core` + Product catalog:
   - `brands`: Product brands/manufacturers
   - `categories`: Product taxonomy
   - `products`: Main product entities
   - `product_images`: Image galleries
   - `product_variants`: SKUs (size, color, etc.)
   - `variant_options`: Variant option values
   - _Best for_: Product catalogs, inventory systems, informational e-commerce

3. **`commerce`** (default) - Everything in `listing` + Shopping & checkout:
   - `addresses`: User shipping/billing addresses
   - `carts`: Shopping cart management
   - `orders`: Order processing
   - `payments`: Payment integration (Razorpay)
   - _Best for_: Full e-commerce stores, marketplaces

**Examples:**

```bash
# Start minimal - blog/CMS only
tstack create workspace blog --scope=core

# Product catalog without checkout
tstack create workspace catalog --scope=listing

# Full e-commerce (default, explicit)
tstack create workspace shop --scope=commerce

# API only with minimal entities
tstack create api backend --scope=core
```

**Why Use This?**

- **Faster Development**: Start with what you need, add complexity later
- **Lower Complexity**: Fewer entities = fewer files = easier to understand
- **Progressive Growth**: Migrate from blog → catalog → shop as requirements
  evolve
- **Clear Architecture**: Each scope level has a clear purpose

**Migration Path**: You can always add entities later using `tstack scaffold`.

---

## 2. building Features (`scaffold`)

This is the "magic" command. Once you have a project, you need to add data
entities (like Products, Users, Orders). Coding these by hand is repetitive.

**Usage:**

```bash
tstack scaffold <entity-name>
```

**The "Smart Scaffolding" Workflow:** Let's say you run
`tstack scaffold product`.

1. **If you are in an API project**: It generates the Database Model, the API
   Controller, the Service logic, the Routes, and the Tests.

2. **If you are in a Workspace**: It does all of the above, **AND** it goes into
   your Admin UI project and generates the config, the list page, the create
   form, and the edit page.

**Result**: You run one command, and 30 seconds later you have a working API
endpoint for Products _and_ a working UI dashboard to manage them.

**Common Options:**

- `--fields`: Define your data model right in the command (e.g.,
  `--fields name:string,price:number`). If you omit this, the CLI creates a
  basic shell for you to fill in.
- `--skip-admin-ui`: Use this if you only want the backend code.

---

## 3. Managing Projects

### The `list` Command

Since TStack remembers what you built, you can ask it for a report.

**Usage:**

```bash
tstack list
```

This prints a beautiful table showing every project you've created, where it is
located on your disk, and which databases it is using.

### The `destroy` Command

Cleaning up dev projects is usually a hassle (delete folder, log into Postgres,
drop DB...). TStack makes it one step.

**Usage:**

```bash
tstack destroy <name>
```

**What it does:**

1. It looks up `<name>` in its memory.
2. It deletes the folder from your hard drive.
3. It connects to your Postgres server and drops the `_dev`, `_test`, and
   `_prod` databases associated with that project.
4. It marks the project as "destroyed" in its history.

**Safety**: It will always ask for confirmation unless you pass `--force`.

---

## 4. Command Reference

Here is the complete cheat sheet for what you can do.

### `tstack create`

Create a new project.

- **Usage**: `tstack create <type> <name>`
- **Types**: `api`, `admin-ui`, `store`, `workspace`.
- **Options**:
  - `--interactive`: Ask for confirmation (default).
  - `--no-git`: Don't initialize a git repository.
  - `--force`: Overwrite if the folder already exists.

### `tstack workspace create`

Create a full monorepo with multiple connected projects.

- **Usage**: `tstack workspace create <name>`
- **Options**:
  - `--api`: Include the API component (default: true).
  - `--admin-ui`: Include the Admin Panel (default: true).
  - `--store`: Include the Storefront (default: true).
  - `--mobile`: Add a React Native mobile app starter.
  - `--infra`: Add Docker and Terraform infrastructure files.
  - `--github-org <name>`: Automatically create private GitHub repos for all
    components.

### `tstack scaffold`

Generate code for a new data entity.

- **Usage**: `tstack scaffold <entity-name>`
- **Options**:
  - `--fields`: Define fields inline (e.g. `name:string,price:number`).
  - `--skip-admin-ui` (or `--only-api`): Generate backend code only.
  - `--only-admin-ui`: Generate frontend code only (requires API to exist).

### `tstack list`

Show all tracked projects.

- **Options**:
  - `--status <status>`: Filter by `created`, `destroyed`, or `all`.

### `tstack destroy`

Remove a project and its databases.

- **Usage**: `tstack destroy <name>`
- **Options**:
  - `--force`: Skip confirmation prompt.

---

## 5. Troubleshooting & Internals

**Where is the data stored?** The CLI stores its memory in a standard file at
`~/.tstack/projects.db`.

**What if I manually delete a folder?** If you delete a project folder using
`rm -rf` or Finder, the CLI might still list it. When you run `tstack destroy`
on it, the CLI is smart enough to see the folder is gone, but it will still
proceed to clean up the orphaned databases and update its records.

**How do I reset everything?** If you want to make the CLI "forget" everything
(a fresh start), you can safely delete the `~/.tstack` folder.
