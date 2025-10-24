FROM denoland/deno:2.0.0

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

# Create data directory for SQLite
RUN mkdir -p data

# Expose port
EXPOSE 8000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD deno run --allow-net --allow-env -A -q -c '
    try { 
      const res = await fetch("http://localhost:8000/health"); 
      if (res.ok) Deno.exit(0); 
      else Deno.exit(1); 
    } catch { 
      Deno.exit(1); 
    }'

# Run the application
CMD ["deno", "run", "--allow-all", "src/main.ts"]