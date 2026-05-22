#!/bin/bash
# Script deployment untuk lima-waktu
set -e

echo "Starting deployment..."

# 1. Pull terbaru
git pull origin main

# 2. Install & Build
npm install
npm run build

# 3. Restart PM2
if pm2 list | grep -q "lima-waktu"; then
  pm2 restart lima-waktu
else
  pm2 start build/index.js --name "lima-waktu"
fi

echo "Deployment finished!"
