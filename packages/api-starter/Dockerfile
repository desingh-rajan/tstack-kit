# Stage 1: Cache dependencies and compile
FROM denoland/deno:alpine-2.6.4 AS builder

WORKDIR /app

COPY deno.json deno.lock* ./
RUN deno cache --lock=deno.lock deno.json

COPY src/ ./src/
RUN deno cache src/main.ts

# Stage 2: Minimal runtime image
FROM denoland/deno:alpine-2.6.4

WORKDIR /app

# Copy only what the runtime needs
COPY --from=builder /app/deno.json ./
COPY --from=builder /app/deno.lock* ./
COPY --from=builder /app/src/ ./src/
# Copy the Deno module cache from builder
COPY --from=builder /root/.cache/deno /root/.cache/deno

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD deno eval "try { const res = await fetch('http://localhost:8000/health'); Deno.exit(res.ok ? 0 : 1); } catch { Deno.exit(1); }"

USER deno

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write=/tmp", "src/main.ts"]
