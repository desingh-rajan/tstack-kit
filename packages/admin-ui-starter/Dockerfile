# Production image — multi-stage build for minimal size

# Stage 1: Build
FROM denoland/deno:latest AS builder

WORKDIR /app

COPY deno.json deno.lock* ./
RUN deno install

COPY . .
RUN deno run -A npm:vite build

# Stage 2: Runtime
FROM denoland/deno:alpine-2.6.4

WORKDIR /app

COPY --from=builder /app/deno.json ./
COPY --from=builder /app/deno.lock* ./
COPY --from=builder /app/_fresh/ ./_fresh/
COPY --from=builder /root/.cache/deno /root/.cache/deno

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD deno eval "try { const r = await fetch('http://localhost:3001/'); Deno.exit(r.ok ? 0 : 1); } catch { Deno.exit(1); }"

CMD ["serve", "-A", "--port=3001", "_fresh/server.js"]
