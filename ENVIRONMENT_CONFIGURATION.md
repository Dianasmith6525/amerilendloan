# Environment Configuration Guide

This document outlines all environment variables required for running AmeriLend in production.

## Required Environment Variables

### Database Configuration

```bash
# MySQL database connection URL
DATABASE_URL="mysql://username:password@host:port/database"
```

### Application Settings

```bash
# Node environment (development | production)
NODE_ENV="production"

# Server port
PORT="3000"

# Application base URL
APP_URL="https://your-domain.com"

# JWT secret for session cookies (generate a strong random string)
JWT_SECRET="your-secret-key-here-min-32-characters"

# Vite app ID (from Manus platform)
VITE_APP_ID="your-app-id"

# Owner OpenID for admin access
OWNER_OPEN_ID="your-openid"
```

### OAuth Configuration

```bash
# OAuth server URL (Manus)
OAUTH_SERVER_URL="https://oauth.manus.com"
```

### Email Service (Choose one)

#### Option 1: SendGrid
```bash
EMAIL_SERVICE_API_KEY="SG.your-sendgrid-api-key"
EMAIL_FROM_ADDRESS="noreply@your-domain.com"
EMAIL_FROM_NAME="AmeriLend"
```

#### Option 2: AWS SES
```bash
AWS_SES_REGION="us-east-1"
AWS_SES_ACCESS_KEY_ID="your-access-key"
AWS_SES_SECRET_ACCESS_KEY="your-secret-key"
EMAIL_FROM_ADDRESS="noreply@your-domain.com"
```

### Payment Processing

#### Stripe
```bash
STRIPE_SECRET_KEY="sk_live_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_live_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

#### Authorize.net
```bash
AUTHORIZENET_API_LOGIN_ID="your-api-login-id"
AUTHORIZENET_TRANSACTION_KEY="your-transaction-key"
AUTHORIZENET_ENVIRONMENT="production"  # or "sandbox"
AUTHORIZENET_PUBLIC_CLIENT_KEY="your-public-client-key"
```

#### Coinbase Commerce (Cryptocurrency)
```bash
COINBASE_COMMERCE_API_KEY="your-coinbase-commerce-api-key"
COINBASE_COMMERCE_WEBHOOK_SECRET="your-webhook-secret"
CRYPTO_PAYMENT_ENVIRONMENT="production"  # or "sandbox"
```

### File Storage (AWS S3)

```bash
# AWS credentials
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"

# S3 bucket for document uploads
S3_BUCKET_NAME="amerilend-documents"
```

### AI & LLM Integration

```bash
# Built-in Forge API for AI features
BUILT_IN_FORGE_API_URL="https://api.forge.com"
BUILT_IN_FORGE_API_KEY="your-forge-api-key"
```

### Monitoring & Logging (Optional)

#### Sentry (Error Tracking)
```bash
SENTRY_DSN="your-sentry-dsn"
SENTRY_ENVIRONMENT="production"
```

#### Datadog (Monitoring)
```bash
DATADOG_API_KEY="your-datadog-api-key"
DATADOG_APP_KEY="your-datadog-app-key"
```

## Security Settings

### Rate Limiting
```bash
# Maximum requests per minute per IP
RATE_LIMIT_MAX_REQUESTS="100"

# Rate limit window in milliseconds
RATE_LIMIT_WINDOW_MS="60000"
```

### File Upload Limits
```bash
# Maximum file size in bytes (default: 10MB)
MAX_FILE_SIZE="10485760"
```

## Example .env File

Create a `.env` file in the root directory:

```bash
# Core Settings
NODE_ENV=production
PORT=3000
APP_URL=https://amerilendloan.com
DATABASE_URL=mysql://user:password@localhost:3306/amerilend
JWT_SECRET=your-very-long-and-secure-secret-key-here
VITE_APP_ID=your-vite-app-id
OWNER_OPEN_ID=your-admin-openid

# OAuth
OAUTH_SERVER_URL=https://oauth.manus.com

# Email (SendGrid)
EMAIL_SERVICE_API_KEY=SG.your-sendgrid-key
EMAIL_FROM_ADDRESS=noreply@amerilendloan.com
EMAIL_FROM_NAME=AmeriLend

# Stripe
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret

# Authorize.net
AUTHORIZENET_API_LOGIN_ID=your-login-id
AUTHORIZENET_TRANSACTION_KEY=your-transaction-key
AUTHORIZENET_ENVIRONMENT=production
AUTHORIZENET_PUBLIC_CLIENT_KEY=your-public-key

# Coinbase Commerce
COINBASE_COMMERCE_API_KEY=your-api-key
COINBASE_COMMERCE_WEBHOOK_SECRET=your-webhook-secret
CRYPTO_PAYMENT_ENVIRONMENT=production

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=amerilend-documents

# AI Integration
BUILT_IN_FORGE_API_URL=https://api.forge.com
BUILT_IN_FORGE_API_KEY=your-forge-key

# Optional: Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

## Development Environment

For local development, you can use test credentials and sandbox environments:

```bash
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000

# Use sandbox/test credentials for payment providers
AUTHORIZENET_ENVIRONMENT=sandbox
CRYPTO_PAYMENT_ENVIRONMENT=sandbox
```

## Security Best Practices

1. **Never commit .env files** - Add `.env` to `.gitignore`
2. **Use strong secrets** - Generate random strings with at least 32 characters
3. **Rotate keys regularly** - Update API keys and secrets periodically
4. **Use environment-specific variables** - Separate development and production configs
5. **Encrypt sensitive data** - Use services like AWS Secrets Manager or HashiCorp Vault
6. **Limit access** - Only give necessary team members access to production credentials

## Setting Up Production

### 1. Database Setup
```bash
# Run migrations
npm run db:push
```

### 2. Environment Variables
- Set all required environment variables in your hosting platform
- For AWS: Use AWS Systems Manager Parameter Store
- For Heroku: Use Config Vars
- For Docker: Use secrets or .env files mounted as volumes

### 3. Payment Provider Setup

#### Stripe
1. Create a Stripe account
2. Get API keys from dashboard
3. Set up webhook endpoints:
   - Endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

#### Authorize.net
1. Create merchant account
2. Generate API credentials
3. Configure Accept.js

#### Coinbase Commerce
1. Create Coinbase Commerce account
2. Generate API key
3. Set up webhook:
   - URL: `https://your-domain.com/api/webhooks/crypto`

### 4. AWS S3 Setup
1. Create S3 bucket
2. Set up IAM user with S3 access
3. Configure CORS for direct uploads
4. Set bucket policy for secure access

### 5. Email Service Setup
- Configure SendGrid or AWS SES
- Verify sender domain
- Set up email templates

## Testing Configuration

To test your configuration:

```bash
# Test database connection
npm run check:db

# Test email service
npm run check:email

# Test payment providers
npm run check:payments

# Run all health checks
npm run health-check
```

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format
- Check network access / firewall rules
- Ensure database user has proper permissions

### Payment Provider Issues
- Verify API keys are correct
- Check environment (sandbox vs production)
- Review webhook URL configuration
- Check webhook signatures

### Email Delivery Issues
- Verify sender email is verified
- Check API key permissions
- Review SPF and DKIM records

### File Upload Issues
- Verify AWS credentials
- Check S3 bucket permissions
- Verify CORS configuration
- Check file size limits

## Support

For configuration help, contact:
- Technical Support: support@amerilendloan.com
- Documentation: https://docs.amerilendloan.com

