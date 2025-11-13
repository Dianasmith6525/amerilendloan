Deployment Guide
=================

This guide explains how to deploy AmeriLend in production.

Prerequisites
-------------
- Node 18+ or 20+ on the host and/or Docker
- Environment variables configured (see `.env.example` in root)
- A production-ready MySQL database and SendGrid account for emails
- TLS / certificates if serving HTTPS from the app or via a reverse proxy

Build and test locally
----------------------
1. Install dependencies and build the project:

```powershell
# Using npm
npm ci
npm run build
```

2. Run the production server locally to verify the build:

```powershell
$env:NODE_ENV='production'; node dist/index.js
```

Check logs and verify the server runs and listens on port 3000.

Docker-based deployment (recommended)
------------------------------------
Build the container and run with docker-compose:

```powershell
# Build the container
docker compose build --progress=plain

# Start the container (reads variables from .env)
docker compose up -d

# Check logs
docker compose logs -f web

# Verify the health endpoint
curl http://localhost:3000/ -v
```

Set environment variables securely via `.env` or your container/orchestration secret store (e.g. AWS Secrets Manager, Kubernetes secrets).

Environment variables
---------------------
You'll need to configure environment variables (not exhaustive):
- NODE_ENV=production
- DATABASE_URL (MySQL/TiDB connection string)
- SENDGRID_API_KEY
- EMAIL_FROM
- APP_URL (https://your-domain.com)
- AUTHORIZENET_* keys
- WALLET addresses for BTC/ETH
- Any API keys required for integrations

Ensure the email domain is verified in SendGrid to avoid emails being routed to spam.

Process manager / Host system
-----------------------------
If you prefer not to use Docker, use a process manager like PM2 or systemd. Example PM2 steps:

```bash
npm ci --production
npm run build
pm2 start dist/index.js --name amerilend --env production
pm2 save
```

Nginx reverse proxy with TLS
----------------------------
1. Configure an Nginx server to proxy traffic to your node app on port 3000.
2. Configure TLS at the proxy layer (Let’s Encrypt or your CA).
3. Example config: `server_name yourdomain.com; proxy_pass http://localhost:3000;` with certs.

SendGrid domain verification
----------------------------
- Add the `amerilendloan.com` domain to your SendGrid account.
- Verify DNS TXT records (from SendGrid) for domain verification to improve deliverability.

Next steps and production checklist
----------------------------------
- Hook up real database credentials in env
- Add logging and monitoring (e.g., log rotation, Sentry)
- Configure backups for database
- Setup health checks and readiness probes in your deployment platform

If you'd like, I can generate a systemd unit file, a PM2 ecosystem file, or a Kubernetes manifest next. Let me know which hosting platform you'll use and I’ll prepare the deployment artifacts and instructions.
