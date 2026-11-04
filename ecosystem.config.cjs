/**
 * NexPress CMS — PM2 Production Ecosystem Configuration
 * Kullanım:
 *   pm2 start ecosystem.config.cjs
 *   pm2 reload nexpress --update-env
 *   pm2 logs nexpress
 */
module.exports = {
  apps: [
    {
      name: "nexpress",
      script: "./scripts/start.cjs",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./data/logs/pm2-error.log",
      out_file: "./data/logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};

