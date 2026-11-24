const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 1234;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const countDatabaseUsers = () => {
  const ssh = countLines("/etc/a4nstore-tunnel/users.db", (line) => {
    const username = line.split("|")[0] || "";
    return line.split("|").length >= 3 && username && !username.startsWith("trial-");
  });

  const xray = { vmess: 0, vless: 0, trojan: 0 };
  try {
    const lines = fs.readFileSync("/etc/a4nstore-tunnel/xray-users.db", "utf8").split(/\\r?\\n/);
    for (const line of lines) {
      const fields = line.split("|");
      const protocol = fields[0];
      const username = fields[1] || "";
      if (xray[protocol] !== undefined && username && !username.startsWith("trial-")) {
        xray[protocol]++;
      }
    }
  } catch (_error) {
    // Database fallback unavailable; keep zero counts.
  }

  return {
    ssh,
    vmess: xray.vmess,
    vless: xray.vless,
    trojan: xray.trojan,
  };
};

const countLines = (file, predicate) => {
  try {
    return fs.readFileSync(file, "utf8").split(/\\r?\\n/).filter(predicate).length;
  } catch (_error) {
    return 0;
  }
};

const parsePotatoOutput = (stdout) => {
  const clean = stdout.replace(/\\x1B\\[[0-9;]*[a-zA-Z]/g, "");
  const lines = clean.split("\\n");
  const extractNumber = (line) => {
    const match = line?.match(/:\\s*(\\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };
  return {
    ssh: extractNumber(lines.find((line) => /SSH\/OPENVPN/i.test(line))),
    vmess: extractNumber(lines.find((line) => /VMESS/i.test(line))),
    vless: extractNumber(lines.find((line) => /VLESS/i.test(line))),
    trojan: extractNumber(lines.find((line) => /TROJAN/i.test(line))),
  };
};

const sendCounts = (res, counts, source) => res.json({
  ...counts,
  total: counts.ssh + counts.vmess + counts.vless + counts.trojan,
  source,
});

app.get("/totaluser", (_req, res) => {
  exec("desain p0t4t0", { timeout: 10000 }, (error, stdout) => {
    if (!error) {
      return sendCounts(res, parsePotatoOutput(stdout), "p0t4t0");
    }

    return sendCounts(res, countDatabaseUsers(), "database");
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
