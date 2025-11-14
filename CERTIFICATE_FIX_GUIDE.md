# Certificate Error Fix Guide

## Problem
Domain verified but HTTPS certificate isn't working properly.

## Root Cause
Your app's environment variables still reference the old Render hostname (`https://amerilendloan.onrender.com`) instead of your new custom domain (`https://www.amerilendloan.com`).

## Solution

### Step 1: Update Render Environment Variables

Go to your Render Web Service Dashboard and update these variables:

1. **OAUTH_SERVER_URL**
   - Old: `https://amerilendloan.onrender.com`
   - New: `https://www.amerilendloan.com`

2. **APP_URL**
   - Old: `https://amerilendloan.onrender.com`
   - New: `https://www.amerilendloan.com`

3. **ALLOWED_ORIGINS**
   - Old: `https://amerilendloan.onrender.com`
   - New: `https://www.amerilendloan.com,https://amerilendloan.com`

### Step 2: Redeploy

1. Go to your Render Web Service dashboard
2. Click **"Manual Deploy"** or **"Clear Build Cache & Deploy"**
3. Wait for deployment to complete (~2-5 minutes)

### Step 3: Verify Certificate

After deployment:
1. Visit `https://www.amerilendloan.com`
2. Check the browser's SSL certificate (click the lock icon)
3. Certificate should show:
   - **Domain**: www.amerilendloan.com
   - **Issued by**: Let's Encrypt or Render
   - **Valid**: Yes ✓

### Step 4: Test Flows

Once certificate is valid:
- Test login at `https://www.amerilendloan.com`
- Test OTP email delivery
- Test payment processing
- Check browser console for any mixed-content errors

## If Certificate Still Fails

1. **Wait 10-15 minutes** — Let's Encrypt needs time to provision certificate
2. **Check Render logs** — Look for SSL provisioning errors
3. **Force HTTPS redirect** — Ensure all traffic redirects to HTTPS
4. **Check ALLOWED_ORIGINS** — Make sure both `www.amerilendloan.com` and `amerilendloan.com` are included

## Quick Checklist

- [ ] Updated OAUTH_SERVER_URL in Render
- [ ] Updated APP_URL in Render
- [ ] Updated ALLOWED_ORIGINS in Render
- [ ] Redeployed app
- [ ] Waited 5+ minutes
- [ ] Visited https://www.amerilendloan.com
- [ ] Certificate shows valid lock icon ✓
