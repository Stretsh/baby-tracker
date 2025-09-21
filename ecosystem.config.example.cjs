module.exports = {
  apps: [
    {
      name: 'baby-tracker',
      script: '.output/server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        NUXT_PUBLIC_API_BASE: '/api',
        NUXT_PUBLIC_DB_HOST: 'localhost',
        NUXT_PUBLIC_DB_PORT: '5432',
        NUXT_PUBLIC_DB_NAME: 'baby-tracker',
        NUXT_PUBLIC_DB_USER: 'baby-tracker',
        DB_PASSWORD: 'your-database-password-here'
      },
      health_check_grace_period: 5000,
      health_check_interval: 30000,
      health_check_timeout: 10000,
      health_check_fatal_exceptions: true,
      health_check_http: {
        url: 'http://localhost:3000/api/health',
        timeout: 5000
      }
    }
  ]
};
