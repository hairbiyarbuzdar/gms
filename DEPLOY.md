# Deploying Iron Reserve to a VPS

Ubuntu/Debian VPS with Node 20+, PostgreSQL, Nginx, and PM2 already installed.
Replace `gms.example.com` with your domain and `deploy` with your Linux user
throughout.

---

## 1. Find a free port

The app listens on localhost only; Nginx is the sole public entry point.

```bash
# What is already listening?
sudo ss -tlnp | awk '{print $4, $7}' | grep -E ':[0-9]+' | sort -u
```

Pick a port nothing is using — 3000 is the Next.js default, so try that first
and fall back to 3001/3002 if it is taken.

```bash
# Confirm a specific port is free (no output = free)
sudo ss -tlnp | grep ':3000'
```

Note the port you chose; it is used in three places below.

---

## 2. Clone and install

```bash
cd /var/www          # or wherever you keep apps
git clone https://github.com/hairbiyarbuzdar/gms.git ironreserve
cd ironreserve

npm ci               # exact versions from package-lock.json
```

`npm ci` also runs `prisma generate` through the postinstall hook.

Do **not** use `npm ci --omit=dev`: the Prisma CLI, `tsx`, and `dotenv` are dev
dependencies but are needed to migrate, seed, and build.

---

## 3. Create the database

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE ironreserve;
CREATE USER ironreserve WITH ENCRYPTED PASSWORD 'a-long-random-password';
GRANT ALL PRIVILEGES ON DATABASE ironreserve TO ironreserve;
\c ironreserve
GRANT ALL ON SCHEMA public TO ironreserve;
\q
```

The last `GRANT` matters on PostgreSQL 15+ — without it migrations fail with
a permission error on the public schema.

---

## 4. Configure the environment

```bash
cp .env.example .env
nano .env
```

```dotenv
DATABASE_URL="postgresql://ironreserve:a-long-random-password@localhost:5432/ironreserve?schema=public"

# Generate a fresh one. Never reuse the development secret.
AUTH_SECRET="paste-output-of-openssl-rand-base64-32"

# Must be the real public origin, https included. Auth.js builds redirect
# URLs from this, so a wrong value breaks login in a way that looks like a
# cookie problem.
AUTH_URL="https://gms.example.com"

# Used once by the seed to create the first superadmin.
SUPERADMIN_EMAIL="you@example.com"
SUPERADMIN_PASSWORD="a-strong-password-at-least-12-chars"

# The port chosen in step 1.
PORT=3000
```

Generate the secret:

```bash
openssl rand -base64 32
```

Lock the file down — it holds the database password:

```bash
chmod 600 .env
```

---

## 5. Migrate, seed, build

```bash
npx prisma generate
npx prisma migrate deploy    # applies migrations; never use `migrate dev` in production
npm run db:seed              # creates the first superadmin
npm run build
```

`db:seed` is idempotent — running it twice will not create a second account or
overwrite the password.

---

## 6. Start under PM2

```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save                     # remember the process list across reboots
pm2 startup                  # prints a command to run with sudo; run it
```

Check it is serving:

```bash
pm2 status
curl -I http://127.0.0.1:3000/login     # expect HTTP/1.1 200
pm2 logs ironreserve --lines 30
```

---

## 7. Nginx

```bash
sudo cp deploy/nginx.conf.template /etc/nginx/sites-available/ironreserve
sudo sed -i 's/YOUR_DOMAIN/gms.example.com/g; s/APP_PORT/3000/g' \
    /etc/nginx/sites-available/ironreserve

sudo ln -s /etc/nginx/sites-available/ironreserve /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default    # only if nothing else needs it

sudo nginx -t
sudo systemctl reload nginx
```

Confirm DNS resolves to this VPS before continuing:

```bash
dig +short gms.example.com
curl -I http://gms.example.com/login
```

---

## 8. HTTPS

```bash
sudo certbot --nginx -d gms.example.com
```

Certbot edits the site config: adds the TLS block, moves the app to port 443,
and leaves a redirect on port 80. Choose "redirect" when prompted.

Verify renewal is armed:

```bash
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

---

## 9. Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

The app port itself is **not** opened — it is reachable only from localhost,
which is the point of putting Nginx in front.

---

## 10. Verify

```bash
curl -I https://gms.example.com/login        # 200
curl -I https://gms.example.com/             # 307 -> /login
```

Then in a browser: sign in as the superadmin, create a tenant, sign out, and
sign in as that tenant.

---

## Backups

Nothing else here protects the data. Set this up on day one.

```bash
sudo mkdir -p /var/backups/ironreserve
sudo tee /usr/local/bin/backup-ironreserve.sh >/dev/null <<'EOF'
#!/bin/bash
set -euo pipefail
STAMP=$(date +%F)
sudo -u postgres pg_dump ironreserve | gzip > /var/backups/ironreserve/db-$STAMP.sql.gz
# Keep 14 days.
find /var/backups/ironreserve -name 'db-*.sql.gz' -mtime +14 -delete
EOF
sudo chmod +x /usr/local/bin/backup-ironreserve.sh

# 2am daily
echo "0 2 * * * root /usr/local/bin/backup-ironreserve.sh" | sudo tee /etc/cron.d/ironreserve-backup
```

Copy the dumps off the box periodically — a backup on the same disk does not
survive losing the disk.

---

## Deploying an update

```bash
cd /var/www/ironreserve
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart ironreserve
```

Run `prisma migrate deploy` **before** restarting: the new code may expect
columns the old schema does not have.

---

## Troubleshooting

**502 Bad Gateway** — the app is not running or is on a different port.
`pm2 status`, then `pm2 logs ironreserve`.

**Login redirects in a loop** — `AUTH_URL` does not match the address in the
browser. It must be the exact public origin, `https://` included.

**"Unknown argument" from Prisma after an update** — the client is stale.
`npx prisma generate && pm2 restart ironreserve`.

**Migration fails on permissions** — the `GRANT ALL ON SCHEMA public` from
step 3 was skipped.

**Nginx serves the default page** — the `default` symlink in
`sites-enabled` is still present and matching first.
