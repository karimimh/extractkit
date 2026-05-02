# Deployment Guide — Ubuntu Server + HTTPS

> Prerequisites: Ubuntu 22.04+, a user with `sudo`, Python 3.11+, Node 20+, domain `web2tailoredpdf.com` pointed at the server.

---

## 1. Namecheap DNS

In the **Namecheap Advanced DNS** panel for `web2tailoredpdf.com`, add (or update) these records:

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
CREATE USER webtopdf WITH PASSWORD 'changeme';
CREATE DATABASE web_to_pdf OWNER webtopdf;
SQL
```

---

## 4. Clone & configure

```bash
cd /srv
sudo git clone https://github.com/karimimh/web-to-pdf.git web-to-pdf
sudo chown -R $USER:$USER /srv/web-to-pdf
cd /srv/web-to-pdf
```

Create `/srv/web-to-pdf/.env`:

```ini
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_urlsafe(50))">
DEBUG=False
ALLOWED_HOSTS=web2tailoredpdf.com,www.web2tailoredpdf.com

POSTGRES_DB=web_to_pdf
POSTGRES_USER=webtopdf
POSTGRES_PASSWORD=changeme
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

GOOGLE_CLIENT_ID=<your-google-client-id>

NOWPAYMENTS_API_KEY=<key>
NOWPAYMENTS_IPN_SECRET=<secret>
NOWPAYMENTS_SANDBOX=false
NOWPAYMENTS_IPN_CALLBACK_URL=https://web2tailoredpdf.com/api/payments/ipn/
NOWPAYMENTS_SUCCESS_URL=https://web2tailoredpdf.com?payment=success
NOWPAYMENTS_CANCEL_URL=https://web2tailoredpdf.com?payment=cancelled
```

---

## 5. Backend

```bash
cd /srv/web-to-pdf
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
PLAYWRIGHT_BROWSERS_PATH=/srv/web-to-pdf/.playwright playwright install chromium --with-deps

cd backend
python manage.py migrate
python manage.py collectstatic --no-input
```

> `collectstatic` output goes to `backend/staticfiles/` (`STATIC_ROOT = BASE_DIR / 'staticfiles'` is set in settings.py).

---

## 6. Gunicorn systemd service

Create `/etc/systemd/system/webtopdf.service`:

```ini
[Unit]
Description=web-to-pdf Django
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/srv/web-to-pdf/backend
EnvironmentFile=/srv/web-to-pdf/.env
Environment=PLAYWRIGHT_BROWSERS_PATH=/srv/web-to-pdf/.playwright
ExecStart=/srv/web-to-pdf/.venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    backend.wsgi:application
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /srv/web-to-pdf
sudo chown www-data:www-data /var/www          # needed for gunicorn control socket
sudo systemctl daemon-reload
sudo systemctl enable --now webtopdf
```

---

## 7. Frontend build

```bash
cd /srv/web-to-pdf/frontend
npm ci
VITE_API_BASE_URL='' npm run build   # empty = relative paths, Nginx handles proxying
```

> **Why empty?** The API calls become `/api/...` (relative), which Nginx proxies to Gunicorn. This means the same build works regardless of the server IP or domain.

---

## 8. Nginx

Create `/etc/nginx/sites-available/webtopdf` (HTTP only at this stage — Certbot will add HTTPS in step 9):

```nginx
server {
    listen 80;
    server_name web2tailoredpdf.com www.web2tailoredpdf.com;

    # Frontend static files
    root /srv/web-to-pdf/frontend/dist;
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
        alias /srv/web-to-pdf/backend/staticfiles/;
    }

    location /media/ {
        alias /srv/web-to-pdf/backend/media/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/webtopdf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 9. HTTPS with Let's Encrypt (Certbot)

> DNS must be propagated before running this step.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d web2tailoredpdf.com -d www.web2tailoredpdf.com
```

Certbot will:
- Obtain a free TLS certificate from Let's Encrypt
- Edit `/etc/nginx/sites-available/webtopdf` to add SSL and an HTTP→HTTPS redirect
- Install a systemd timer for automatic renewal (verify with `sudo systemctl status certbot.timer`)

Test renewal without actually renewing:

```bash
sudo certbot renew --dry-run
```

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
curl https://web2tailoredpdf.com/api/docs/      # Swagger UI
curl https://web2tailoredpdf.com/               # Frontend
curl -I http://web2tailoredpdf.com/             # Should return 301 redirect to HTTPS
sudo systemctl status webtopdf                  # Gunicorn logs
sudo journalctl -u webtopdf -f                  # Live logs
```

---

## 12. Create a superuser

```bash
cd /srv/web-to-pdf/backend
source /srv/web-to-pdf/.venv/bin/activate
python manage.py createsuperuser
```

Follow the prompts to set a username, email, and password. The Django admin panel will then be accessible at `https://web2tailoredpdf.com/admin/`.

---

## 13. Updating the project

An `update.sh` script is included in the repo root. After the first deploy, just run:

```bash
sudo bash /srv/web-to-pdf/update.sh
```

This pulls the latest commits, installs any new dependencies, runs migrations, rebuilds the frontend, and restarts all services.

> If only backend code changed (no new dependencies, no new migrations, no frontend changes), you can skip the full script and just restart Gunicorn:
> ```bash
> sudo systemctl restart webtopdf
> ```

---

## Quick reference

| Service   | Command                                   |
|-----------|-------------------------------------------|
| Restart backend | `sudo systemctl restart webtopdf`   |
| Stop backend    | `sudo systemctl stop webtopdf`      |
| Start backend   | `sudo systemctl start webtopdf`     |
| Rebuild frontend | `cd /srv/web-to-pdf/frontend && VITE_API_BASE_URL='' npm run build` |
| Run migrations   | `cd /srv/web-to-pdf/backend && /srv/web-to-pdf/.venv/bin/python manage.py migrate` |
| Nginx reload     | `sudo systemctl reload nginx`        |
| Create superuser | `cd /srv/web-to-pdf/backend && source /srv/web-to-pdf/.venv/bin/activate && python manage.py createsuperuser` |
| Update project   | `sudo bash /srv/web-to-pdf/update.sh` |
