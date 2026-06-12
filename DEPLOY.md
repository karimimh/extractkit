# Deployment Guide — Ubuntu Server + HTTPS

> Prerequisites: Ubuntu 22.04+, a user with `sudo`, Python 3.11+, Node 20+, domain `distillpage.com` pointed at the server.

---

## 1. Namecheap DNS

In the **Namecheap Advanced DNS** panel for `distillpage.com`, add (or update) these records:

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
CREATE USER distillpage WITH PASSWORD 'changeme';
CREATE DATABASE distillpage OWNER distillpage;
SQL
```

---

## 4. Clone & configure

```bash
cd /srv
sudo git clone https://github.com/karimimh/distillpage.git distillpage
sudo chown -R $USER:$USER /srv/distillpage
cd /srv/distillpage
```

Create `/srv/distillpage/.env`:

```ini
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_urlsafe(50))">
DEBUG=False
ALLOWED_HOSTS=distillpage.com,www.distillpage.com
CHANGE_MONITORING_ENABLED=false

POSTGRES_DB=distillpage
POSTGRES_USER=distillpage
POSTGRES_PASSWORD=changeme
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

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
DEFAULT_FROM_EMAIL=DistillPage <notifications@distillpage.com>

# NOWPayments (crypto billing)
NOWPAYMENTS_API_KEY=<key>
NOWPAYMENTS_IPN_SECRET=<secret>
NOWPAYMENTS_SANDBOX=false
NOWPAYMENTS_IPN_CALLBACK_URL=https://distillpage.com/api/payments/webhook/
NOWPAYMENTS_SUCCESS_URL=https://distillpage.com?payment=success
NOWPAYMENTS_CANCEL_URL=https://distillpage.com?payment=cancelled

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
cd /srv/distillpage
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
PLAYWRIGHT_BROWSERS_PATH=/srv/distillpage/.playwright playwright install chromium --with-deps

cd backend
python manage.py migrate
python manage.py collectstatic --no-input
```

> `collectstatic` output goes to `backend/staticfiles/` (`STATIC_ROOT = BASE_DIR / 'staticfiles'` is set in settings.py).

---

## 6. Gunicorn systemd service

Create `/etc/systemd/system/distillpage.service`:

```ini
[Unit]
Description=distillpage Django
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/srv/distillpage/backend
EnvironmentFile=/srv/distillpage/.env
Environment=PLAYWRIGHT_BROWSERS_PATH=/srv/distillpage/.playwright
ExecStart=/srv/distillpage/.venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    backend.wsgi:application
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /srv/distillpage
sudo chown www-data:www-data /var/www          # needed for gunicorn control socket
sudo systemctl daemon-reload
sudo systemctl enable --now distillpage
```

### Scheduler systemd service

Scheduled exports do not run from Gunicorn. Create `/etc/systemd/system/distillpage-scheduler.service`:

```ini
[Unit]
Description=distillpage scheduled exports
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/srv/distillpage/backend
EnvironmentFile=/srv/distillpage/.env
Environment=PLAYWRIGHT_BROWSERS_PATH=/srv/distillpage/.playwright
ExecStart=/srv/distillpage/.venv/bin/python manage.py run_scheduled_exports --loop --interval 60
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now distillpage-scheduler
sudo systemctl status distillpage-scheduler
```

---

## 7. Frontend build

```bash
cd /srv/distillpage/frontend
npm ci
VITE_API_BASE_URL='' VITE_ENABLE_CHANGE_MONITORING=false npm run build
```

> **Why empty?** All API calls become `/api/...` (relative), which Nginx proxies to Gunicorn. The same build works regardless of the server IP or domain.

---

## 8. Nginx

Create `/etc/nginx/sites-available/distillpage` (HTTP only at this stage — Certbot will add HTTPS in step 9).

> **Important:** Use two separate server blocks so `www` is a pure redirect and never serves content. This prevents Google Search Console from flagging `www` pages as "Alternate page with proper canonical tag".

```nginx
# Redirect www → non-www (Certbot will upgrade this to HTTPS in step 9)
server {
    listen 80;
    server_name www.distillpage.com;
    return 301 http://distillpage.com$request_uri;
}

# Main site
server {
    listen 80;
    server_name distillpage.com;

    # Frontend static files
    root /srv/distillpage/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Django API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django admin & static/media
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /srv/distillpage/backend/staticfiles/;
    }

    location /media/ {
        alias /srv/distillpage/backend/media/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/distillpage /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 9. HTTPS with Let's Encrypt (Certbot)

> DNS must be propagated before running this step.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d distillpage.com -d www.distillpage.com
```

Certbot will:
- Obtain a free TLS certificate from Let's Encrypt
- Edit `/etc/nginx/sites-available/distillpage` to add SSL and HTTP→HTTPS redirects
- Install a systemd timer for automatic renewal (verify with `sudo systemctl status certbot.timer`)

After Certbot runs, verify the www block still redirects to the non-www URL (not to `https://www.`). The www server block should look like this:

```nginx
server {
    listen 443 ssl;
    server_name www.distillpage.com;
    ssl_certificate /etc/letsencrypt/live/distillpage.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/distillpage.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    return 301 https://distillpage.com$request_uri;
}
```

If Certbot changed the redirect target to `https://$host$request_uri` inside the www block, fix it manually:

```bash
sudo nano /etc/nginx/sites-available/distillpage
# Change:  return 301 https://$host$request_uri;
# To:      return 301 https://distillpage.com$request_uri;
# (only inside the www.distillpage.com server blocks)
sudo nginx -t && sudo systemctl reload nginx
```

Test renewal without actually renewing:

```bash
sudo certbot renew --dry-run
```

---

## 9a. Fix www redirect on an already-deployed server

If the site is already live and Google Search Console reports **"Alternate page with proper canonical tag"** or **"Page with redirect"** for www URLs, the deployed Nginx config needs to be patched.

```bash
# View the current config to understand what Certbot generated
sudo cat /etc/nginx/sites-available/distillpage
```

Replace any `server_name www.distillpage.com` block (both port 80 and port 443) so they only redirect:

```nginx
# HTTP www → HTTPS non-www
server {
    listen 80;
    server_name www.distillpage.com;
    return 301 https://distillpage.com$request_uri;
}

# HTTPS www → HTTPS non-www
server {
    listen 443 ssl;
    server_name www.distillpage.com;
    ssl_certificate /etc/letsencrypt/live/distillpage.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/distillpage.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    return 301 https://distillpage.com$request_uri;
}
```

Apply and verify:

```bash
sudo nginx -t && sudo systemctl reload nginx

# Confirm: www redirects to non-www (expect: Location: https://distillpage.com/)
curl -I https://www.distillpage.com/
# Confirm: HTTP redirects to HTTPS non-www (expect: Location: https://distillpage.com/)
curl -I http://distillpage.com/
```

After applying, go to Google Search Console → **Sitemaps** → resubmit the sitemap, then use **URL Inspection** on `https://distillpage.com/` and request reindexing.

---

## 10. Firewall

```bash
sudo ufw allow 'Nginx Full'   # opens ports 80 (HTTP) and 443 (HTTPS)
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 11. Verify

```bash
curl https://distillpage.com/api/docs/      # Swagger UI
curl https://distillpage.com/               # Frontend
curl -I http://distillpage.com/             # Should return 301 redirect to HTTPS
sudo systemctl status distillpage                  # Gunicorn logs
sudo journalctl -u distillpage -f                  # Live logs
```

---

## 12. Create a superuser

```bash
cd /srv/distillpage/backend
source /srv/distillpage/.venv/bin/activate
python manage.py createsuperuser
```

Follow the prompts to set a username, email, and password. The Django admin panel will then be accessible at `https://distillpage.com/admin/`.

---

## 13. Updating the project

An `update.sh` script is included in the repo root. After the first deploy, just run:

```bash
sudo bash /srv/distillpage/update.sh
```

This pulls the latest commits, installs any new dependencies, runs migrations, rebuilds the frontend, and restarts all services.

> If only backend code changed (no new dependencies, no new migrations, no frontend changes), you can skip the full script and just restart Gunicorn:
> ```bash
> sudo systemctl restart distillpage
> ```

---

## Quick reference

| Service   | Command                                   |
|-----------|-------------------------------------------|
| Restart backend | `sudo systemctl restart distillpage`   |
| Stop backend    | `sudo systemctl stop distillpage`      |
| Start backend   | `sudo systemctl start distillpage`     |
| Rebuild frontend | `cd /srv/distillpage/frontend && VITE_API_BASE_URL='' npm run build` |
| Run migrations   | `cd /srv/distillpage/backend && /srv/distillpage/.venv/bin/python manage.py migrate` |
| Nginx reload     | `sudo systemctl reload nginx`        |
| Create superuser | `cd /srv/distillpage/backend && source /srv/distillpage/.venv/bin/activate && python manage.py createsuperuser` |
| Update project   | `sudo bash /srv/distillpage/update.sh` |
