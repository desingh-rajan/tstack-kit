/**
 * Tests for Drizzle ORM Adapter
 *
 * These tests use the same test database as the starter project.
 * Run with: ENVIRONMENT=test deno task test
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DrizzleAdapter } from "./drizzle.ts";

// Test table schemas
const testProducts = pgTable("test_admin_products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  description: text(),
  price: integer(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const testUsersWithUUID = pgTable("test_admin_users_uuid", {
  uuid: text().primaryKey(),
  email: text().notNull(),
  username: text(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Connect to test database (tables already created by _test_setup.ts)
const connectionString = Deno.env.get("DATABASE_URL");
if (!connectionString) {
  throw new Error(
    "DATABASE_URL not found. Run: ENVIRONMENT=test deno task test",
  );
}

// Database connection (shared across all tests)
const sql: ReturnType<typeof postgres> = postgres(connectionString);
const db: ReturnType<typeof drizzle> = drizzle(sql);

// Export for cleanup
export { sql };

async function seedTestData() {
  // Insert 50 test products
  for (let i = 1; i <= 50; i++) {
    await db.insert(testProducts).values({
      name: `Product ${i}`,
      description: `Description for product ${i}`,
      price: i * 100,
    });
  }

  // Insert test users with UUID
  await db.insert(testUsersWithUUID).values([
    {
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      email: "user1@test.com",
      username: "user1",
    },
    {
      uuid: "550e8400-e29b-41d4-a716-446655440001",
      email: "user2@test.com",
      username: "user2",
    },
    {
      uuid: "550e8400-e29b-41d4-a716-446655440002",
      email: "user3@test.com",
      username: "user3",
    },
  ]);
}

// Drop and recreate tables for clean state
async function recreateTestTables() {
  // Drop tables if they exist
  await sql`DROP TABLE IF EXISTS test_admin_products CASCADE`;
  await sql`DROP TABLE IF EXISTS test_admin_users_uuid CASCADE`;

  // Recreate test_admin_products table
  await sql`
    CREATE TABLE test_admin_products (
      id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  // Recreate test_admin_users_uuid table
  await sql`
    CREATE TABLE test_admin_users_uuid (
      uuid TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      username TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

// Setup: Drop/recreate tables and seed test data before all tests
Deno.test("DrizzleAdapter (number ID) - setup", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await recreateTestTables();
  await seedTestData();
});

Deno.test("DrizzleAdapter - findMany with pagination (first page)", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const result = await adapter.findMany({
    page: 1,
    limit: 10,
    search: undefined,
    searchColumns: [],
  });

  assertEquals(result.data.length, 10);
  assertEquals(result.total, 50);
  assertEquals(result.page, 1);
  assertEquals(result.limit, 10);
  assertEquals(result.totalPages, 5);
  assertEquals(result.hasPrevious, false);
  assertEquals(result.hasNext, true);
});

Deno.test("DrizzleAdapter - findMany with pagination (middle page)", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const result = await adapter.findMany({
    page: 3,
    limit: 10,
  });

  assertEquals(result.data.length, 10);
  assertEquals(result.page, 3);
  assertEquals(result.hasPrevious, true);
  assertEquals(result.hasNext, true);
});

Deno.test("DrizzleAdapter - findMany with pagination (last page)", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const result = await adapter.findMany({
    page: 5,
    limit: 10,
  });

  assertEquals(result.data.length, 10);
  assertEquals(result.page, 5);
  assertEquals(result.hasNext, false);
});

Deno.test("DrizzleAdapter - findMany with search", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const result = await adapter.findMany({
    page: 1,
    limit: 10,
    search: "Product 1",
    searchColumns: ["name", "description"],
  });

  // Should find Product 1, Product 10-19 (11 results)
  assertEquals(result.data.length, 10);
  assertEquals(result.total, 11);
});

Deno.test("DrizzleAdapter - findMany with sorting ASC", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const result = await adapter.findMany({
    page: 1,
    limit: 5,
    orderBy: "price",
    orderDir: "asc",
  });

  assertEquals(result.data.length, 5);
  assertEquals(result.data[0].price, 100); // Lowest price first
});

Deno.test("DrizzleAdapter - findMany with sorting DESC", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const result = await adapter.findMany({
    page: 1,
    limit: 5,
    orderBy: "price",
    orderDir: "desc",
  });

  assertEquals(result.data.length, 5);
  assertEquals(result.data[0].price, 5000); // Highest price first
});

Deno.test("DrizzleAdapter - findById success", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  // Get the first product to find its ID
  const list = await adapter.findMany({ page: 1, limit: 1 });
  const firstId = list.data[0].id;

  const product = await adapter.findById(firstId);

  assertExists(product);
  assertExists(product?.name);
});

Deno.test("DrizzleAdapter - findById not found", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const product = await adapter.findById(999);

  assertEquals(product, null);
});

Deno.test("DrizzleAdapter - findById with string number", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  // Get the fifth product to find its ID
  const list = await adapter.findMany({ page: 1, limit: 5 });
  const fifthId = String(list.data[4].id);

  const product = await adapter.findById(fifthId);

  assertExists(product);
  assertExists(product?.name);
});

Deno.test("DrizzleAdapter - findById with invalid number ID", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  await assertRejects(
    async () => await adapter.findById("invalid"),
    Error,
    "Invalid number ID",
  );
});

Deno.test("DrizzleAdapter - create", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const newProduct = await adapter.create({
    name: "New Product",
    description: "A brand new product",
    price: 9999,
  });

  assertExists(newProduct);
  assertExists(newProduct.id);
  assertEquals(newProduct.name, "New Product");
  assertEquals(newProduct.price, 9999);
});

Deno.test("DrizzleAdapter - update success", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  // Get the first product to update
  const list = await adapter.findMany({ page: 1, limit: 1 });
  const firstId = list.data[0].id;

  const updated = await adapter.update(firstId, {
    name: "Updated Product",
    price: 1111,
  });

  assertExists(updated);
  assertEquals(updated?.name, "Updated Product");
  assertEquals(updated?.price, 1111);
});

Deno.test("DrizzleAdapter - update non-existent record", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const updated = await adapter.update(999, {
    name: "Should not exist",
  });

  assertEquals(updated, null);
});

Deno.test("DrizzleAdapter - delete success", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  // Get the second product to delete
  const list = await adapter.findMany({ page: 1, limit: 2 });
  const secondId = list.data[1].id;

  const deleted = await adapter.delete(secondId);

  assertEquals(deleted, true);

  // Verify it's gone
  const check = await adapter.findById(secondId);
  assertEquals(check, null);
});

Deno.test("DrizzleAdapter - delete non-existent record", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const deleted = await adapter.delete(999);

  assertEquals(deleted, false);
});

Deno.test("DrizzleAdapter - bulkDelete multiple records", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  // Get three products to delete
  const list = await adapter.findMany({ page: 1, limit: 5 });
  const ids = [list.data[2].id, list.data[3].id, list.data[4].id];

  const deletedCount = await adapter.bulkDelete(ids);

  assertEquals(deletedCount, 3);

  // Verify they're gone
  const product1 = await adapter.findById(ids[0]);
  const product2 = await adapter.findById(ids[1]);
  const product3 = await adapter.findById(ids[2]);

  assertEquals(product1, null);
  assertEquals(product2, null);
  assertEquals(product3, null);
});

Deno.test("DrizzleAdapter - bulkDelete empty array", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const deletedCount = await adapter.bulkDelete([]);

  assertEquals(deletedCount, 0);
});

Deno.test("DrizzleAdapter - count all records", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const count = await adapter.count();

  // After all previous tests (seed 50, create +1, delete -1, bulkDelete -3)
  // we should have 47 records left
  assertEquals(count, 47);
});

Deno.test("DrizzleAdapter - count with search", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testProducts, {
    db,
    idColumn: "id",
    idType: "number",
  });

  const count = await adapter.count("Product 1", ["name"]);

  // Product 1, Product 10-19 (but some deleted) = should be less than 11
  assertEquals(count > 0, true);
});

// Tests for string IDs (UUID)
Deno.test("DrizzleAdapter (string ID) - findById with UUID", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testUsersWithUUID, {
    db,
    idColumn: "uuid",
    idType: "string",
  });

  const user = await adapter.findById("550e8400-e29b-41d4-a716-446655440000");

  assertExists(user);
  assertEquals(user?.email, "user1@test.com");
  assertEquals(user?.username, "user1");
});

Deno.test("DrizzleAdapter (string ID) - findMany", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testUsersWithUUID, {
    db,
    idColumn: "uuid",
    idType: "string",
  });

  const result = await adapter.findMany({
    page: 1,
    limit: 10,
  });

  assertEquals(result.data.length, 3);
  assertEquals(result.total, 3);
});

Deno.test("DrizzleAdapter (string ID) - create with UUID", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testUsersWithUUID, {
    db,
    idColumn: "uuid",
    idType: "string",
  });

  const newUser = await adapter.create({
    uuid: "550e8400-e29b-41d4-a716-446655440099",
    email: "newuser@test.com",
    username: "newuser",
  });

  assertExists(newUser);
  assertEquals(newUser.email, "newuser@test.com");
});

Deno.test("DrizzleAdapter (string ID) - update with UUID", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testUsersWithUUID, {
    db,
    idColumn: "uuid",
    idType: "string",
  });

  const updated = await adapter.update("550e8400-e29b-41d4-a716-446655440001", {
    username: "updated_user2",
  });

  assertExists(updated);
  assertEquals(updated?.username, "updated_user2");
});

Deno.test("DrizzleAdapter (string ID) - delete with UUID", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testUsersWithUUID, {
    db,
    idColumn: "uuid",
    idType: "string",
  });

  const deleted = await adapter.delete("550e8400-e29b-41d4-a716-446655440002");

  assertEquals(deleted, true);
});

Deno.test("DrizzleAdapter (string ID) - bulkDelete with UUIDs", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  const adapter = new DrizzleAdapter(testUsersWithUUID, {
    db,
    idColumn: "uuid",
    idType: "string",
  });

  const deletedCount = await adapter.bulkDelete([
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440099",
  ]);

  assertEquals(deletedCount, 2);
});

// Cleanup test - must run last to close DB connection
Deno.test("z_drizzle_cleanup - close database connection", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await sql.end();
});
