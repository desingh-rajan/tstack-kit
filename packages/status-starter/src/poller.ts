import { checkService, getMonitoredServices } from "./checker.ts";
import { config } from "./config.ts";
import { pruneOld, recordCheck } from "./store.ts";

/**
 * Run a single check cycle against all monitored services
 */
export async function runCheckCycle(): Promise<void> {
  const services = getMonitoredServices();

  // Check all services in parallel
  const results = await Promise.all(
    services.map((s) => checkService(s.name, s.url)),
  );

  // Record all results
  for (const result of results) {
    await recordCheck(result);
  }
}

/**
 * Start the background poller.
 * Runs an initial check immediately, then repeats at the configured interval.
 * Also prunes old history once per cycle.
 */
export function startPoller(): number {
  const intervalMs = config.checkIntervalSeconds * 1000;

  // Initial check
  runCheckCycle().catch((err) =>
    console.error("[poller] initial check failed:", err)
  );

  // Repeat on interval
  const id = setInterval(async () => {
    try {
      await runCheckCycle();
      // Prune old entries periodically (cheap, runs inline)
      await pruneOld();
    } catch (err) {
      console.error("[poller] check cycle failed:", err);
    }
  }, intervalMs);

  console.log(
    `[poller] Monitoring ${getMonitoredServices().length} services every ${config.checkIntervalSeconds}s`,
  );

  return id;
}
