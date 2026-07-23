const express = require("express");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 1234;

let cachedData = null;
let lastFetch = 0;
const CACHE_TTL = 60000;

const fetchUsers = () => {
  return new Promise((resolve, reject) => {
    exec("bash -c 'source ~/.bashrc 2>/dev/null; desain p0t4t0'", { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) return reject(stderr || error.message);

      const clean = stdout.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
      const lines = clean.split("\n");

      const sshMatch = lines.find((l) => /SSH\/OPENVPN/i.test(l));
      const vmessMatch = lines.find((l) => /VMESS/i.test(l));
      const vlessMatch = lines.find((l) => /VLESS/i.test(l));
      const trojanMatch = lines.find((l) => /TROJAN/i.test(l));

      const extractNumber = (line) => {
        if (!line) return null;
        const m = line.match(/:\s*(\d+)/);
        return m ? parseInt(m[1], 10) : null;
      };

      const ssh = extractNumber(sshMatch) || 0;
      const vmess = extractNumber(vmessMatch) || 0;
      const vless = extractNumber(vlessMatch) || 0;
      const trojan = extractNumber(trojanMatch) || 0;

      resolve({ ssh, vmess, vless, trojan, total: ssh + vmess + vless + trojan });
    });
  });
};

const updateCache = async () => {
  try {
    cachedData = await fetchUsers();
    lastFetch = Date.now();
  } catch (e) {
    console.error("Cache update failed:", e);
  }
};

setInterval(updateCache, CACHE_TTL);
updateCache();

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/totaluser", (_req, res) => {
  if (cachedData && Date.now() - lastFetch < CACHE_TTL) {
    return res.json(cachedData);
  }
  if (cachedData) {
    updateCache();
    return res.json(cachedData);
  }
  res.status(503).json({ error: "Data belum siap" });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});