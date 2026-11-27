const express = require("express");
const { exec, execFile } = require("child_process");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 1234;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const scDatabase = () => {
  const candidates = [
    process.env.POTATO_DB,
    process.env.DB_PATH,
    "/etc/sc-1forcr/sc-1forcr.db",
    "/etc/sc-1forcr/database.db",
    "/root/tunnel-sync/tunnel.db",
  ].filter(Boolean);
  return candidates.find((file) => fs.existsSync(file));
};

const countScDatabaseUsers = (callback) => {
  const database = scDatabase();
  if (!database) return callback(null);

  const sql = `SELECT
    (SELECT COUNT(*) FROM account_sshs WHERE LOWER(COALESCE(username,'')) NOT LIKE 'trial%') AS ssh,
    (SELECT COUNT(*) FROM account_vmesses WHERE LOWER(COALESCE(username,'')) NOT LIKE 'trial%') AS vmess,
    (SELECT COUNT(*) FROM account_vlesses WHERE LOWER(COALESCE(username,'')) NOT LIKE 'trial%') AS vless,
    (SELECT COUNT(*) FROM account_trojans WHERE LOWER(COALESCE(username,'')) NOT LIKE 'trial%') AS trojan;`;

  execFile("sqlite3", ["-json", database, sql], { timeout: 5000 }, (error, stdout) => {
    if (error) return callback(null);
    try {
      const row = JSON.parse(stdout)[0];
      callback({ ssh: row.ssh, vmess: row.vmess, vless: row.vless, trojan: row.trojan });
    } catch (_error) {
      callback(null);
    }
  });
};

const countDatabaseUsers = () => {
  const ssh = countLines("/etc/a4nstore-tunnel/users.db", (line) => {
    const username = line.split("|")[0] || "";
    return line.split("|").length >= 3 && username && !username.toLowerCase().startsWith("trial");
  });
  const xray = { vmess: 0, vless: 0, trojan: 0 };
  try {
    for (const line of fs.readFileSync("/etc/a4nstore-tunnel/xray-users.db", "utf8").split(/\r?\n/)) {
      const [protocol, username] = line.split("|");
      if (xray[protocol] !== undefined && username && !username.toLowerCase().startsWith("trial")) xray[protocol]++;
    }
  } catch (_error) {}
  return { ssh, ...xray };
};

const hasA4nstore = () => fs.existsSync("/etc/a4nstore-tunnel/users.db") || fs.existsSync("/etc/a4nstore-tunnel/xray-users.db");

const countLines = (file, predicate) => {
  try {
    return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(predicate).length;
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
  countScDatabaseUsers((scCounts) => {
    if (scCounts) return sendCounts(res, scCounts, "1forcr");
    if (hasA4nstore()) return sendCounts(res, countDatabaseUsers(), "a4nstore");

    exec("command -v desain >/dev/null 2>&1 && timeout 8s desain p0t4t0", { timeout: 10000 }, (error, stdout) => {
    if (!error && stdout.trim()) {
      return sendCounts(res, parsePotatoOutput(stdout), "p0t4t0");
    }

    const python = [
      "import json",
      "from pathlib import Path",
      "def rows(path, protocol=None):",
      "    try: lines = Path(path).read_text().splitlines()",
      "    except Exception: return 0",
      "    total = 0",
      "    for line in lines:",
      "        f = line.split('|')",
      "        if protocol is None:",
      "            ok = len(f) >= 3 and f[0] and not f[0].lower().startswith('trial')",
      "        else:",
      "            ok = len(f) >= 2 and f[0] == protocol and f[1] and not f[1].lower().startswith('trial')",
      "        total += int(bool(ok))",
      "    return total",
      "d = {'ssh': rows('/etc/a4nstore-tunnel/users.db'), 'vmess': rows('/etc/a4nstore-tunnel/xray-users.db', 'vmess'), 'vless': rows('/etc/a4nstore-tunnel/xray-users.db', 'vless'), 'trojan': rows('/etc/a4nstore-tunnel/xray-users.db', 'trojan')}",
      "print(json.dumps(d))",
    ].join("\\n");

    execFile("python3", ["-c", python], { timeout: 5000 }, (pythonError, stdout) => {
      if (pythonError) return sendCounts(res, countDatabaseUsers(), "database");
      try {
        return sendCounts(res, JSON.parse(stdout), "database-python");
      } catch (_error) {
        return sendCounts(res, countDatabaseUsers(), "database");
      }
    });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
