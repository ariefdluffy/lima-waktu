#!/bin/bash
# Script deployment untuk lima-waktu
set -e

echo "Starting deployment..."

# 1. Pull terbaru
git pull origin main

# 2. Install & Build
npm install
npm run db:migrate
npm run build

# 3. Restart PM2 dengan TZ=Asia/Makassar
#    ecosystem.config.cjs mengatur env TZ agar runtime Node memakai WITA
if pm2 list | grep -q "lima-waktu"; then
  pm2 restart lima-waktu --update-env
else
  pm2 start ecosystem.config.cjs
fi

echo "Deployment finished!"
