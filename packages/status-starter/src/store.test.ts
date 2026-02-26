import { assertEquals } from "@std/assert";
import {
  closeKv,
  getHistory,
  getLatestCheck,
  pruneOld,
  recordCheck,
  setKvPath,
} from "./store.ts";
import type { CheckResult } from "./checker.ts";

// Each subtest gets a fresh in-memory KV store
function useMemoryKv() {
  setKvPath(":memory:");
}

Deno.test("store", async (t) => {
  await t.step("recordCheck stores and retrieves a day summary", async () => {
    await closeKv();
    useMemoryKv();
    const result: CheckResult = {
      name: "TestAPI",
      url: "http://localhost:8000/health",
      ok: true,
      latencyMs: 42,
      checkedAt: new Date().toISOString(),
    };

    await recordCheck(result);

    const history = await getHistory("TestAPI", 1);
    assertEquals(history.length, 1);
    const day = history[0];
    assertEquals(day !== null, true);
    if (day) {
      assertEquals(day.totalChecks, 1);
      assertEquals(day.successfulChecks, 1);
      assertEquals(day.avgLatencyMs, 42);
      assertEquals(day.lastStatus, true);
    }
    await closeKv();
  });

  await t.step("recordCheck accumulates multiple checks per day", async () => {
    await closeKv();
    useMemoryKv();
    const now = new Date().toISOString();

    await recordCheck({
      name: "Acc",
      url: "http://test/health",
      ok: true,
      latencyMs: 100,
      checkedAt: now,
    });
    await recordCheck({
      name: "Acc",
      url: "http://test/health",
      ok: false,
      latencyMs: 200,
      checkedAt: now,
    });

    const history = await getHistory("Acc", 1);
    const day = history[0];
    assertEquals(day !== null, true);
    if (day) {
      assertEquals(day.totalChecks, 2);
      assertEquals(day.successfulChecks, 1);
      assertEquals(day.avgLatencyMs, 150);
      assertEquals(day.lastStatus, false);
    }
    await closeKv();
  });

  await t.step("getLatestCheck returns the most recent result", async () => {
    await closeKv();
    useMemoryKv();
    const result: CheckResult = {
      name: "LatestSvc",
      url: "http://test/health",
      ok: true,
      latencyMs: 10,
      checkedAt: new Date().toISOString(),
      detail: "OK",
    };

    await recordCheck(result);
    const latest = await getLatestCheck("LatestSvc");
    assertEquals(latest !== null, true);
    if (latest) {
      assertEquals(latest.name, "LatestSvc");
      assertEquals(latest.ok, true);
      assertEquals(latest.latencyMs, 10);
    }
    await closeKv();
  });

  await t.step(
    "getHistory returns nulls for days with no data",
    async () => {
      await closeKv();
      useMemoryKv();
      const history = await getHistory("NonExistent", 7);
      assertEquals(history.length, 7);
      for (const day of history) {
        assertEquals(day, null);
      }
      await closeKv();
    },
  );

  await t.step("pruneOld removes entries beyond history window", async () => {
    await closeKv();
    useMemoryKv();
    // Record a check with a date far in the past
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 200);
    const oldResult: CheckResult = {
      name: "OldSvc",
      url: "http://test/health",
      ok: true,
      latencyMs: 5,
      checkedAt: oldDate.toISOString(),
    };

    await recordCheck(oldResult);
    const pruned = await pruneOld();
    assertEquals(pruned >= 1, true);

    // Verify it is gone
    const dateStr = oldDate.toISOString().slice(0, 10);
    const history = await getHistory("OldSvc", 200);
    const entry = history.find((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (199 - i));
      return d.toISOString().slice(0, 10) === dateStr;
    });
    assertEquals(entry ?? null, null);
    await closeKv();
  });
});
