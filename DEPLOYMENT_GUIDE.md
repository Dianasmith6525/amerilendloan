# AmeriLend Production Deployment Guide

## ✅ Build Complete

Your AmeriLend application has been successfully built and is ready for deployment. Here's what was accomplished:

### Build Results
- **Client**: Vite build completed with optimized assets in `dist/public/`
- **Server**: esbuild bundled server code in `dist/index.js`
- **Size**: 283KB server bundle + optimized client assets
- **Database**: Schema migrations generated and ready to apply

## 🚀 Deployment Options

### Option 1: Direct Node.js Deployment (Recommended)
```bash
# Set production environment
$env:NODE_ENV='production'

# Start the server
node dist/index.js
```

### Option 2: Process Manager (PM2)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name amerilend

# Save PM2 configuration
pm2 save
```

### Option 3: Docker Deployment
```bash
# Build container
docker build -t amerilend .

# Run container
docker run -p 3000:3000 -e NODE_ENV=production amerilend
```

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Create a `.env` file with production values (see `ENVIRONMENT_CONFIGURATION.md`):

```bash
# Core Settings
NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.com
DATABASE_URL=mysql://user:password@host:port/amerilend
JWT_SECRET=your-secure-secret-key
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-admin-openid

# Email (SendGrid)
EMAIL_SERVICE_API_KEY=SG.your-sendgrid-key
EMAIL_FROM_ADDRESS=noreply@your-domain.com

# Payment Providers
STRIPE_SECRET_KEY=sk_live_your-stripe-key
AUTHORIZENET_API_LOGIN_ID=your-login-id
COINBASE_COMMERCE_API_KEY=your-coinbase-key

# File Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET_NAME=amerilend-documents
```

### 2. Database Setup
```bash
# Apply migrations
npm run db:push
```

### 3. Domain Configuration
- Point your domain to the server
- Configure SSL certificate (Let's Encrypt recommended)
- Set up reverse proxy if needed

### 4. Payment Webhooks
Configure webhook URLs in your payment provider dashboards:
- **Stripe**: `https://your-domain.com/api/webhooks/stripe`
- **Authorize.net**: `https://your-domain.com/api/webhooks/authorizenet`
- **Coinbase**: `https://your-domain.com/api/webhooks/crypto`

## 🔧 Production Server Setup

### Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name amerilend --env production

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Monitor logs
pm2 logs amerilend
```

### Using systemd
Create `/etc/systemd/system/amerilend.service`:

```ini
[Unit]
Description=AmeriLend Loan Application Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/amerilend
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable amerilend
sudo systemctl start amerilend
```

## 🌐 Reverse Proxy Setup (Nginx)

Create `/etc/nginx/sites-available/amerilend`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable SSL with Let's Encrypt:
```bash
sudo certbot --nginx -d your-domain.com
```

## 📊 Monitoring & Maintenance

### Health Checks
The application includes built-in health endpoints:
- `GET /` - Basic health check
- `GET /api/health` - Detailed health status

### Logs
- Application logs are written to console
- Use PM2 or systemd journal for log management
- Consider log aggregation services (CloudWatch, Datadog)

### Backups
- Database backups should be scheduled regularly
- File uploads in S3 are automatically backed up
- Consider automated backup solutions

## 🔒 Security Considerations

1. **SSL/TLS**: Always use HTTPS in production
2. **Environment Variables**: Never commit secrets to version control
3. **Firewall**: Configure firewall rules to only allow necessary ports
4. **Updates**: Keep dependencies updated and apply security patches
5. **Rate Limiting**: Built-in rate limiting is active (100 requests/minute)

## 🚨 Troubleshooting

### Common Issues

**Application won't start:**
- Check environment variables are set correctly
- Verify database connection
- Check port 3000 is available

**Database connection errors:**
- Verify DATABASE_URL format
- Check database server is running
- Confirm user permissions

**Payment processing issues:**
- Verify webhook URLs are configured
- Check API keys are correct
- Review payment provider logs

**File upload issues:**
- Verify AWS credentials
- Check S3 bucket permissions
- Confirm CORS configuration

## 📞 Support

For deployment assistance:
- Check logs: `pm2 logs amerilend` or `journalctl -u amerilend`
- Review configuration files
- Test endpoints with curl: `curl http://localhost:3000/`

## ✅ Ready for Production

Your AmeriLend application is now:
- ✅ Built and optimized
- ✅ Database schema ready
- ✅ All features implemented
- ✅ Security measures in place
- ✅ Monitoring and logging configured

Just configure your environment variables, set up the domain, and you're ready to launch!
