# Profile Update Email Notification Feature

## Overview

This document describes the automatic email notification system that sends confirmation emails when users or admins update profile information on the AmeriLend platform.

## Features

### 1. **User Profile Update Notifications**
When a user updates their own profile through the Settings page, they receive a confirmation email showing:
- What information was changed
- Old values (crossed out)
- New values (highlighted)
- Security notice about unauthorized changes

**Triggering Events:**
- Name change
- Email address change
- Phone number change

**Endpoint:** `user.updateProfile` (Protected Procedure)

### 2. **Admin Profile Update Notifications**
When an admin updates a user's information through the Admin Dashboard, the user receives a notification email showing:
- All changed fields (name, email, phone, role, address, city, state, ZIP)
- Old and new values
- Who made the update (admin email)
- Security warning about unauthorized changes

**Triggering Events:**
- Name change
- Email address change
- Phone number change
- Role change (user ↔ admin)
- Address information changes (street, city, state, ZIP)

**Endpoint:** `users.adminUpdate` (Admin Procedure)

## Implementation Details

### Email Template Structure

The profile update email includes:
1. **Header** - AmeriLend logo
2. **Greeting** - Personalized with user's name
3. **Update Confirmation** - Clear notification of changes
4. **Changes Summary** - Formatted list showing:
   - Field name
   - Old value (with strikethrough styling)
   - New value (with green checkmark)
5. **Security Notice** - Warning about contacting support if changes weren't authorized
6. **Next Steps** - Instructions on how to contact support
7. **Footer** - Copyright and note about automated message

### Code Changes

#### 1. Email Template Function (`server/_core/email.ts`)

```typescript
export async function sendProfileUpdateEmail(
  email: string,
  fullName: string,
  changedFields: Record<string, { old: any; new: any }>
): Promise<boolean>
```

**Parameters:**
- `email` (string): Recipient's email address
- `fullName` (string): Recipient's full name for personalization
- `changedFields` (object): Dictionary of changes with old/new values

**Example:**
```javascript
const changedFields = {
  'Name': { old: 'John Doe', new: 'Jane Doe' },
  'Phone Number': { old: '(555) 123-4567', new: '(555) 987-6543' },
  'Updated By': { old: 'User self-service', new: 'Admin (admin@amerilend.com)' }
};

await sendProfileUpdateEmail(
  'user@example.com',
  'Jane Doe',
  changedFields
);
```

**Features:**
- HTML escaping to prevent XSS attacks
- Responsive email design
- Clear visual distinction between old and new values
- Security warnings included by default

#### 2. User Profile Update Endpoint (`server/routers.ts`)

**Endpoint:** `POST /api/trpc/user.updateProfile`

**Changes:**
- Track field changes before database update
- Only send email if at least one field changed
- Include all changed fields in the notification
- Non-blocking email sending (errors don't prevent profile update)

**Tracked Fields:**
- Name
- Email
- Phone Number

#### 3. Admin Profile Update Endpoint (`server/routers.ts`)

**Endpoint:** `POST /api/trpc/users.adminUpdate`

**Changes:**
- Retrieve current user data before update
- Compare old and new values for all fields
- Send email with all changes plus admin identifier
- Include special "Updated By" field showing admin email
- Non-blocking email sending

**Tracked Fields:**
- Name
- Email
- Phone Number
- Account Type (user/admin role)
- Street Address
- City
- State
- ZIP Code

### Email Delivery

**Service:** SendGrid (primary) or SMTP (fallback)

**Configuration:**
- Uses existing email infrastructure in `sendEmail()` function
- Automatically uses SendGrid if `SENDGRID_API_KEY` is configured
- Falls back to SMTP if `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` are configured
- Development mode: Logs to console if no email service configured

**Error Handling:**
- Email failures do not block profile updates
- Errors are logged to console for debugging
- User gets success response even if email fails (email is non-critical)

## Usage Examples

### User Self-Service Update

**Client Request:**
```typescript
updateProfileMutation.mutate({
  name: 'Jane Doe',
  email: 'jane@example.com',
  phoneNumber: '(555) 987-6543'
});
```

**User Receives Email:**
- To: jane@example.com
- Subject: ✅ Profile Updated - AmeriLend Account
- Shows all changed fields with before/after values

### Admin Update User

**Client Request (from Admin Dashboard):**
```typescript
updateUserMutation.mutate({
  id: 123,
  name: 'John Smith',
  email: 'john@example.com',
  role: 'user',
  state: 'TX'
});
```

**User Receives Email:**
- To: john@example.com
- Subject: ✅ Profile Updated - AmeriLend Account
- Shows all changes including "Updated By: Admin (admin@amerilend.com)"
- Includes security notice about unauthorized changes

## Security Considerations

1. **Email Verification:**
   - Email address changes should ideally require verification link
   - Current implementation sends to new email immediately (consider adding verification step)
   - Consider adding: `[VERIFY EMAIL]` button in future

2. **Data Sanitization:**
   - HTML content is escaped to prevent XSS
   - User inputs are validated through Zod schemas
   - Database fields are properly typed

3. **Access Control:**
   - User can only update their own profile (checked via `ctx.user.id`)
   - Admin updates require `adminProcedure` (role-based access control)
   - All changes logged in email trail

4. **Audit Trail:**
   - Admin updates show who made the change
   - Timestamp included in email
   - Could be extended to include in database audit log

## Future Enhancements

1. **Email Verification for Address Changes**
   - Add verification link when email is changed
   - User must click link to confirm new email

2. **Detailed Audit Log**
   - Store profile change history in database
   - Create "Activity History" view for users
   - Include IP address and timestamp

3. **Conditional Notifications**
   - Allow users to control which updates trigger emails
   - Privacy settings for notification preferences

4. **Admin Notifications**
   - Notify admins when other admins make changes
   - Alert on suspicious activity patterns

5. **Two-Factor Confirmation**
   - Require OTP verification for sensitive changes
   - Email verification for address changes

## Testing

### Manual Testing Steps

1. **User Profile Update:**
   - Log in as user
   - Go to Settings page
   - Update name, email, or phone
   - Check email for confirmation
   - Verify all changes are correctly displayed

2. **Admin Update:**
   - Log in as admin
   - Go to Admin Dashboard → Manage Users
   - Select a user and update their information
   - Check user's email for confirmation
   - Verify admin email is shown as "Updated By"

3. **Multiple Changes:**
   - Update multiple fields at once
   - Verify all changes appear in email
   - Check formatting and styling

4. **Email Validation:**
   - Ensure email is sent to correct address (especially if email changed)
   - Verify HTML formatting in email client
   - Check mobile responsiveness of email

### Error Scenarios

1. **Invalid Email:**
   - Email address already taken → Error before sending email ✅
   - Invalid format → Rejected by Zod validation ✅

2. **Database Failure:**
   - Database unavailable → TRPCError returned ✅
   - Update fails → Email not sent ✅

3. **Email Service Failure:**
   - SendGrid unavailable → Logged but doesn't block update ✅
   - SMTP connection fails → Logged but doesn't block update ✅

## Database Schema

No schema changes required. The feature uses existing `users` table fields:
- `name`
- `email`
- `phoneNumber`
- `role`
- `street`
- `city`
- `state`
- `zipCode`

## API Documentation

### User Endpoint: `user.updateProfile`

**Method:** `POST`

**Authentication:** Required (Protected Procedure)

**Input Schema:**
```typescript
{
  name?: string        // Optional, new name
  email?: string       // Optional, new email (must be valid)
  phoneNumber?: string // Optional, new phone
}
```

**Response:**
```typescript
{
  success: true
}
```

**Side Effects:**
- Updates user record in database
- Sends confirmation email if changes made
- Logs change information to console

**Error Codes:**
- `UNAUTHORIZED`: User not authenticated
- `INTERNAL_SERVER_ERROR`: Database unavailable
- `BAD_REQUEST`: Email already in use

---

### Admin Endpoint: `users.adminUpdate`

**Method:** `POST`

**Authentication:** Required (Admin Procedure)

**Input Schema:**
```typescript
{
  id: number          // Required, user ID to update
  name?: string       // Optional
  email?: string      // Optional
  phoneNumber?: string // Optional
  role?: "user"|"admin" // Optional
  street?: string     // Optional
  city?: string       // Optional
  state?: string      // Optional
  zipCode?: string    // Optional
}
```

**Response:**
```typescript
{
  success: true
}
```

**Side Effects:**
- Updates user record in database
- Sends confirmation email showing admin as "Updated By"
- Logs change information to console

**Error Codes:**
- `UNAUTHORIZED`: Not an admin
- `INTERNAL_SERVER_ERROR`: Database unavailable
- `NOT_FOUND`: User ID not found
- `BAD_REQUEST`: Email already in use

## Monitoring & Logging

### Log Messages

**Successful Send:**
```
[Profile Update] Confirmation email sent to jane@example.com
[Admin Update] Confirmation email sent to john@example.com
[Email] ✓ Sent via SendGrid successfully to: jane@example.com
```

**Email Failure (non-blocking):**
```
[Profile Update] Failed to send confirmation email: Error details
[Admin Update] Failed to send confirmation email: Error details
[Email] ❌ FAILED to send email
```

### Monitoring Points

1. Monitor email sending success rate
2. Track failed email deliveries
3. Monitor database update performance
4. Alert on repeated email failures
5. Track user profile update frequency

## Production Deployment Checklist

- [ ] SendGrid API key configured in environment
- [ ] Email templates tested in production
- [ ] Email sender address verified with SendGrid
- [ ] SMTP fallback configured (optional)
- [ ] Email rate limiting considered
- [ ] Error logging configured
- [ ] Monitoring alerts set up
- [ ] Email templates reviewed for branding
- [ ] Legal review of email content
- [ ] Privacy policy updated to mention profile change emails

## Troubleshooting

### Email Not Sending

1. Check if SendGrid API key is configured
   ```bash
   echo $env:SENDGRID_API_KEY
   ```

2. Check console logs for email errors
   ```
   [Email] Failed to send email: ...
   ```

3. Verify email address is valid
   - No typos
   - Not blocked by user
   - Not in email suppression list

4. Check firewall/network connectivity
   - Can reach api.sendgrid.com
   - Port 443 accessible

5. Verify email content
   - Check for HTML syntax errors
   - Verify recipient email is in correct field

### Email Appearing in Spam

1. Ensure SPF/DKIM/DMARC records are configured
2. Use verified sender address
3. Include unsubscribe link (future enhancement)
4. Keep email content professional
5. Test with major email providers (Gmail, Outlook, etc.)

## Support

For issues or questions about this feature:
1. Check console logs for errors
2. Review SendGrid dashboard for delivery status
3. Contact support: support@amerilendloan.com
