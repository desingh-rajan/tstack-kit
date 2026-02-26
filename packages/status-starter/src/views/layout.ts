/**
 * Base HTML layout for the status page.
 * Inline CSS -- no external dependencies at runtime.
 */
export function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="60">
  <title>${escapeHtml(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0f1117;
      color: #e1e4e8;
      min-height: 100vh;
      padding: 0;
    }
    .container { max-width: 860px; margin: 0 auto; padding: 40px 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .header h1 { font-size: 24px; font-weight: 600; }
    .header .subtitle { color: #8b949e; font-size: 13px; margin-top: 4px; }

    .banner {
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 32px;
    }
    .banner.operational { background: #1a7f37; color: #fff; }
    .banner.degraded { background: #9a6700; color: #fff; }
    .banner.major { background: #cf222e; color: #fff; }

    .uptime-note {
      text-align: center;
      color: #8b949e;
      font-size: 13px;
      margin-bottom: 16px;
    }

    .service-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 20px 24px;
      margin-bottom: 16px;
    }
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .service-name { font-size: 15px; font-weight: 500; }
    .status-badge { font-size: 13px; font-weight: 600; }
    .status-badge.up { color: #3fb950; }
    .status-badge.down { color: #f85149; }
    .status-badge.unknown { color: #8b949e; }

    .uptime-bar {
      display: flex;
      gap: 2px;
      height: 32px;
      margin-bottom: 8px;
    }
    .uptime-bar .segment {
      flex: 1;
      border-radius: 2px;
      min-width: 2px;
      position: relative;
    }
    .uptime-bar .segment:hover { opacity: 0.8; }
    .uptime-bar .segment.ok { background: #3fb950; }
    .uptime-bar .segment.fail { background: #f85149; }
    .uptime-bar .segment.partial { background: #d29922; }
    .uptime-bar .segment.empty { background: #21262d; }

    .uptime-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #8b949e;
    }

    .footer {
      text-align: center;
      color: #484f58;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #21262d;
    }
    .footer a { color: #58a6ff; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }

    .latency { color: #8b949e; font-size: 12px; margin-left: 8px; font-weight: 400; }

    @media (max-width: 600px) {
      .container { padding: 20px 12px; }
      .header h1 { font-size: 20px; }
      .uptime-bar { height: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${body}
  </div>
</body>
</html>`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
