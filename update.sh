#!/bin/bash

set -e

INSTALL_DIR="/root/backed-totaluser"

echo "========================================="
echo "   Update VPN Total User Backend"
echo "========================================="

cd "$INSTALL_DIR"

echo "[1/3] Pull latest code..."
git pull

echo "[2/3] Install dependencies..."
npm install

echo "[3/3] Restart server..."
pm2 restart vpn-backend

echo ""
echo "========================================="
echo "   Update Selesai!"
echo "========================================="
echo ""
pm2 status vpn-backend
echo ""
