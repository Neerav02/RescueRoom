/**
 * RescueRoom Production PM2 Cluster Configuration
 * Enables zero-downtime reloads, process clustering, and log rotation
 */

module.exports = {
  apps: [
    {
      name: 'rescueroom-production',
      script: 'server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_staging: {
        NODE_ENV: 'development',
        PORT: 3001,
        ALLOW_DEMO_ROSTER: 'true',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      combine_logs: true,
      merge_logs: true,
    },
  ],
};

