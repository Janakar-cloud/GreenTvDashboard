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
      script: 'serve',          // uses `serve` npm package (global: sudo npm i -g serve)
      args: [
        'dist',                 // folder to serve (vite build output)
        '--listen', 'tcp:3039', // serve v14+ requires tcp: prefix
        '--single',             // SPA fallback — all routes → index.html
        '--no-clipboard',
      ],
      env: {
        NODE_ENV: 'production',
        PM2_SERVE_PATH: 'dist',
        PM2_SERVE_PORT: '3039',
        PM2_SERVE_SPA: 'true',
      },
      interpreter: 'none',     // `serve` is a standalone binary

      // ── process behaviour ──────────────────────────────────────────────
      instances: 1,            // one process is enough for a static server
      autorestart: true,
      watch: false,            // never watch — redeploy manually
      max_memory_restart: '200M',

      // ── logs ──────────────────────────────────────────────────────────
      out_file: '/home/ubuntu/.pm2/logs/thegreentv-dashboard-out.log',
      error_file: '/home/ubuntu/.pm2/logs/thegreentv-dashboard-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
