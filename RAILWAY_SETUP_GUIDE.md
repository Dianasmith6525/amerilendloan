# Railway Deployment Guide for AmeriLend

## 🚀 Step-by-Step Railway Setup

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app) and sign up
2. Connect your GitHub account (recommended for easy deployments)

### Step 2: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Step 3: Initialize Your Project
```bash
# Navigate to your project directory
cd "c:/Users/USER/Downloads/amerilend new files"

# Initialize Railway project
railway init

# When prompted:
# - Choose "Empty Project"
# - Name it "amerilend" or your preferred name
```

### Step 4: Add Database
```bash
# Add MySQL database to your project
railway add mysql

# This creates a MySQL database automatically
# Railway will provide DATABASE_URL environment variable
```

### Step 5: Deploy Your Application
```bash
# Link to your Railway project
railway link

# Deploy (this will build and deploy automatically)
railway up
```

### Step 6: Set Environment Variables
In Railway dashboard (railway.app/dashboard):
1. Go to your project
2. Click "Variables" in the left sidebar
3. Add these variables:

```bash
NODE_ENV=production
PORT=3000
APP_URL=https://yourdomain.com  # Replace with your actual domain
JWT_SECRET=your-super-secure-random-key-here-min-32-chars
VITE_APP_ID=your-app-id-from-manus
OWNER_OPEN_ID=your-admin-openid

# Email (SendGrid)
EMAIL_SERVICE_API_KEY=SG.your-sendgrid-api-key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# Payments
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

AUTHORIZENET_API_LOGIN_ID=your-authorizenet-login-id
AUTHORIZENET_TRANSACTION_KEY=your-transaction-key
AUTHORIZENET_ENVIRONMENT=production

COINBASE_COMMERCE_API_KEY=your-coinbase-api-key
COINBASE_COMMERCE_WEBHOOK_SECRET=your-coinbase-webhook-secret
CRYPTO_PAYMENT_ENVIRONMENT=production

# AWS S3 (for file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=amerilend-documents

# AI Features (optional)
BUILT_IN_FORGE_API_URL=https://api.forge.com
BUILT_IN_FORGE_API_KEY=your-forge-api-key
```

### Step 7: Run Database Migrations
```bash
# Connect to your Railway database
railway connect mysql

# Then run migrations (in a new terminal)
npm run db:push
```

### Step 8: Get Your Railway URL
```bash
# Get your deployment URL
railway domain
```
This will show something like: `https://amerilend-production.up.railway.app`

## 🌐 Connect Your Wix Domain

### Option A: Direct Domain Pointing (Recommended)

1. **In Railway Dashboard:**
   - Go to your project → Settings → Domains
   - Add your custom domain: `yourdomain.com`
   - Railway will provide CNAME records

2. **In Wix Dashboard:**
   - Go to **Settings** → **Domains**
   - Click your domain
   - Choose **"Advanced"** → **"Edit DNS"**
   - Add the CNAME record provided by Railway:
     - **Name:** `yourdomain.com` (or `@`)
     - **Type:** CNAME
     - **Value:** The value Railway provided

3. **Wait for DNS Propagation:**
   - DNS changes can take 24-48 hours
   - You can check status at [dnschecker.org](https://dnschecker.org)

### Option B: Using Cloudflare (Better Control)

1. **Transfer DNS to Cloudflare:**
   - In Wix, change nameservers to Cloudflare's nameservers
   - Add your domain to Cloudflare

2. **Configure Cloudflare:**
   - Add CNAME record: `yourdomain.com` → `your-railway-url.up.railway.app`
   - Enable SSL (Full/Strict)
   - Set SSL/TLS encryption mode to "Full (strict)"

## 🔧 Configure Payment Webhooks

### Stripe Webhook:
- URL: `https://yourdomain.com/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### Authorize.net Webhook:
- URL: `https://yourdomain.com/api/webhooks/authorizenet`

### Coinbase Webhook:
- URL: `https://yourdomain.com/api/webhooks/crypto`

## 🧪 Testing Your Deployment

1. **Test Railway URL First:**
   - Visit your Railway URL (e.g., `https://amerilend-production.up.railway.app`)
   - Try the signup flow

2. **Test Custom Domain:**
   - Once DNS propagates, test `https://yourdomain.com`
   - Verify SSL certificate works

3. **Test Key Features:**
   - User registration with OTP
   - Loan application submission
   - Admin dashboard access
   - Payment processing (use test cards)

## 📊 Monitoring & Logs

```bash
# View logs
railway logs

# Monitor usage
railway usage

# Check database
railway connect mysql
```

## 💰 Railway Pricing

- **Free Tier:** 512MB RAM, 1GB disk, ~$5/month worth of usage
- **Hobby Plan:** $5/month for more resources
- **Pro Plan:** $10/month for production workloads

## 🚨 Troubleshooting

### Common Issues:

**Build Fails:**
```bash
# Check build logs
railway logs --build
```

**Database Connection Issues:**
- Verify DATABASE_URL is set correctly
- Check if migrations ran: `npm run db:push`

**Environment Variables:**
- Make sure all required variables are set in Railway dashboard
- Restart deployment after adding variables

**Domain Issues:**
- Wait 24-48 hours for DNS propagation
- Check DNS records with online tools
- Verify domain is properly configured in Wix

## 📞 Support

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **AmeriLend Setup:** Check `ENVIRONMENT_CONFIGURATION.md` for all variables
- **Domain Help:** Wix support or Cloudflare docs

## ✅ Success Checklist

- [ ] Railway account created
- [ ] CLI installed and logged in
- [ ] Project initialized
- [ ] MySQL database added
- [ ] Code deployed successfully
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Domain connected
- [ ] SSL working
- [ ] Application accessible
- [ ] Payment webhooks configured
- [ ] Testing completed

Your AmeriLend loan application will be live at your Wix domain once these steps are complete!
