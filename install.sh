#!/bin/bash

set -e

echo "========================================="
echo "   VPN Total User Backend Installer"
echo "========================================="

# Check root
if [ "$EUID" -ne 0 ]; then
  echo "Jalankan dengan sudo: sudo bash install.sh"
  exit 1
fi

# Install Node.js
if ! command -v node &> /dev/null; then
  echo "[1/6] Install Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "[1/6] Node.js sudah terinstall: $(node -v)"
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
  echo "[2/6] Install PM2..."
  npm install -g pm2
else
  echo "[2/6] PM2 sudah terinstall"
fi

# Clone or update repo
INSTALL_DIR="/opt/vpn-backend"
echo "[3/6] Download source code..."
if [ -d "$INSTALL_DIR" ]; then
  cd "$INSTALL_DIR"
  git pull
else
  git clone https://github.com/arivpnstores/backed-totaluser.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# Install dependencies
echo "[4/6] Install dependencies..."
npm install

# Start with PM2
echo "[5/6] Start server dengan PM2..."
pm2 delete vpn-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Open firewall
echo "[6/6] Buka port firewall..."
if command -v ufw &> /dev/null; then
  ufw allow 1234/tcp
  ufw reload
  echo "Port 1234 dibuka via UFW"
else
  echo "UFW tidak ditemukan, silakan buka port 1234 manual"
fi

echo ""
echo "========================================="
echo "   Install Selesai!"
echo "========================================="
echo ""
echo "Cek status : pm2 status"
echo "Cek logs   : pm2 logs vpn-backend"
echo "Restart    : pm2 restart vpn-backend"
echo ""
echo "Akses API  : http://$(hostname -I | awk '{print $1}'):1234/totaluser"
echo "Health     : http://$(hostname -I | awk '{print $1}'):1234/health"
echo ""
