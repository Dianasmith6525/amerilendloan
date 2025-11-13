# Google Maps Address Autocomplete Setup Guide

This guide explains how to set up the Google Maps API for address autocomplete in the loan application form.

## Overview

The application form now includes Google Places Autocomplete for the address field, which:
- Suggests addresses as users type
- Auto-fills street, city, state, and ZIP code
- Validates addresses against Google Maps data
- Provides a better user experience
- Reduces errors in address entry

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key

### 2. Restrict Your API Key (Recommended)

For security, restrict your API key:

1. In the Google Cloud Console, go to **Credentials**
2. Click on your API key
3. Under **Application restrictions**:
   - Select "HTTP referrers (web sites)"
   - Add your domains:
     - `http://localhost:3000/*` (for development)
     - `https://amerilendloan.com/*` (for production)
4. Under **API restrictions**:
   - Select "Restrict key"
   - Choose: Maps JavaScript API and Places API

### 3. Configure Environment Variable

Add your API key to the `.env` file:

```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

**Important**: Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key.

### 4. Billing Setup

Google Maps API requires billing to be enabled:
- Free tier includes: **$200 credit per month**
- Places Autocomplete: **$2.83 per 1,000 requests** (after free credit)
- Most applications stay within the free tier

To enable billing:
1. Go to **Billing** in Google Cloud Console
2. Link a payment method
3. Set up budget alerts (recommended)

## How It Works

### User Experience

1. User clicks on the "Street Address" field
2. As they type, Google suggests matching addresses
3. When they select an address, all fields auto-fill:
   - Street address
   - City
   - State (2-letter code)
   - ZIP code
4. Success toast notification confirms the auto-fill

### Technical Implementation

The autocomplete is implemented using:
- **Library**: `react-google-autocomplete`
- **API**: Google Maps JavaScript API with Places library
- **Restrictions**: US addresses only (`componentRestrictions: { country: "us" }`)
- **Type**: Address-specific suggestions (`types: ["address"]`)

## Code Structure

### Files Modified

1. **`.env`**
   - Added `VITE_GOOGLE_MAPS_API_KEY` variable

2. **`client/index.html`**
   - Added Google Maps script tag in `<head>`
   - Script loads Places library automatically

3. **`client/src/pages/ApplyLoan.tsx`**
   - Imported `Autocomplete` component
   - Replaced standard input with Google Places Autocomplete
   - Added `onPlaceSelected` handler to parse and populate address fields
   - Added MapPin icon for visual indication

4. **`package.json`**
   - Added `react-google-autocomplete` dependency
   - Added `@types/google.maps` for TypeScript support

### Address Parsing Logic

The `onPlaceSelected` handler extracts address components:

```typescript
street_number    → Street (123)
route            → Street (Main St)
locality         → City (New York)
administrative_area_level_1 → State (NY)
postal_code      → ZIP Code (10001)
```

## Testing

### Test Without API Key

If you don't add an API key immediately:
- The autocomplete field will work as a regular input
- Users can still manually type their address
- No autocomplete suggestions will appear

### Test With API Key

1. Add your API key to `.env`
2. Restart the development server: `npm run dev`
3. Go to the loan application form
4. Navigate to Step 2 (Address Information)
5. Type an address (e.g., "1600 Pennsylvania")
6. Select from dropdown suggestions
7. Verify all fields auto-fill correctly

## Troubleshooting

### "This page can't load Google Maps correctly"

**Solution**: Check that:
1. Your API key is valid
2. Maps JavaScript API is enabled
3. Places API is enabled
4. Billing is enabled on your Google Cloud project

### Autocomplete Not Showing Suggestions

**Solution**: Check:
1. API key is correctly set in `.env`
2. Environment variable starts with `VITE_` (required for Vite)
3. Development server was restarted after adding the key
4. Browser console for any errors

### "API key not authorized" Error

**Solution**: 
1. Check API key restrictions match your domain
2. Ensure both Maps JavaScript API and Places API are enabled
3. Wait a few minutes for restrictions to propagate

## Cost Optimization

To minimize costs:

1. **Set Up Budget Alerts**
   - Go to Google Cloud Console → Billing → Budgets & alerts
   - Set budget at $50/month (well above free tier)
   - Get notifications at 50%, 90%, 100%

2. **Monitor Usage**
   - Check usage in Google Cloud Console
   - Most small-medium sites stay within free tier ($200/month credit)

3. **API Key Security**
   - Never commit API keys to Git
   - Use HTTP referrer restrictions
   - Rotate keys if exposed

## Free Tier Limits

With the $200/month free credit:
- **~70,000 autocomplete requests per month** (at $2.83/1000)
- More than enough for most applications

## Alternative: Disable Autocomplete

If you don't want to use Google Maps:

1. The address fields will work as regular inputs
2. Users manually type all address information
3. No external API calls
4. No costs

The form is designed to work with or without the autocomplete feature.

## Support

For issues with Google Maps API:
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Pricing Information](https://cloud.google.com/maps-platform/pricing)

## Security Best Practices

1. ✅ Use HTTP referrer restrictions
2. ✅ Restrict API to only necessary APIs (Maps JS + Places)
3. ✅ Keep API key in `.env` file (not in code)
4. ✅ Add `.env` to `.gitignore`
5. ✅ Use environment-specific keys (dev vs production)
6. ✅ Set up billing alerts
7. ✅ Monitor usage regularly
