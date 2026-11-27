# VPN Total User Backend

Mini backend REST API untuk mengambil jumlah total akun VPN dari server menggunakan **Potato Tunneling (p0t4t0)**, **A4NStore**, atau **SC 1FORCR**.

## Tentang

Backend otomatis mendeteksi panel yang tersedia dengan urutan:

1. **Potato Tunneling (p0t4t0)** — menjalankan command `desain p0t4t0` dengan timeout 60 detik.
2. **SC 1FORCR** — membaca database SQLite tabel `account_*`.
3. **A4NStore** — membaca `users.db` dan `xray-users.db`.

Username yang diawali `trial` tidak dihitung.

Script panel berjalan di VPS Linux (Ubuntu/Debian) dan menyediakan layanan:

- SSH/OpenVPN
- Vmess (Xray)
- Vless (Xray)
- Trojan (Xray)

Backend membaca sumber aktif otomatis lalu menampilkan jumlah akun VPN dalam format JSON. Jika command `desain p0t4t0` tersedia dan menghasilkan jumlah user lebih dari 0, hasil Potato dipakai. Jika gagal atau menghasilkan 0, backend lanjut ke SC 1FORCR lalu A4NStore.

## Persyaratan

- VPS Linux (Ubuntu 20.04/22.04/24.04 atau Debian 11/12)
- Script **Potato Tunneling** (`p0t4t0`) sudah terinstall
- Node.js v18+
- npm

## GitHub

https://github.com/arivpnstores/backed-totaluser

## Install (Otomasatis)

Cukup jalankan 1 perintah ini di VPS:

```bash
wget -O install.sh https://raw.githubusercontent.com/arivpnstores/backed-totaluser/main/install.sh && chmod +x install.sh && ./install.sh
```

Script installer akan otomatis:
- Install Node.js
- Install PM2
- Install dependencies
- Start server dengan PM2
- Buka port firewall

## Menjalankan

```bash
npm start
```

Server akan berjalan di port **1234** (default).

## Update (Otomasatis)

Cukup jalankan 1 perintah ini di VPS:

```bash
wget -O update.sh https://raw.githubusercontent.com/arivpnstores/backed-totaluser/main/update.sh && chmod +x update.sh && ./update.sh
```

### Ganti Port

```bash
PORT=8080 npm start
```

## Menjalankan dengan PM2

```bash
pm2 start ecosystem.config.js
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

```text
GET /totaluser
```

Deteksi panel otomatis:

```text
Potato p0t4t0 → SC 1FORCR → A4NStore
```

Response menyertakan field `source` dengan nilai `1forcr`, `a4nstore`, atau `p0t4t0`.

Response (200):

```json
{
  "ssh": 96,
  "vmess": 68,
  "vless": 7,
  "trojan": 5,
  "total": 176
}
```

Response (500 - Command gagal):

```json
{
  "error": "Tidak dapat membaca data user dari SC 1FORCR, A4NStore, atau p0t4t0",
  "details": "error message"
}
```

## Contoh Penggunaan

### curl

```bash
curl http://IP_SERVER:1234/totaluser
```

### JavaScript

```javascript
const res = await fetch("http://IP_SERVER:1234/totaluser");
const data = await res.json();
console.log(data);
```

### Telegram Bot

```javascript
const total = await fetch("http://IP_SERVER:1234/totaluser")
  .then((r) => r.json())
  .then((d) => d.total);
bot.sendMessage(chatId, `Total user VPN: ${total}`);
```

## Output Example

```
┌─────────────────────────────────────────────────┐
│                 POTATO TUNNELING                │
└─────────────────────────────────────────────────┘
     ┌───────────────────────────────────────┐
                   LIST ACCOUNTS
          SSH/OPENVPN    : 96  ACCOUNT
          VMESS          : 68  ACCOUNT
          VLESS          : 7   ACCOUNT
          TROJAN         : 5   ACCOUNT
     └───────────────────────────────────────┘
```

API akan mengkonversi output di atas menjadi:

```json
{
  "ssh": 96,
  "vmess": 68,
  "vless": 7,
  "trojan": 5,
  "total": 176
}
```
