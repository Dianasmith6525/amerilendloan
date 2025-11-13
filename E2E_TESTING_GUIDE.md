# End-to-End User Flow Testing Guide

This document provides comprehensive testing procedures for the complete AmeriLend loan application workflow.

## Prerequisites

1. Development environment running
2. Database seeded with test data
3. All environment variables configured
4. Payment providers in sandbox mode

## Test User Accounts

### Regular User
- Email: `testuser@example.com`
- OTP: Use generated code from console

### Admin User
- OpenID matches `OWNER_OPEN_ID` environment variable
- Has admin role for loan approval/rejection

## Complete User Flow Test

### 1. User Registration & Authentication

**Test Case: OTP Signup**
```
1. Navigate to login page
2. Enter email: testuser@example.com
3. Select "Sign Up" option
4. Click "Request Code"
5. Check console/email for OTP code
6. Enter OTP code
7. Click "Verify"
✓ Should redirect to dashboard
✓ User should be created in database
✓ Session cookie should be set
```

**Test Case: OTP Login**
```
1. Navigate to login page
2. Enter existing user email
3. Select "Login" option
4. Request and verify OTP
✓ Should redirect to dashboard
✓ lastSignedIn should be updated
```

### 2. Loan Application Submission

**Test Case: Complete Loan Application**
```
1. Login as regular user
2. Navigate to "Apply for Loan"
3. Fill out application form:
   - Full Name: John Doe
   - Email: john.doe@example.com
   - Phone: 555-123-4567
   - Date of Birth: 1990-01-15
   - SSN: 123-45-6789
   - Street: 123 Main St
   - City: New York
   - State: NY
   - Zip: 10001
   - Employment: employed
   - Employer: Acme Corp
   - Monthly Income: 500000 (cents = $5,000)
   - Loan Type: installment
   - Requested Amount: 500000 (cents = $5,000)
   - Loan Purpose: Home improvement
4. Accept all legal documents
5. Submit application
✓ Should show success message
✓ Should redirect to application status page
✓ Email confirmation should be sent
✓ Application should appear in "My Applications"
✓ Status should be "pending"
```

**Expected Emails:**
- Subject: "Loan Application Received - AmeriLend"
- Contains application ID
- Link to dashboard

**Database Verification:**
```sql
SELECT * FROM loanApplications WHERE email = 'john.doe@example.com';
SELECT * FROM notifications WHERE type = 'loan_submitted';
SELECT * FROM legalAcceptances WHERE userId = <user_id>;
```

### 3. Admin Loan Review

**Test Case: Admin Approves Loan**
```
1. Login as admin user
2. Navigate to Admin Dashboard
3. Click "Loan Applications" tab
4. Find pending application
5. Click "Review"
6. Click "Approve"
7. Set approved amount: 500000 ($5,000)
8. Add admin notes: "Application approved - good credit"
9. Submit approval
✓ Processing fee should be calculated (2% = $100)
✓ Application status should change to "approved"
✓ Approval email should be sent to applicant
✓ "Pay Processing Fee" button should appear
```

**Expected Processing Fee Calculation:**
```
If percentage mode (2%): $5,000 × 0.02 = $100
If fixed mode ($2.00): $2.00
```

**Expected Emails:**
- Subject: "🎉 Loan Approved - AmeriLend"
- Contains approved amount and processing fee
- Link to payment page

**Test Case: Admin Rejects Loan**
```
1. Follow steps 1-5 above
2. Click "Reject"
3. Enter rejection reason: "Insufficient income verification"
4. Submit rejection
✓ Status should be "rejected"
✓ Rejection email should be sent
✓ Application should be marked as closed
```

### 4. Payment Processing

**Test Case: Card Payment (Stripe/Authorize.net)**
```
1. Login as applicant
2. Navigate to approved loan application
3. Click "Pay Processing Fee"
4. Select payment method: "Card"
5. Enter card details:
   - Card Number: 4111 1111 1111 1111 (test card)
   - Expiry: 12/25
   - CVC: 123
   - Zip: 10001
6. Submit payment
✓ Payment should be processed
✓ Status should change to "fee_pending"
✓ Payment record created in database
```

**Test Case: Crypto Payment**
```
1. Navigate to payment page
2. Select payment method: "Cryptocurrency"
3. Choose crypto: "USDT"
4. Click "Generate Payment Address"
✓ Crypto address should be displayed
✓ QR code should be shown
✓ Amount in crypto should be calculated
5. Send crypto to address (use test network)
6. Wait for confirmation
✓ Webhook should update payment status
✓ Status should change to "fee_paid"
```

**Test Case: Payment Confirmation**
```
After payment webhook received:
✓ Payment status: "succeeded"
✓ Loan status: "fee_paid"
✓ Confirmation email sent
✓ Receipt available for download
```

**Expected Emails:**
- Subject: "✅ Payment Confirmed - AmeriLend"
- Contains transaction ID
- Payment method details
- Receipt attached/linked

### 5. Loan Disbursement

**Test Case: Admin Initiates Disbursement**
```
1. Login as admin
2. Navigate to approved loan with paid fee
3. Click "Disburse Loan"
4. Enter bank details:
   - Account Holder: John Doe
   - Account Number: 1234567890
   - Routing Number: 021000021
5. Add admin notes: "Disbursement approved - verified identity"
6. Submit disbursement
✓ Status should change to "disbursed"
✓ Disbursement record created
✓ Disbursement email sent
✓ Transaction date recorded
```

**Test Case: Disbursement Without Payment**
```
1. Try to disburse loan before fee payment
✓ Should show error: "Processing fee must be paid before disbursement"
✓ Disbursement button should be disabled
✓ Status check should prevent disbursement
```

**Expected Emails:**
- Subject: "🎉 Funds Disbursed - AmeriLend"
- Contains disbursement amount
- Account last 4 digits
- Expected arrival time (1-2 business days)

### 6. Receipt and Document Management

**Test Case: Download Payment Receipt**
```
1. Navigate to loan application
2. Click "Download Receipt" in payments section
✓ PDF/HTML receipt should download
✓ Contains all payment details
✓ Transaction ID visible
✓ AmeriLend branding present
```

**Test Case: Export Transaction History**
```
1. Navigate to dashboard
2. Click "Export Transactions"
3. Select date range
4. Choose format: CSV
5. Download export
✓ CSV file should contain all transactions
✓ Includes payments and disbursements
✓ Properly formatted with headers
```

**Test Case: Upload Supporting Documents**
```
1. During loan application
2. Click "Upload Documents"
3. Select document type: "Income Proof"
4. Choose file: paystub.pdf (< 10MB)
5. Upload file
✓ Progress bar shown
✓ File uploaded to S3
✓ Document record created
✓ Thumbnail/preview available
```

**Test Case: Invalid File Upload**
```
1. Try to upload .exe file
✓ Should show error: "File type not allowed"
2. Try to upload 15MB file
✓ Should show error: "File too large"
```

## Error Handling Tests

### Test Case: Network Errors
```
1. Disconnect internet
2. Try to submit application
✓ Should show: "Connection error. Please check your internet."
3. Reconnect and retry
✓ Application should submit successfully
```

### Test Case: Validation Errors
```
1. Submit application with invalid email
✓ Should show: "Invalid email address"
2. Submit with invalid SSN format
✓ Should show: "Invalid SSN format. Use XXX-XX-XXXX"
3. Submit with negative income
✓ Should show: "Amount must be greater than zero"
```

### Test Case: Rate Limiting
```
1. Submit 100 requests rapidly
✓ After 100 requests should show: "Too many requests"
✓ Should require wait period
```

## Security Tests

### Test Case: Unauthorized Access
```
1. Logout
2. Try to access /api/loans/adminList directly
✓ Should return 401 Unauthorized
3. Login as regular user
4. Try to access admin endpoints
✓ Should return 403 Forbidden
```

### Test Case: SQL Injection Prevention
```
1. Enter SQL in form fields: `'; DROP TABLE users; --`
✓ Should be sanitized
✓ No database error
✓ Data stored safely
```

### Test Case: XSS Prevention
```
1. Enter script in name field: `<script>alert('xss')</script>`
✓ Should be escaped in display
✓ No script execution
```

## Performance Tests

### Test Case: Page Load Times
```
✓ Home page: < 2 seconds
✓ Dashboard: < 3 seconds
✓ Loan application: < 2 seconds
✓ Admin dashboard: < 3 seconds
```

### Test Case: API Response Times
```
✓ Loan submission: < 1 second
✓ Payment processing: < 3 seconds
✓ Disbursement: < 2 seconds
```

## Automated Test Script

Create a test script for automated verification:

```bash
#!/bin/bash
# run-e2e-tests.sh

echo "Starting E2E tests..."

# 1. Test authentication
curl -X POST http://localhost:3000/api/otp/requestCode \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","purpose":"signup"}'

# 2. Test loan submission
# (requires auth token from step 1)

# 3. Test admin approval
# (requires admin auth)

# 4. Test payment
# (requires approved loan)

# 5. Test disbursement
# (requires paid fee)

echo "All tests completed!"
```

## Monitoring Checklist

During testing, monitor:

- [ ] Console logs for errors
- [ ] Network tab for failed requests
- [ ] Database for correct data storage
- [ ] Email delivery (check spam)
- [ ] File uploads to S3
- [ ] Payment provider sandbox dashboard
- [ ] Notification logs

## Common Issues & Solutions

### Email Not Received
- Check spam folder
- Verify SendGrid API key
- Check sender domain verification
- Review notification logs in database

### Payment Fails
- Verify payment provider credentials
- Check sandbox vs production mode
- Review webhook configuration
- Check network connectivity

### File Upload Fails
- Verify AWS credentials
- Check S3 bucket permissions
- Verify CORS configuration
- Check file size and type

### Database Errors
- Verify connection string
- Check user permissions
- Run migrations
- Review schema changes

## Success Criteria

All tests pass when:

✓ User can register and login
✓ Loan application submitted successfully
✓ Admin can approve/reject loans
✓ Payment processing works for all methods
✓ Disbursement only after fee payment
✓ Emails sent at each workflow stage
✓ Receipts and exports generate correctly
✓ Documents upload and download properly
✓ Error messages are user-friendly
✓ Security measures prevent unauthorized access
✓ Performance meets targets

## Final Checklist

Before production deployment:

- [ ] All E2E tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Error handling tested
- [ ] Email templates verified
- [ ] Payment providers configured
- [ ] SSL certificate installed
- [ ] Monitoring and logging active
- [ ] Backup procedures in place
- [ ] Documentation complete
