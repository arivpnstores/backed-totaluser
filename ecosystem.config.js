module.exports = {
  apps: [
    {
      name: "vpn-backend",
      script: "index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "128M",
      env: {
        NODE_ENV: "production",
        PORT: 1234,
      },
    },
  ],
};
