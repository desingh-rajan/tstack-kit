/**
 * Base HTML layout for the status page.
 * Inline CSS -- no external dependencies at runtime.
 * Supports dark (default) and light themes via CSS custom properties.
 * Theme preference is persisted in localStorage.
 */
export function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="60">
  <title>${escapeHtml(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ------------------------------------------------------------------ */
    /* Theme tokens                                                         */
    /* ------------------------------------------------------------------ */
    html[data-theme="dark"] {
      --bg:          #0f1117;
      --bg-card:     #161b22;
      --border:      #30363d;
      --border-foot: #21262d;
      --text:        #e1e4e8;
      --muted:       #8b949e;
      --very-muted:  #484f58;
      --link:        #58a6ff;
      --seg-empty:   #21262d;
      --toggle-bg:   #21262d;
      --toggle-icon: "☀️";
    }
    html[data-theme="light"] {
      --bg:          #f6f8fa;
      --bg-card:     #ffffff;
      --border:      #d0d7de;
      --border-foot: #d0d7de;
      --text:        #1f2328;
      --muted:       #57606a;
      --very-muted:  #8c959f;
      --link:        #0969da;
      --seg-empty:   #d0d7de;
      --toggle-bg:   #e8ecf0;
      --toggle-icon: "🌙";
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 0;
      transition: background 0.2s, color 0.2s;
    }
    .container { max-width: 860px; margin: 0 auto; padding: 40px 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .header h1 { font-size: 24px; font-weight: 600; }
    .header .subtitle { color: var(--muted); font-size: 13px; margin-top: 4px; }

    /* theme toggle button */
    .theme-toggle {
      background: var(--toggle-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 6px 10px;
      flex-shrink: 0;
      margin-top: 2px;
      transition: background 0.2s, border-color 0.2s;
    }
    .theme-toggle:hover { opacity: 0.8; }

    .banner {
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 32px;
    }
    .banner.operational { background: #1a7f37; color: #fff; }
    .banner.degraded    { background: #9a6700; color: #fff; }
    .banner.major       { background: #cf222e; color: #fff; }

    .uptime-note {
      text-align: center;
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 16px;
    }

    .service-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px 24px;
      margin-bottom: 16px;
      transition: background 0.2s, border-color 0.2s;
    }
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .service-name { font-size: 15px; font-weight: 500; }
    .status-badge { font-size: 13px; font-weight: 600; }
    .status-badge.up      { color: #3fb950; }
    .status-badge.down    { color: #f85149; }
    .status-badge.unknown { color: var(--muted); }

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
    .uptime-bar .segment:hover  { opacity: 0.8; }
    .uptime-bar .segment.ok     { background: #3fb950; }
    .uptime-bar .segment.fail   { background: #f85149; }
    .uptime-bar .segment.partial { background: #d29922; }
    .uptime-bar .segment.empty  { background: var(--seg-empty); }

    .uptime-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--muted);
    }

    .footer {
      text-align: center;
      color: var(--very-muted);
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border-foot);
    }
    .footer a { color: var(--link); text-decoration: none; }
    .footer a:hover { text-decoration: underline; }

    .latency { color: var(--muted); font-size: 12px; margin-left: 8px; font-weight: 400; }

    @media (max-width: 600px) {
      .container { padding: 20px 12px; }
      .header h1 { font-size: 20px; }
      .uptime-bar { height: 24px; }
    }
  </style>
  <script>
    // Apply saved theme before first paint to avoid flash
    (function () {
      var t = localStorage.getItem("ts-status-theme");
      if (t === "light" || t === "dark") {
        document.documentElement.setAttribute("data-theme", t);
      }
      // Sync button icon once DOM is ready
      document.addEventListener("DOMContentLoaded", function () {
        var btn = document.getElementById("theme-btn");
        if (btn) {
          btn.textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
        }
      });
    })();
  </script>
</head>
<body>
  <div class="container">
    ${body}
  </div>
  <script>
    function toggleTheme() {
      var html = document.documentElement;
      var next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      localStorage.setItem("ts-status-theme", next);
      var btn = document.getElementById("theme-btn");
      if (btn) btn.textContent = next === "dark" ? "☀️" : "🌙";
    }
  </script>
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
