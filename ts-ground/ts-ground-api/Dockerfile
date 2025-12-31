FROM denoland/deno:alpine-2.0.0

# Set working directory
WORKDIR /app

# Copy dependency files first for better caching
COPY deno.json deno.lock* ./

# Cache dependencies 
RUN deno cache --lock=deno.lock deno.json

# Copy source code
COPY . .

# Cache the main application
RUN deno cache src/main.ts

# Expose port
EXPOSE 8000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD deno eval --allow-net "try { const res = await fetch('http://localhost:8000/health'); Deno.exit(res.ok ? 0 : 1); } catch { Deno.exit(1); }"

# Run the application
CMD ["deno", "run", "--allow-all", "src/main.ts"]