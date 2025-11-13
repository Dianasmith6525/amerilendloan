# Referral Program Implementation

## Overview
Implemented a comprehensive referral program that allows users to earn rewards by referring friends to AmeriLend. Users receive $50 for each successful referral.

## Features Implemented

### 1. Database Schema
- **users table** - Added referral fields:
  - `referralCode` (VARCHAR 10, unique) - User's unique referral code
  - `referredBy` (INT) - ID of user who referred them

- **referrals table** - New table to track referrals:
  - `id` - Primary key
  - `referrerId` - User who made the referral
  - `referredUserId` - User who was referred
  - `referralCode` - Code used for referral
  - `status` - ENUM (pending, qualified, rewarded)
  - `rewardAmount` - Amount earned in cents
  - `rewardPaidAt` - Timestamp when reward was paid
  - `createdAt`, `updatedAt` - Timestamps

### 2. Backend Functions (server/db.ts)
- `generateReferralCode()` - Creates unique 6-character codes (excludes I, O, 0, 1, L)
- `createOrGetReferralCode(userId)` - Gets existing or generates new code
- `getUserById(userId)` - Retrieves user by ID
- `getUserByReferralCode(code)` - Validates referral codes
- `createReferral(data)` - Creates new referral record
- `getReferralsByUserId(userId)` - Gets user's referral history
- `getReferralStats(userId)` - Returns stats (total, pending, qualified, rewarded, earnings)
- `updateReferralStatus(id, status, amount)` - Updates referral status and rewards

### 3. tRPC API Endpoints (server/routers.ts)
**Referrals Router:**
- `getMyReferralCode` (protected) - Returns or creates user's referral code
- `getMyStats` (protected) - Returns referral statistics
- `getMyReferrals` (protected) - Returns referral history with user details
- `validateCode` (public) - Validates referral code before signup

**Auth Router Updates:**
- Added `referralCode` optional parameter to signup endpoint
- Automatically creates referral record when user signs up with code
- Sets `referredBy` field in users table

### 4. Frontend Components

#### ReferralDashboard.tsx
Full-featured referral dashboard with:
- **Stats Cards:**
  - Total Referrals
  - Pending Referrals
  - Qualified Referrals
  - Total Earnings

- **Referral Code Display:**
  - Large, easy-to-read code in monospace font
  - Copy button for quick sharing
  - Referral link with copy functionality

- **Share Options:**
  - Email
  - SMS
  - WhatsApp
  - Facebook
  - Twitter

- **Referral History:**
  - List of all referrals
  - Status badges (pending/qualified/rewarded)
  - Referred user initials (privacy-friendly)
  - Join date
  - Reward amount (for rewarded referrals)
  - Empty state when no referrals

- **How It Works Section:**
  - Clear explanation of referral process
  - Reward details
  - Payment timeline

#### Signup.tsx Updates
- Accepts `?ref=CODE` query parameter in URL
- Referral code input field with validation
- Real-time code validation using `validateCode` endpoint
- Shows referrer name when valid code entered
- Auto-populates from URL parameter
- Converts code to uppercase automatically
- Passes referral code to signup mutation

#### Dashboard.tsx Updates
- Replaced "Total Applications" card with "Refer & Earn" card
- Green button to access referral dashboard
- "$50 per referral" messaging

#### App.tsx Updates
- Added `/referrals` route
- Imported ReferralDashboard component

## Referral Flow

### 1. Code Generation
1. User navigates to `/referrals`
2. System generates unique 6-character code (e.g., "ABC123")
3. Code stored in `users.referralCode`

### 2. Sharing
User shares via:
- Direct code: "ABC123"
- URL: `https://amerilend.com/signup?ref=ABC123`
- Social media share buttons
- Email/SMS templates

### 3. Friend Signs Up
1. Friend clicks referral link or enters code at signup
2. System validates code in real-time
3. Shows referrer name for confirmation
4. Creates user account with `referredBy` field set
5. Creates referral record with status="pending"

### 4. Status Progression
- **Pending** - Friend signed up but hasn't been approved for loan
- **Qualified** - Friend's loan application approved (ready for reward)
- **Rewarded** - Referrer has been paid $50

## Technical Details

### Referral Code Format
- Length: 6 characters
- Character set: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- Excludes: I, O, 0, 1, L (to prevent confusion)
- Example: `XYZ789`
- Collision detection with recursive regeneration

### Database Migration
File: `drizzle/0005_add_referral_system.sql`
- Adds referralCode and referredBy to users table
- Creates referrals table with indexes
- Supports MySQL/MariaDB syntax

### API Security
- Public endpoints: `validateCode` only (read-only)
- Protected endpoints: All others require authentication
- Privacy: Only shows user initials in referral list, not full names

### Reward Processing
**Manual Process (for now):**
1. Admin reviews qualified referrals
2. Admin processes $50 payment
3. Admin calls `updateReferralStatus(id, "rewarded", 5000)`
4. System sets `rewardPaidAt` timestamp

**Future Enhancement:**
- Automatic status update when referred user's loan is approved
- Automatic reward payment via API
- Email notifications at each status change

## Files Modified/Created

### Created:
- `client/src/pages/ReferralDashboard.tsx` (319 lines)
- `drizzle/0005_add_referral_system.sql` (21 lines)

### Modified:
- `drizzle/schema.ts` - Added referralCode, referredBy to users + referrals table
- `server/db.ts` - Added 7 referral functions + getUserById
- `server/routers.ts` - Added referrals router, updated signup
- `client/src/pages/Signup.tsx` - Added referral code field + validation
- `client/src/pages/Dashboard.tsx` - Changed card to "Refer & Earn"
- `client/src/App.tsx` - Added /referrals route

## Testing Checklist

### Backend:
- [ ] Referral code generation creates unique codes
- [ ] getUserByReferralCode validates codes correctly
- [ ] Signup with referral code creates referral record
- [ ] getReferralStats calculates totals correctly
- [ ] validateCode endpoint works for public access

### Frontend:
- [ ] /referrals page displays code and stats
- [ ] Copy buttons work for code and link
- [ ] Share buttons open correct platforms
- [ ] Signup validates referral codes in real-time
- [ ] ?ref= parameter auto-fills code field
- [ ] Dashboard "Refer & Earn" card links to /referrals

### Integration:
- [ ] Complete flow: Generate code → Share → Friend signs up → Referral created
- [ ] Status transitions work correctly
- [ ] Earnings calculation accurate

## Next Steps (Future Enhancements)

1. **Automatic Status Updates:**
   - Hook into loan approval flow
   - Auto-update referral status to "qualified" when referred user's loan approved

2. **Email Notifications:**
   - Send email when friend signs up
   - Send email when referral qualifies
   - Send email when reward is paid

3. **Admin Interface:**
   - View all referrals
   - Process rewards in bulk
   - Generate referral reports

4. **Reward Automation:**
   - Integrate with payment processor
   - Auto-distribute rewards when qualified
   - Support different reward amounts per campaign

5. **Analytics:**
   - Referral conversion rates
   - Top referrers leaderboard
   - Revenue attributed to referrals

6. **Enhanced Sharing:**
   - Custom messages per platform
   - Track which share method is most effective
   - Referral landing page with benefits

## Usage Examples

### For Users:
```
1. Login to AmeriLend
2. Click "Refer & Earn" on dashboard
3. Copy referral code or link
4. Share with friends
5. Track referrals and earnings
```

### For Developers:
```typescript
// Get user's referral code
const { data } = trpc.referrals.getMyReferralCode.useQuery();

// Get referral stats
const { data: stats } = trpc.referrals.getMyStats.useQuery();

// Validate code
const { data: validation } = trpc.referrals.validateCode.useQuery({ code });

// Signup with referral
signupMutation.mutate({
  name, email, password,
  referralCode: "ABC123"
});
```

## Reward Details
- **Amount:** $50 per successful referral
- **Currency:** USD (stored as cents: 5000)
- **Processing Time:** 5-7 business days after qualification
- **Qualification:** Friend's loan application must be approved
- **Limits:** None (unlimited referrals)
