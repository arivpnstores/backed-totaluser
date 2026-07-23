# VPN Total User Backend

Mini backend REST API untuk mengambil jumlah total akun VPN dari server.

## Persyaratan

- Node.js v18+
- npm
- Command `p0t4t0` sudah terinstall dan bisa dijalankan di terminal

## Install

```bash
npm install
```

## Menjalankan

```bash
npm start
```

Server akan berjalan di port **1234** (default).

### Ganti Port

```bash
PORT=8080 npm start
```

### Ganti API Key

```bash
API_KEY=RAHASIA123 npm start
```

## Menjalankan dengan PM2

```bash
pm2 start index.js --name vpn-backend
pm2 save
pm2 startup
```

Perintah lain yang berguna:

```bash
pm2 status
pm2 logs vpn-backend
pm2 restart vpn-backend
pm2 stop vpn-backend
pm2 delete vpn-backend
```

## Buka Port Firewall (UFW)

```bash
sudo ufw allow 1234/tcp
sudo ufw reload
```

## API Endpoints

### Health Check

```
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

### Total User

```
GET /totaluser
Header: x-api-key: ARIVPN123
```

Response (200):

```json
{
  "ssh": 69,
  "vmess": 76,
  "vless": 10,
  "trojan": 11,
  "total": 166
}
```

Response (401 - API Key salah/tidak ada):

```json
{
  "error": "Unauthorized"
}
```

Response (500 - Command gagal):

```json
{
  "error": "Gagal menjalankan command p0t4t0",
  "details": "error message"
}
```

## Contoh Penggunaan dengan curl

```bash
curl -H "x-api-key: ARIVPN123" http://IP_SERVER:1234/totaluser
```

## Contoh Penggunaan dengan JavaScript

```javascript
const res = await fetch("http://IP_SERVER:1234/totaluser", {
  headers: { "x-api-key": "ARIVPN123" },
});
const data = await res.json();
console.log(data);
```
