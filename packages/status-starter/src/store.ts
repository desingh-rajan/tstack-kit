import type { CheckResult } from "./checker.ts";
import { config } from "./config.ts";

/**
 * Daily summary stored in KV
 */
export interface DaySummary {
  date: string; // YYYY-MM-DD
  totalChecks: number;
  successfulChecks: number;
  avgLatencyMs: number;
  lastStatus: boolean;
}

/**
 * Open or reuse a Deno KV store for status history.
 * Uses a file-backed store so data survives restarts.
 */
let _kv: Deno.Kv | null = null;
let _kvPath: string | undefined = undefined;

export async function getKv(path?: string): Promise<Deno.Kv> {
  if (!_kv) {
    _kv = await Deno.openKv(path ?? _kvPath);
  }
  return _kv;
}

/**
 * Set the KV path (for test isolation)
 */
export function setKvPath(path: string | undefined): void {
  _kvPath = path;
}

/**
 * Close the KV store (for tests / cleanup)
 */
export async function closeKv(): Promise<void> {
  if (_kv) {
    _kv.close();
    _kv = null;
    // Small delay to ensure clean close
    await new Promise((r) => setTimeout(r, 50));
  }
}

/**
 * Record a check result.
 * Updates the daily summary for the service in a single atomic op.
 */
export async function recordCheck(result: CheckResult): Promise<void> {
  const kv = await getKv();
  const date = result.checkedAt.slice(0, 10); // YYYY-MM-DD
  const key = ["status", result.name, date];

  // Read current day summary
  const entry = await kv.get<DaySummary>(key);
  const current = entry.value;

  let summary: DaySummary;
  if (current) {
    const newTotal = current.totalChecks + 1;
    const newSuccess = current.successfulChecks + (result.ok ? 1 : 0);
    const newAvgLatency = Math.round(
      (current.avgLatencyMs * current.totalChecks + result.latencyMs) /
        newTotal,
    );
    summary = {
      date,
      totalChecks: newTotal,
      successfulChecks: newSuccess,
      avgLatencyMs: newAvgLatency,
      lastStatus: result.ok,
    };
  } else {
    summary = {
      date,
      totalChecks: 1,
      successfulChecks: result.ok ? 1 : 0,
      avgLatencyMs: result.latencyMs,
      lastStatus: result.ok,
    };
  }

  // Atomic write with version check
  await kv.atomic()
    .check(entry)
    .set(key, summary)
    .commit();

  // Also store the latest check result for instant display
  await kv.set(["latest", result.name], result);
}

/**
 * Get history for a service over the last N days.
 * Returns an array of DaySummary objects, one per day (oldest first).
 * Missing days are filled with null entries.
 */
export async function getHistory(
  serviceName: string,
  days?: number,
): Promise<(DaySummary | null)[]> {
  const kv = await getKv();
  const numDays = days || config.historyDays;
  const result: (DaySummary | null)[] = [];

  const now = new Date();
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = await kv.get<DaySummary>(["status", serviceName, dateStr]);
    result.push(entry.value);
  }

  return result;
}

/**
 * Get the latest check result for a service
 */
export async function getLatestCheck(
  serviceName: string,
): Promise<CheckResult | null> {
  const kv = await getKv();
  const entry = await kv.get<CheckResult>(["latest", serviceName]);
  return entry.value;
}

/**
 * Remove entries older than the configured history window
 */
export async function pruneOld(): Promise<number> {
  const kv = await getKv();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.historyDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  let pruned = 0;
  const iter = kv.list<DaySummary>({ prefix: ["status"] });
  for await (const entry of iter) {
    // Key shape: ["status", serviceName, "YYYY-MM-DD"]
    const dateStr = entry.key[2] as string;
    if (dateStr < cutoffStr) {
      await kv.delete(entry.key);
      pruned++;
    }
  }

  return pruned;
}
