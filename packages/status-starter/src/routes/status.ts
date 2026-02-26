import type { Context } from "hono";
import { getMonitoredServices } from "../checker.ts";
import { getHistory, getLatestCheck } from "../store.ts";
import { renderStatusPage } from "../views/statusPage.ts";

/**
 * GET / - Render the status page
 */
export async function statusHandler(c: Context): Promise<Response> {
  const services = getMonitoredServices();

  const serviceData = await Promise.all(
    services.map(async (s) => {
      const [latest, history] = await Promise.all([
        getLatestCheck(s.name),
        getHistory(s.name),
      ]);

      // Compute overall uptime %
      const daysWithData = history.filter((d) => d !== null);
      let uptimePercent = "100.0";
      if (daysWithData.length > 0) {
        const totalChecks = daysWithData.reduce(
          (sum, d) => sum + d!.totalChecks,
          0,
        );
        const successChecks = daysWithData.reduce(
          (sum, d) => sum + d!.successfulChecks,
          0,
        );
        uptimePercent = totalChecks > 0
          ? ((successChecks / totalChecks) * 100).toFixed(2)
          : "100.0";
      }

      return { name: s.name, latest, history, uptimePercent };
    }),
  );

  const html = renderStatusPage(serviceData);
  return c.html(html);
}
