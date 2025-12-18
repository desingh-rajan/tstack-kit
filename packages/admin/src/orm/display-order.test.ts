/**
 * Tests for displayOrder auto-management in DrizzleAdapter
 *
 * These are unit tests for the displayOrder behavior logic.
 * Integration tests with actual database would be in the api-starter package.
 *
 * Behavior:
 * 1. CREATE without displayOrder: auto-assigns next value (max + 1)
 * 2. CREATE with displayOrder: shifts existing items at that position up
 * 3. UPDATE with displayOrder: shifts existing items (excluding self) up
 *
 * Example:
 *   Initial: [A:0, B:1, C:2, D:3]
 *   Insert E at position 1:
 *     - B, C, D shift up: B:2, C:3, D:4
 *     - E gets position 1
 *   Result: [A:0, E:1, B:2, C:3, D:4]
 */

import { assertEquals } from "@std/assert";

/**
 * Simulate the displayOrder shifting algorithm
 * This mirrors the logic in DrizzleAdapter.shiftDisplayOrders()
 */
function simulateShift(
  items: Array<{ id: string; displayOrder: number }>,
  targetOrder: number,
  excludeId?: string,
): Array<{ id: string; displayOrder: number }> {
  return items.map((item) => {
    if (item.displayOrder >= targetOrder && item.id !== excludeId) {
      return { ...item, displayOrder: item.displayOrder + 1 };
    }
    return item;
  });
}

/**
 * Get next displayOrder value (max + 1)
 */
function getNextDisplayOrder(items: Array<{ displayOrder: number }>): number {
  if (items.length === 0) return 0;
  const max = Math.max(...items.map((i) => i.displayOrder));
  return max + 1;
}

Deno.test("DisplayOrder - Auto Increment", async (t) => {
  await t.step("returns 0 for empty list", () => {
    assertEquals(getNextDisplayOrder([]), 0);
  });

  await t.step("returns max + 1 for existing items", () => {
    const items = [
      { displayOrder: 0 },
      { displayOrder: 1 },
      { displayOrder: 2 },
    ];
    assertEquals(getNextDisplayOrder(items), 3);
  });

  await t.step("handles gaps in sequence", () => {
    const items = [
      { displayOrder: 0 },
      { displayOrder: 5 },
      { displayOrder: 10 },
    ];
    assertEquals(getNextDisplayOrder(items), 11);
  });
});

Deno.test("DisplayOrder - Shift on Create", async (t) => {
  await t.step("shifts items at and after target position", () => {
    const items = [
      { id: "a", displayOrder: 0 },
      { id: "b", displayOrder: 1 },
      { id: "c", displayOrder: 2 },
      { id: "d", displayOrder: 3 },
    ];

    // Insert at position 1 - b, c, d should shift
    const shifted = simulateShift(items, 1);

    assertEquals(shifted, [
      { id: "a", displayOrder: 0 }, // unchanged
      { id: "b", displayOrder: 2 }, // shifted
      { id: "c", displayOrder: 3 }, // shifted
      { id: "d", displayOrder: 4 }, // shifted
    ]);
  });

  await t.step("shifts items at position 0 (insert at beginning)", () => {
    const items = [
      { id: "a", displayOrder: 0 },
      { id: "b", displayOrder: 1 },
    ];

    const shifted = simulateShift(items, 0);

    assertEquals(shifted, [
      { id: "a", displayOrder: 1 },
      { id: "b", displayOrder: 2 },
    ]);
  });

  await t.step("no shift needed when inserting at end", () => {
    const items = [
      { id: "a", displayOrder: 0 },
      { id: "b", displayOrder: 1 },
    ];

    // Insert at position 2 - no items at or after
    const shifted = simulateShift(items, 2);

    assertEquals(shifted, [
      { id: "a", displayOrder: 0 },
      { id: "b", displayOrder: 1 },
    ]);
  });
});

Deno.test("DisplayOrder - Shift on Update", async (t) => {
  await t.step("excludes self when shifting", () => {
    const items = [
      { id: "a", displayOrder: 0 },
      { id: "b", displayOrder: 1 },
      { id: "c", displayOrder: 2 },
      { id: "d", displayOrder: 3 },
    ];

    // Move 'd' to position 1, exclude 'd' from shift
    const shifted = simulateShift(items, 1, "d");

    assertEquals(shifted, [
      { id: "a", displayOrder: 0 }, // unchanged
      { id: "b", displayOrder: 2 }, // shifted
      { id: "c", displayOrder: 3 }, // shifted
      { id: "d", displayOrder: 3 }, // NOT shifted (excluded)
    ]);
    // After update, 'd' would be set to 1
  });

  await t.step("moves item from end to beginning", () => {
    const items = [
      { id: "a", displayOrder: 0 },
      { id: "b", displayOrder: 1 },
      { id: "c", displayOrder: 2 },
    ];

    // Move 'c' to position 0
    const shifted = simulateShift(items, 0, "c");

    assertEquals(shifted, [
      { id: "a", displayOrder: 1 }, // shifted
      { id: "b", displayOrder: 2 }, // shifted
      { id: "c", displayOrder: 2 }, // NOT shifted
    ]);
    // After update, 'c' would be set to 0
  });
});

Deno.test("DisplayOrder - Edge Cases", async (t) => {
  await t.step("handles single item", () => {
    const items = [{ id: "a", displayOrder: 0 }];
    const shifted = simulateShift(items, 0);

    assertEquals(shifted, [{ id: "a", displayOrder: 1 }]);
  });

  await t.step("handles empty list", () => {
    const items: Array<{ id: string; displayOrder: number }> = [];
    const shifted = simulateShift(items, 0);

    assertEquals(shifted, []);
  });

  await t.step("handles negative target (treated as 0 in practice)", () => {
    const items = [
      { id: "a", displayOrder: 0 },
      { id: "b", displayOrder: 1 },
    ];

    // In practice, negative values would be validated at DTO level
    // But the shift logic should still work
    const shifted = simulateShift(items, -1);

    assertEquals(shifted, [
      { id: "a", displayOrder: 1 },
      { id: "b", displayOrder: 2 },
    ]);
  });
});
