/**
 * PM2 process definition for Iron Reserve.
 *
 * PORT is read from the environment so the deploy can pick whichever port is
 * free without editing this file. Nginx proxies to the same value.
 *
 * Start with:  pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: "ironreserve",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      // A tight crash loop should stop rather than hammer the database.
      max_restarts: 10,
      min_uptime: "20s",
      // Restart if the process leaks past this; Next in production sits well below.
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
      },
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
