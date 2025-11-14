# 📱 Phone Number OTP System Documentation

**Status:** ✅ **SUPPORTED** - The system includes full phone number OTP via Twilio

---

## How It Works

### 1. **Phone Number Storage**
- Column in database: `users.phone` (varchar, nullable)
- Stored during signup: `phoneNumber` (optional field)
- Normalized format: E.164 (e.g., +1234567890)

### 2. **SMS OTP Functions Available**

Located in `server/_core/sms-otp.ts`:

```typescript
// Generate 6-digit OTP code
export function generateOTP(): string

// Format phone to E.164 standard
export function formatPhoneNumber(phone: string): string

// Validate US phone number (10 or 11 digits)
export function isValidPhoneNumber(phone: string): boolean

// Send OTP via Twilio SMS
export async function sendSMSOTP(
  phone: string,
  code: string,
  purpose: 'signup' | 'login' | 'loan_application'
): Promise<{ success: boolean; error?: string; messageId?: string }>

// Create OTP record in database
export async function createPhoneOTP(
  phone: string,
  purpose: 'signup' | 'login' | 'loan_application'
): Promise<{ code: string; expiresAt: Date }>

// Verify OTP code
export async function verifyPhoneOTP(
  phone: string,
  code: string,
  purpose: string
): Promise<{ valid: boolean; error?: string }>

// Resend OTP
export async function resendPhoneOTP(
  phone: string,
  purpose: string
): Promise<{ success: boolean; error?: string }>
```

### 3. **API Endpoints Using Phone OTP**

In `server/routers.ts`:

- **Signup with phone**: `auth.signup` - Optional `phoneNumber` parameter
- **Phone OTP verification**: Routes exist in auth router for phone verification
- **Rate limiting**: Built-in to prevent SMS spam

### 4. **Twilio Configuration Required**

To enable SMS OTP, set these environment variables in `.env`:

```
# Twilio API Credentials
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Current Status:** ⚠️ Not configured (SMS will be disabled)

### 5. **Database Schema**

**Users table has:**
```sql
phone VARCHAR(20)  -- Nullable, for phone numbers
```

**OTP Codes table:**
```typescript
// Stores both email and phone OTPs
export const otpCodes = pgTable("otpCodes", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  email: varchar("email", { length: 320 }),      // For email OTPs
  phone: varchar("phone", { length: 20 }),       // For SMS OTPs
  code: varchar("code", { length: 10 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull(), // signup|login|loan_application
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

---

## Phone OTP Flow

### Signup with Phone
```
1. User enters: email + password + (optional) phoneNumber
2. System checks if valid US phone number
3. If phone provided:
   - SMS OTP code generated (6 digits)
   - Code stored in otpCodes table with 10-min expiry
   - SMS sent via Twilio: "Your verification code is: 123456"
4. User receives SMS
5. User enters code to verify
6. Account created
```

### Login with Phone OTP (Alternative)
```
1. User enters phone number
2. System generates 6-digit code
3. SMS sent to phone
4. User enters code
5. Account verification complete
```

### Loan Application with Phone OTP
```
1. During loan application, system can verify phone
2. Similar flow to signup
```

---

## Feature Readiness Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| **Phone column** | ✅ Exists | In `users` table |
| **OTP database** | ✅ Ready | `otpCodes` stores both email + phone |
| **SMS OTP functions** | ✅ Coded | All functions in `sms-otp.ts` |
| **Twilio integration** | ✅ Ready | Just needs credentials |
| **Phone validation** | ✅ Ready | US number format (10-11 digits) |
| **Phone formatting** | ✅ Ready | Converts to E.164 format |
| **Rate limiting** | ✅ Built-in | Prevents SMS spam |
| **API endpoints** | ✅ Ready | Phone OTP endpoints in routers |

---

## How to Enable Phone OTP

### Step 1: Get Twilio Credentials
1. Visit https://www.twilio.com
2. Sign up for free account
3. Get: Account SID, Auth Token, Phone Number

### Step 2: Add to Environment Variables
In `.env`:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+18005551234
```

In Render production environment variables (same)

### Step 3: Test SMS OTP
```bash
# Run this to verify Twilio is working:
node -e "
import { createPhoneOTP, sendSMSOTP } from './server/_core/sms-otp.ts';
const code = await createPhoneOTP('+1234567890', 'login');
console.log('OTP sent:', code);
"
```

### Step 4: Users Can Now
- Sign up with phone number
- Receive SMS verification codes
- Use phone-based login
- Verify during loan applications

---

## Code Examples

### Signup with Phone
```typescript
// Frontend sends:
{
  email: "user@example.com",
  password: "SecurePass123!",
  phoneNumber: "(555) 123-4567"  // Optional
}

// Backend normalizes to: +15551234567
// SMS sent: "Welcome to AmeriLend! Your verification code is: 123456"
```

### Verify Phone OTP
```typescript
// Frontend sends:
{
  phone: "+15551234567",
  code: "123456"
}

// Backend returns:
{
  valid: true,
  message: "Phone verified"
}
```

---

## Fallback Behavior

If Twilio credentials are NOT configured:
- ✅ Email OTP still works
- ❌ SMS OTP disabled (returns error)
- ✅ Phone number can still be stored
- ✅ System gracefully handles missing SMS service

---

## Current System Status

```
📧 Email OTP:     ✅ Fully Functional (SendGrid configured)
📱 Phone OTP:     🟡 Ready but Awaiting Twilio Credentials
                     • Code is written
                     • Database table ready
                     • Just needs API keys
```

---

## Next Steps to Activate Phone OTP

1. **Get Twilio account** - Sign up at twilio.com
2. **Add credentials** to `.env` and Render environment
3. **Test with phone number** - Try signup with phone
4. **Monitor logs** - Check for SMS delivery
5. **User-facing** - Phone field already in signup form

---

**Phone OTP System:** Ready to activate with Twilio credentials! 📱✅
