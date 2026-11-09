# Deployment Guide — Ubuntu Server + HTTPS

> Prerequisites: Ubuntu 22.04+, a user with `sudo`, Python 3.11+, Node 20+, domain `extractkit.io` pointed at the server.

---

## 1. Namecheap DNS

In the **Namecheap Advanced DNS** panel for `extractkit.io`, add (or update) these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | `<server-ip>` | Automatic |
| A | www | `<server-ip>` | Automatic |

Remove any default Namecheap parking records (CNAME `www → parkingpage.namecheap.com`, etc.).
Wait for DNS propagation (usually a few minutes; up to 48 h in worst case) before proceeding to step 8.

---

## 2. System packages

```bash
sudo apt update && sudo apt install -y \
  python3-pip python3-venv python3-dev \
  postgresql postgresql-contrib \
  nginx \
  libpango-1.0-0 libpangoft2-1.0-0 libpangocairo-1.0-0 \
  libgdk-pixbuf2.0-0 libffi-dev libcairo2 \
  nodejs npm
```

---

## 3. PostgreSQL

```bash
sudo -u postgres psql <<'SQL'
CREATE USER extractkit WITH PASSWORD 'changeme';
CREATE DATABASE extractkit OWNER extractkit;
SQL
```

---

## 4. Clone & configure

```bash
cd /srv
sudo git clone https://github.com/karimimh/extractkit.git extractkit
sudo chown -R $USER:$USER /srv/extractkit
cd /srv/extractkit
```

Create `/srv/extractkit/.env` from the template:

```bash
cp .env.example .env
python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(50))
PY
```

Edit `/srv/extractkit/.env` for non-Docker production:

```ini
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_urlsafe(50))">
DEBUG=False
ALLOWED_HOSTS=extractkit.io,www.extractkit.io
CHANGE_MONITORING_ENABLED=false

POSTGRES_DB=extractkit
POSTGRES_USER=extractkit
POSTGRES_PASSWORD=changeme
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
VITE_API_BASE_URL=
VITE_ENABLE_CHANGE_MONITORING=false
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>

# Auth
GOOGLE_CLIENT_ID=<your-google-client-id>

# Change-monitor email notifications
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=<your-smtp-host>
EMAIL_PORT=587
EMAIL_HOST_USER=<your-smtp-user>
EMAIL_HOST_PASSWORD=<your-smtp-password>
EMAIL_USE_TLS=true
EMAIL_USE_SSL=false
DEFAULT_FROM_EMAIL=ExtractKit <notifications@extractkit.io>

# NOWPayments (crypto billing)
NOWPAYMENTS_API_KEY=<key>
NOWPAYMENTS_IPN_SECRET=<secret>
NOWPAYMENTS_SANDBOX=false
NOWPAYMENTS_IPN_CALLBACK_URL=https://extractkit.io/api/payments/webhook/
NOWPAYMENTS_SUCCESS_URL=https://extractkit.io?payment=success
NOWPAYMENTS_CANCEL_URL=https://extractkit.io?payment=cancelled

# Web conversion tools — AI Cleanup
OPENAI_API_KEY=<your-openai-api-key>
AI_CLEANUP_MODEL=gpt-4o-mini
CUSTOM_EXTRACTION_MODEL=gpt-4o-mini
AI_CLEANUP_RENDER_WAIT_MS=5000
# OPENAI_BASE_URL=<optional-compatible-api-base-url>
```

---

## 5. Backend

```bash
cd /srv/extractkit
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
PLAYWRIGHT_BROWSERS_PATH=/srv/extractkit/.playwright playwright install chromium --with-deps

cd backend
python manage.py migrate
python manage.py collectstatic --no-input
```

> `collectstatic` output goes to `backend/staticfiles/` (`STATIC_ROOT = BASE_DIR / 'staticfiles'` is set in settings.py).

---

## 6. Gunicorn systemd service

Create `/etc/systemd/system/extractkit.service`:

```ini
[Unit]
Description=extractkit Django
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/srv/extractkit/backend
EnvironmentFile=/srv/extractkit/.env
Environment=PLAYWRIGHT_BROWSERS_PATH=/srv/extractkit/.playwright
ExecStart=/srv/extractkit/.venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    backend.wsgi:application
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /srv/extractkit
sudo chown www-data:www-data /var/www          # needed for gunicorn control socket
sudo systemctl daemon-reload
sudo systemctl enable --now extractkit
```

### Scheduler systemd service

Scheduled exports do not run from Gunicorn. Create `/etc/systemd/system/extractkit-scheduler.service`:

```ini
[Unit]
Description=extractkit scheduled exports
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/srv/extractkit/backend
EnvironmentFile=/srv/extractkit/.env
Environment=PLAYWRIGHT_BROWSERS_PATH=/srv/extractkit/.playwright
ExecStart=/srv/extractkit/.venv/bin/python manage.py run_scheduled_exports --loop --interval 60
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now extractkit-scheduler
sudo systemctl status extractkit-scheduler
```

---

## 7. Frontend build

```bash
cd /srv/extractkit/frontend
npm ci
VITE_API_BASE_URL='' VITE_ENABLE_CHANGE_MONITORING=false npm run build
```

> **Why empty?** All API calls become `/api/...` (relative), which Nginx proxies to Gunicorn. The same build works regardless of the server IP or domain.

---

## 8. Nginx and HTTPS

DNS for both `extractkit.io` and `www.extractkit.io` must point at the server before this step.

Install Nginx and Certbot, then issue the certificate before writing the final Nginx config:

```bash
sudo apt install -y nginx certbot
sudo systemctl stop nginx || true
sudo certbot certonly --standalone -d extractkit.io -d www.extractkit.io
sudo systemctl start nginx
```

Create `/etc/nginx/sites-available/extractkit` with this complete config:

```nginx
# HTTP www → HTTPS non-www
server {
    listen 80;
    server_name www.extractkit.io;
    return 301 https://extractkit.io$request_uri;
}

# HTTPS www → HTTPS non-www
server {
    listen 443 ssl;
    server_name www.extractkit.io;
    ssl_certificate /etc/letsencrypt/live/extractkit.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/extractkit.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    return 301 https://extractkit.io$request_uri;
}

# HTTPS main site
server {
    listen 443 ssl;
    server_name extractkit.io;

    ssl_certificate /etc/letsencrypt/live/extractkit.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/extractkit.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    root /srv/extractkit/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /srv/extractkit/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    location /media/ {
        alias /srv/extractkit/backend/media/;
        add_header Cache-Control "private, no-store";
    }
}
```

Enable the site, reload Nginx, and test renewal:

```bash
sudo ln -sf /etc/nginx/sites-available/extractkit /etc/nginx/sites-enabled/extractkit
sudo nginx -t && sudo systemctl reload nginx
sudo certbot renew --dry-run

# Confirm: www redirects to non-www (expect: Location: https://extractkit.io/)
curl -I https://www.extractkit.io/
# Confirm: HTTP redirects to HTTPS non-www (expect: Location: https://extractkit.io/)
curl -I http://extractkit.io/
```

This config keeps `www` as a pure redirect and never serves content from it. That prevents Google Search Console from flagging `www` pages as "Alternate page with proper canonical tag".

---

## 9. Firewall

```bash
sudo ufw allow 'Nginx Full'   # opens ports 80 (HTTP) and 443 (HTTPS)
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 10. Verify

```bash
curl https://extractkit.io/api/developer/docs/   # Swagger UI
curl https://extractkit.io/               # Frontend
curl -I http://extractkit.io/             # Should return 301 redirect to HTTPS
sudo systemctl status extractkit                  # Gunicorn logs
sudo journalctl -u extractkit -f                  # Live logs
```

---

## 11. Create a superuser

```bash
cd /srv/extractkit/backend
source /srv/extractkit/.venv/bin/activate
python manage.py createsuperuser
```

Follow the prompts to set a username, email, and password. The Django admin panel will then be accessible at `https://extractkit.io/admin/`.

---

## 12. Updating the project

An `update.sh` script is included in the repo root. After the first deploy, just run:

```bash
sudo bash /srv/extractkit/update.sh
```

This pulls the latest commits, installs any new dependencies, runs migrations, rebuilds the frontend, and restarts all services.

> If only backend code changed (no new dependencies, no new migrations, no frontend changes), you can skip the full script and just restart Gunicorn:
> ```bash
> sudo systemctl restart extractkit
> ```

---

## Dockerized deployment

This path runs ExtractKit as four Docker Compose services:

- `frontend`: Nginx serving the Vite build and proxying API/admin requests
- `backend`: Django/Gunicorn
- `scheduler`: Django scheduled exports and webpage monitors
- `db`: PostgreSQL

### 1. Configure `.env`

```bash
cd /srv
sudo git clone https://github.com/karimimh/extractkit.git extractkit
sudo chown -R $USER:$USER /srv/extractkit
cd /srv/extractkit
cp .env.example .env
```

Edit `.env` for Docker production:

```ini
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_urlsafe(50))">
DEBUG=False
ALLOWED_HOSTS=extractkit.io,www.extractkit.io
CHANGE_MONITORING_ENABLED=false

POSTGRES_DB=extractkit
POSTGRES_USER=extractkit
POSTGRES_PASSWORD=<strong-password>
POSTGRES_HOST=db
POSTGRES_PORT=5432

VITE_API_BASE_URL=
VITE_ENABLE_CHANGE_MONITORING=false

NOWPAYMENTS_SANDBOX=false
NOWPAYMENTS_IPN_CALLBACK_URL=https://extractkit.io/api/payments/webhook/
NOWPAYMENTS_SUCCESS_URL=https://extractkit.io?payment=success
NOWPAYMENTS_CANCEL_URL=https://extractkit.io?payment=cancelled
```

Set the remaining Google OAuth, email, NOWPayments, and OpenAI values in the same `.env` file as needed.

### 2. Build and start

```bash
docker compose --env-file .env up -d --build
```

The Docker stack exposes the frontend on `http://localhost:8080` by default. The backend container runs migrations and `collectstatic` before starting Gunicorn. Static files, media files, logs, and Postgres data are stored in named Docker volumes.

### 3. Create an admin user

```bash
docker compose --env-file .env exec backend python manage.py createsuperuser
```

### 4. Logs and updates

```bash
docker compose --env-file .env logs -f backend
docker compose --env-file .env logs -f scheduler
docker compose --env-file .env restart backend scheduler
```

Apply updates with:

```bash
git pull
docker compose --env-file .env up -d --build
```

### 5. Reverse proxy for one or more websites

For one website on a server, you can change the frontend port mapping in `docker-compose.yml` to:

```yaml
ports:
  - "80:80"
```

For multiple websites on the same server, keep each Compose project on a different local port:

```yaml
ports:
  - "127.0.0.1:8080:80"
```

Then put Nginx, Caddy, or Traefik in front of the apps and route by domain:

- `extractkit.io` -> `127.0.0.1:8080`
- `second-site.com` -> `127.0.0.1:8081`

Terminate HTTPS at the front reverse proxy.

### 6. Backups

Back up the database and media volume regularly:

```bash
docker compose --env-file .env exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > extractkit.sql
```

Media files are in the `media_data` Docker volume. Include that volume in your server backup plan.

---

## Quick reference

| Service   | Command                                   |
|-----------|-------------------------------------------|
| Restart backend | `sudo systemctl restart extractkit`   |
| Stop backend    | `sudo systemctl stop extractkit`      |
| Start backend   | `sudo systemctl start extractkit`     |
| Rebuild frontend | `cd /srv/extractkit/frontend && VITE_API_BASE_URL='' npm run build` |
| Run migrations   | `cd /srv/extractkit/backend && /srv/extractkit/.venv/bin/python manage.py migrate` |
| Nginx reload     | `sudo systemctl reload nginx`        |
| Create superuser | `cd /srv/extractkit/backend && source /srv/extractkit/.venv/bin/activate && python manage.py createsuperuser` |
| Update project   | `sudo bash /srv/extractkit/update.sh` |
