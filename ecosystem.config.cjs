// PM2 Ecosystem — GreenTV Dashboard
// Manages the frontend as a production static-file service.
// Usage:
//   pm2 start ecosystem.config.cjs
//   pm2 reload ecosystem.config.cjs   ← zero-downtime redeploy
//   pm2 save ; pm2 startup            ← survive reboots

module.exports = {
  apps: [
    {
      name: 'thegreentv-dashboard',
      script: 'npm',
      args: 'run serve:prod',
      cwd: '/home/ubuntu/dashboard/GreenTvDashboard',
      interpreter: 'none',              // npm is a binary, not a node script

      // ── process behaviour ──────────────────────────────────────────────
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',

      // ── logs ──────────────────────────────────────────────────────────
      out_file: '/home/ubuntu/.pm2/logs/thegreentv-dashboard-out.log',
      error_file: '/home/ubuntu/.pm2/logs/thegreentv-dashboard-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
