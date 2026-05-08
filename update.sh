#!/usr/bin/env bash
set -euo pipefail

PROJECT=/srv/web-to-pdf

cd "$PROJECT"
git fetch origin
git reset --hard origin/main

source .venv/bin/activate
pip install -q -r backend/requirements.txt

cd backend
python manage.py migrate --no-input
python manage.py collectstatic --no-input
cd ..

cd frontend
npm ci --silent
VITE_API_BASE_URL='' npm run build
cd ..

sudo chown -R www-data:www-data "$PROJECT"
sudo systemctl restart webtopdf
sudo systemctl reload nginx

echo "Update complete."
