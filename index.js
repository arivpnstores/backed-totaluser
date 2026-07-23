const express = require("express");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 1234;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/totaluser", (_req, res) => {
  exec("source /root/.bashrc && desain p0t4t0", { timeout: 10000, shell: "/bin/bash" }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        error: "Gagal menjalankan command desain p0t4t0",
        details: stderr || error.message,
      });
    }

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

    const ssh = extractNumber(sshMatch);
    const vmess = extractNumber(vmessMatch);
    const vless = extractNumber(vlessMatch);
    const trojan = extractNumber(trojanMatch);

    if (ssh === null && vmess === null && vless === null && trojan === null) {
      return res.status(500).json({
        error: "Gagal memparse output command",
        raw: clean,
      });
    }

    const sshVal = ssh || 0;
    const vmessVal = vmess || 0;
    const vlessVal = vless || 0;
    const trojanVal = trojan || 0;

    res.json({
      ssh: sshVal,
      vmess: vmessVal,
      vless: vlessVal,
      trojan: trojanVal,
      total: sshVal + vmessVal + vlessVal + trojanVal,
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
