import type { CheckResult } from "../checker.ts";
import type { DaySummary } from "../store.ts";
import { escapeHtml, layout } from "./layout.ts";
import { config } from "../config.ts";

interface ServiceData {
  name: string;
  latest: CheckResult | null;
  history: (DaySummary | null)[];
  uptimePercent: string;
}

/**
 * Render the full status page HTML
 */
export function renderStatusPage(services: ServiceData[]): string {
  const allUp = services.every((s) => s.latest?.ok !== false);
  const anyDown = services.some((s) => s.latest?.ok === false);
  const hasData = services.some((s) => s.latest !== null);

  let bannerClass: string;
  let bannerText: string;

  if (!hasData) {
    bannerClass = "degraded";
    bannerText = "Collecting Data...";
  } else if (allUp) {
    bannerClass = "operational";
    bannerText = "All Systems Operational";
  } else if (anyDown) {
    // Check if ALL are down
    const allDown = services.every((s) => s.latest?.ok === false);
    if (allDown) {
      bannerClass = "major";
      bannerText = "Major Outage";
    } else {
      bannerClass = "degraded";
      bannerText = "Partial System Outage";
    }
  } else {
    bannerClass = "operational";
    bannerText = "All Systems Operational";
  }

  const serviceCards = services.map((s) => renderServiceCard(s)).join("\n");

  const body = `
    <div class="header">
      <div>
        <h1>${escapeHtml(config.siteTitle)}</h1>
        <div class="subtitle">Service health monitoring</div>
      </div>
      <button id="theme-btn" class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">☀️</button>
    </div>

    <div class="banner ${bannerClass}">${bannerText}</div>

    <div class="uptime-note">Uptime over the past ${config.historyDays} days.</div>

    ${serviceCards}

    <div class="footer">
      Powered by <a href="https://github.com/desingh-rajan/tstack-kit">TStack Kit</a>
    </div>
  `;

  return layout(config.siteTitle, body);
}

function renderServiceCard(service: ServiceData): string {
  const statusClass = service.latest === null
    ? "unknown"
    : service.latest.ok
    ? "up"
    : "down";

  const statusText = service.latest === null
    ? "Unknown"
    : service.latest.ok
    ? "Operational"
    : "Down";

  const latency = service.latest
    ? `<span class="latency">${service.latest.latencyMs}ms</span>`
    : "";

  const databaseInfo = service.latest?.database
    ? ` | DB: ${escapeHtml(service.latest.database)}`
    : "";

  const segments = service.history.map((day) => {
    if (day === null) {
      return `<div class="segment empty" title="No data"></div>`;
    }
    const pct = day.totalChecks > 0
      ? ((day.successfulChecks / day.totalChecks) * 100).toFixed(1)
      : "0.0";

    let cls: string;
    if (day.successfulChecks === day.totalChecks) {
      cls = "ok";
    } else if (day.successfulChecks === 0) {
      cls = "fail";
    } else {
      cls = "partial";
    }

    return `<div class="segment ${cls}" title="${day.date}: ${pct}% uptime (${day.totalChecks} checks)"></div>`;
  }).join("\n        ");

  return `
    <div class="service-card">
      <div class="service-header">
        <span class="service-name">${
    escapeHtml(service.name)
  }${latency}${databaseInfo}</span>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      <div class="uptime-bar">
        ${segments}
      </div>
      <div class="uptime-meta">
        <span>${config.historyDays} days ago</span>
        <span>${service.uptimePercent}% uptime</span>
        <span>Today</span>
      </div>
    </div>
  `;
}
