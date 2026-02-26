import { assertEquals } from "@std/assert";
import { checkService, getMonitoredServices } from "./checker.ts";

Deno.test("checker", async (t) => {
  await t.step(
    "checkService returns ok:false for unreachable host",
    async () => {
      const result = await checkService(
        "Unreachable",
        "http://127.0.0.1:19999/health",
      );
      assertEquals(result.ok, false);
      assertEquals(result.name, "Unreachable");
      assertEquals(typeof result.latencyMs, "number");
      assertEquals(typeof result.checkedAt, "string");
    },
  );

  await t.step("checkService measures latency", async () => {
    // Even failed connections should report latency
    const result = await checkService(
      "LatencyTest",
      "http://127.0.0.1:19999/health",
    );
    assertEquals(result.latencyMs >= 0, true);
  });

  await t.step(
    "getMonitoredServices returns configured services",
    () => {
      const services = getMonitoredServices();
      // Default config has 3 services
      assertEquals(services.length, 3);
      assertEquals(services[0].name, "API");
      assertEquals(services[1].name, "Storefront");
      assertEquals(services[2].name, "Admin UI");
    },
  );
});
