# Deploying AmeriLend with Wix Domain

Since you want to keep your domain on Wix but deploy AmeriLend elsewhere, here's how to do it:

## 🚀 Recommended: Deploy to Railway (Free Tier Available)

Railway is perfect for Node.js apps and has a generous free tier.

### Step 1: Deploy to Railway

1. **Sign up for Railway**: Go to [railway.app](https://railway.app) and create an account

2. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

3. **Deploy your app**:
```bash
# Initialize Railway project
railway init

# Link to your Railway project
railway link

# Add environment variables (see ENVIRONMENT_CONFIGURATION.md)
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=your-database-url
railway variables set JWT_SECRET=your-secure-secret
# ... add all other required variables

# Deploy
railway up
```

4. **Get your Railway URL**: After deployment, Railway will give you a URL like `https://amerilend-production.up.railway.app`

### Step 2: Connect Wix Domain to Railway

#### Option A: Point Domain to Railway (Recommended)

1. **In Wix Dashboard**:
   - Go to **Settings** → **Domains**
   - Click **Connect a domain you already own**
   - Enter your domain name
   - Choose **"I want to point my domain to a different host"**

2. **Get DNS Records from Railway**:
```bash
railway domain
```
This will show you the CNAME record you need.

3. **Update DNS in Wix**:
   - In Wix domain settings, add the CNAME record provided by Railway
   - Point your domain (`yourdomain.com`) to Railway's URL

#### Option B: Use Cloudflare (More Control)

1. **Transfer DNS to Cloudflare**:
   - In Wix, go to domain settings
   - Change nameservers to Cloudflare's nameservers
   - Add your domain to Cloudflare

2. **Configure Cloudflare**:
   - Add CNAME record: `yourdomain.com` → `your-railway-url.up.railway.app`
   - Enable SSL (Full/Strict)
   - Set SSL/TLS encryption mode to "Full (strict)"

## 🗄️ Database Setup for Railway

Railway provides databases. Add a MySQL database:

```bash
# Add MySQL database to your Railway project
railway add mysql

# Get the DATABASE_URL
railway variables get DATABASE_URL
```

## 🔧 Environment Variables for Railway

Set these in Railway dashboard or via CLI:

```bash
NODE_ENV=production
PORT=3000
APP_URL=https://yourdomain.com
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-very-long-secure-secret-key
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-admin-openid

# Email (SendGrid)
EMAIL_SERVICE_API_KEY=SG.your-sendgrid-key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# Payments
STRIPE_SECRET_KEY=sk_live_your-stripe-key
AUTHORIZENET_API_LOGIN_ID=your-login-id
COINBASE_COMMERCE_API_KEY=your-coinbase-key

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET_NAME=amerilend-documents
```

## 🌐 Alternative: Deploy to Render

If you prefer Render (also free tier):

1. **Sign up**: [render.com](https://render.com)

2. **Create Web Service**:
   - Connect your GitHub repo
   - Set build command: `npm install && npm run build`
   - Set start command: `node dist/index.js`
   - Add environment variables

3. **Connect Domain**:
   - In Render dashboard, go to your service settings
   - Add custom domain
   - Get the CNAME record
   - Update DNS in Wix to point to Render

## 📋 Wix Domain Configuration Steps

### For Pointing to External Host:

1. **In Wix**:
   - Settings → Domains
   - Click your domain
   - Choose "Advanced" → "Edit DNS"
   - Add CNAME record provided by your hosting provider

2. **DNS Records You'll Need**:
   - **CNAME**: `www.yourdomain.com` → `your-app-hosting-url`
   - **A Record**: `yourdomain.com` → hosting provider's IP (if required)

3. **SSL Certificate**:
   - Most hosting providers (Railway, Render, Vercel) provide free SSL
   - Wix will handle the domain validation

## 🔍 Testing Your Setup

After deployment:

1. **Test Railway/Render URL**: Visit your hosting provider's URL first
2. **Test Custom Domain**: Once DNS propagates (can take 24-48 hours), test your Wix domain
3. **Check SSL**: Ensure HTTPS works
4. **Test Application**: Try the signup flow and basic functionality

## 🚨 Important Notes

- **DNS Propagation**: Can take 24-48 hours to fully propagate
- **SSL**: Your hosting provider should handle SSL certificates
- **Wix Limitations**: Wix domains work fine with external hosting, but you can't use Wix's website builder for the same domain simultaneously
- **Cost**: Railway and Render have generous free tiers for small applications

## 📞 Need Help?

If you run into issues:
1. Check Railway/Render logs for errors
2. Verify environment variables are set correctly
3. Test database connectivity
4. Check DNS propagation status

Would you like me to help you set up Railway deployment specifically, or do you have questions about any of these steps?
