# Deployment Guide

## Local Network Deployment

This guide covers deploying the baby tracker app on your local network so both parents can access it from any device.

## Prerequisites

- PostgreSQL database server running
- Node.js 18+ installed
- Network access between devices

## Environment Setup

### 1. Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=baby_feeding
DB_USER=username
DB_PASSWORD=password

# Application Configuration
NUXT_HOST=0.0.0.0
NUXT_PORT=3300

# Optional: For production builds
NODE_ENV=production
```

### 2. Database Setup

```bash
# Install PostgreSQL client
npm install pg @types/pg

# Create database manually or via SQL
createdb baby_feeding

# Run SQL schema creation
psql baby_feeding < schema.sql
```

## Development Deployment

### 1. Start Development Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at:
- Local: `http://localhost:3300`
- Network: `http://[your-ip]:3300`

### 2. Find Your Local IP Address

**Linux/WSL:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig | findstr "IPv4"
```

**macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## Production Deployment

### 1. Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Generate static files (optional)
npm run generate
```

### 2. Start Production Server

```bash
# Start production server
npm run preview
```

### 3. Using PM2 (Recommended)

Install PM2 for process management:

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'baby-feeding',
    script: '.output/server/index.mjs',
    cwd: '/home/rehuel/projects/baby-feeding',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      NUXT_HOST: '0.0.0.0',
      NUXT_PORT: 3300
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Network Configuration

*Note: Network configuration is handled separately and not included in this deployment guide.*

## Accessing the App

### From Other Devices

1. **Find the server's IP address** (as shown above)
2. **Open a web browser** on any device on the same network
3. **Navigate to** `http://[server-ip]:3300`

### Example URLs

- Desktop: `http://192.168.1.100:3300`
- Mobile: `http://192.168.1.100:3300`
- Tablet: `http://192.168.1.100:3300`

## SSL/HTTPS Setup (Optional)

For enhanced security, you can set up HTTPS using a self-signed certificate:

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update nuxt.config.ts
export default defineNuxtConfig({
  // ... existing config
  nitro: {
    experimental: {
      wasm: true
    }
  },
  server: {
    https: {
      key: './key.pem',
      cert: './cert.pem'
    }
  }
})
```

## Monitoring and Maintenance

### 1. Log Management

```bash
# View PM2 logs
pm2 logs baby-feeding

# View real-time logs
pm2 logs baby-feeding --lines 100 -f
```

### 2. Database Backups

Create a backup script:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backup_$DATE.sql"
echo "Backup created: backup_$DATE.sql"
```

Make it executable and run daily:

```bash
chmod +x backup.sh
# Add to crontab for daily backups
0 2 * * * /path/to/backup.sh
```

### 3. Health Checks

Create a simple health check endpoint:

```javascript
// app/server/api/health.get.js
export default defineEventHandler(async (event) => {
  try {
    // Check database connection
    await $fetch('/api/feedings?limit=1')
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Health check failed'
    })
  }
})
```

## Troubleshooting

### Common Issues

1. **Cannot access from other devices**
   - Check firewall settings
   - Verify IP address
   - Ensure devices are on same network

2. **Database connection errors**
   - Verify DB_* variables in .env
   - Check PostgreSQL is running
   - Test connection: `psql -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME`

3. **Port already in use**
   - Change port in .env: `NUXT_PORT=3301`
   - Kill existing process: `lsof -ti:3300 | xargs kill`

4. **Build errors**
   - Clear cache: `rm -rf .nuxt .output node_modules`
   - Reinstall: `npm install`

### Performance Optimization

1. **Enable compression**
2. **Use CDN for static assets**
3. **Implement caching headers**
4. **Database query optimization**

## Security Considerations

1. **Local Network Only**: App is designed for local network use
2. **No Authentication**: Consider adding basic auth for production
3. **Data Privacy**: All data stays on your local network
4. **Regular Backups**: Implement automated backup strategy
5. **Updates**: Keep dependencies updated for security patches
