# ️ Using SQLite in Production

## Why SQLite is Perfect for Small Client Projects

For clients with 1-3 concurrent users, SQLite is often the **better choice**
than PostgreSQL.

---

## Advantages for Your Use Case

### 1. **Simplicity**

- No separate database server to manage
- No connection pooling issues
- No network latency
- File-based: `data/production.db`

### 2. **Performance**

- **Faster reads** than PostgreSQL for single-server apps
- **Lower latency** (no network roundtrip)
- **Less memory** usage

### 3. **Cost**

- **$0** database hosting fees
- Deploy anywhere (even $5/month VPS)
- No need for managed database services

### 4. **Reliability**

- **ACID compliant** (just like PostgreSQL)
- **Battle-tested** (used by millions of apps)
- **Zero maintenance** (no database updates, patches)

### 5. **Portability**

- Easy backups (just copy the `.db` file)
- Easy migrations (copy file to new server)
- Easy development (prod = dev setup)

---

## When SQLite is Perfect

**1-10 concurrent users** (your case: 1-3 users) **Read-heavy workloads**
(product catalogs, blogs, APIs) **Moderate write volume** (< 1000 writes/second)
**Single server deployment** (not distributed) **Budget-conscious clients**
**Simple infrastructure requirements**

---

## ️ When to Use PostgreSQL Instead

**High concurrent writes** (50+ users writing simultaneously) **Multi-server
deployment** (load balancer + multiple API servers) **Complex queries** (heavy
JOINs, full-text search, PostGIS) **Large teams** (10+ developers working on
same database) **Replication needs** (read replicas, high availability)

---

## Production Configuration for SQLite

### 1. Enable WAL Mode (Write-Ahead Logging)

WAL mode allows **concurrent reads during writes** - essential for production!

```typescript
// src/config/database.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

const sqlite = new Database(
  Deno.env.get("DATABASE_URL") || "./data/production.db",
);

// Enable WAL mode for better concurrency
sqlite.pragma("journal_mode = WAL");

// Optimize for performance
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("cache_size = 10000");
sqlite.pragma("temp_store = MEMORY");

export const db = drizzle(sqlite);
```

### 2. Set up Automatic Backups

```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="./data/production.db"
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.db"

mkdir -p $BACKUP_DIR

# Create backup
cp $DB_FILE $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.db" -mtime +30 -delete

echo " Backup created: $BACKUP_FILE"
EOF

chmod +x backup-db.sh

# Run daily via cron
crontab -e
# Add: 0 2 * * * /path/to/backup-db.sh
```

### 3. Use Litestream (Recommended!)

[Litestream](https://litestream.io) continuously backs up SQLite to
S3/Azure/GCS.

```bash
# Install litestream
wget https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz
tar -xzf litestream-v0.3.13-linux-amd64.tar.gz
sudo mv litestream /usr/local/bin/

# Configure litestream
cat > litestream.yml << 'EOF'
dbs:
 - path: /path/to/data/production.db
 replicas:
 - type: s3
 bucket: your-backup-bucket
 path: db
 region: us-east-1
 access-key-id: ${AWS_ACCESS_KEY_ID}
 secret-access-key: ${AWS_SECRET_ACCESS_KEY}
EOF

# Run with your app
litestream replicate -config litestream.yml
```

### 4. Production Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=8000
DATABASE_URL=/var/www/app/data/production.db
JWT_SECRET=your-super-secure-random-string-here
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=https://client-domain.com

# Optional: For litestream backups
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

---

## Performance Optimization

### 1. Create Indexes

```typescript
// src/entities/products/product.model.ts
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  stock: integer("stock").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => ({
  // Add indexes for frequently queried fields
  slugIdx: index("slug_idx").on(table.slug),
  categoryIdx: index("category_idx").on(table.category),
  priceIdx: index("price_idx").on(table.price),
}));
```

### 2. Connection Optimization

```typescript
// src/config/database.ts
const sqlite = new Database(dbPath, {
  // Read-only connections for read operations
  readonly: false,

  // Must be false for WAL mode
  fileMustExist: false,
});

// Performance tuning
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL"); // Faster writes, still safe
sqlite.pragma("cache_size = 10000"); // 10MB cache
sqlite.pragma("mmap_size = 30000000000"); // Memory-mapped I/O
sqlite.pragma("page_size = 4096"); // Optimal page size
```

### 3. Query Optimization

```typescript
// Use prepared statements (Drizzle does this automatically)
// Batch inserts when possible
const products = await db.insert(productsTable).values([
  { name: "Product 1", price: 10 },
  { name: "Product 2", price: 20 },
  // ... more products
]);

// Use transactions for multiple writes
await db.transaction(async (tx) => {
  await tx.insert(ordersTable).values(orderData);
  await tx.update(productsTable).set({ stock: newStock });
});
```

---

## Docker Deployment with SQLite

```dockerfile
# Dockerfile
FROM denoland/deno:2.0.0

WORKDIR /app

# Copy application
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Install dependencies
RUN deno cache src/main.ts

# Volume for database (important!)
VOLUME ["/app/data"]

EXPOSE 8000

CMD ["deno", "task", "start"]
```

```yaml
# docker-compose.yml
version: "3.8"

services:
  api:
  build: .
  ports:
    - "8000:8000"
  volumes:
    # Persist database outside container
    - ./data:/app/data
    - ./backups:/app/backups
  environment:
  NODE_ENV: production
  DATABASE_URL: /app/data/production.db
  JWT_SECRET: ${JWT_SECRET}
  restart: unless-stopped
```

---

## Backup Strategies

### Strategy 1: Simple File Copy (Good)

```bash
# Daily backup via cron
0 2 * * * cp /var/www/app/data/production.db /var/www/app/backups/backup_$(date +\%Y\%m\%d).db
```

### Strategy 2: Litestream (Better)

Continuous replication to S3/Azure/GCS. Automatic recovery.

```bash
# Start app with litestream
litestream replicate -config litestream.yml -exec "deno task start"
```

### Strategy 3: rsync to Backup Server (Good)

```bash
# Hourly sync to backup server
0 * * * * rsync -avz /var/www/app/data/production.db backup-server:/backups/
```

---

## Deployment Options

### Option 1: VPS (DigitalOcean, Hetzner, Linode)

**Cost:** $5-20/month **Perfect for:** Small client projects

```bash
# On VPS
cd /var/www/myapp
git pull
deno task migrate:run
deno task start
```

### Option 2: Docker + Any Host

**Cost:** Varies **Perfect for:** Containerized deployments

```bash
docker-compose --profile prod up -d
```

### Option 3: Deno Deploy (with SQLite limitation)

**Note:** Deno Deploy is serverless, so you'd need a persistent volume or switch
to their KV storage.

---

## When to Migrate from SQLite to PostgreSQL

You'll know it's time when:

1. **More than 10 concurrent writers** (not readers!)
2. **Multiple API servers** behind load balancer
3. **Database > 100GB** (though SQLite handles this fine)
4. **Need advanced features** (full-text search, PostGIS, etc.)
5. **Client grows to 50+ employees**

### Migration Path (Easy!)

Your code is already ready! Just change:

```bash
# .env.production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

That's it! Drizzle works with both SQLite and PostgreSQL.

---

## Real-World Examples

### Successful SQLite Production Apps:

1. **Expensify** - Millions of users, SQLite on device
2. **Litestream** - Self-hosted apps with S3 backups
3. **Many SaaS apps** - Small to medium scale
4. **Internal tools** - Perfect for 1-50 users
5. **E-commerce sites** - Up to 10k products, 1k orders/day

---

## Final Recommendation

**For your clients (1-3 people):**

**Use SQLite in production** **Enable WAL mode** **Set up Litestream or daily
backups** **Use Docker with persistent volumes** **Monitor performance (will be
great)**

You're already set up for this! Just:

1. Keep `DATABASE_URL=./data/production.db` in `.env.production`
2. Enable WAL mode in `database.ts`
3. Set up backups
4. Deploy!

**You can always migrate to PostgreSQL later if needed - your code won't
change!**

---

## 🔗 Resources

- [SQLite in Production](https://www.sqlite.org/whentouse.html)
- [Litestream](https://litestream.io)
- [SQLite Performance Tuning](https://www.sqlite.org/pragma.html)
- [Drizzle with SQLite](https://orm.drizzle.team/docs/get-started-sqlite)
