# AmeriLend Database Schema Documentation

**Author:** Manus AI  
**Version:** 1.0  
**Database:** MySQL/TiDB  
**ORM:** Drizzle ORM

## Overview

The AmeriLend database schema is designed to support a complete loan management workflow with mandatory processing fee collection before disbursement. The schema enforces data integrity through proper typing, constraints, and status enums.

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────────┐
│  loanApplications   │
└──────┬──────────────┘
       │
       ├─────────┬──────────┐
       │         │          │
       │ 1:N     │ 1:1      │ 1:1
       │         │          │
┌──────▼─────┐ ┌▼──────────▼┐ ┌─────────────┐
│  payments  │ │disbursements│ │feeConfiguration│
└────────────┘ └─────────────┘ └─────────────┘
```

## Tables

### users

Core user authentication and authorization table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| openId | VARCHAR(64) | NOT NULL, UNIQUE | Manus OAuth identifier |
| name | TEXT | NULL | User's display name |
| email | VARCHAR(320) | NULL | User's email address |
| loginMethod | VARCHAR(64) | NULL | Authentication method used |
| role | ENUM('user', 'admin') | NOT NULL, DEFAULT 'user' | User role for authorization |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update timestamp |
| lastSignedIn | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last login timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `openId`

**Notes:**
- The `role` field determines access to admin-only features
- Owner's `openId` is automatically assigned `admin` role on first login

---

### loanApplications

Stores all loan application data and tracks workflow status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique application identifier |
| userId | INT | NOT NULL | Foreign key to users.id |
| fullName | VARCHAR(255) | NOT NULL | Applicant's full legal name |
| email | VARCHAR(320) | NOT NULL | Contact email |
| phone | VARCHAR(20) | NOT NULL | Contact phone number |
| dateOfBirth | VARCHAR(10) | NOT NULL | Format: YYYY-MM-DD |
| ssn | VARCHAR(11) | NOT NULL | Format: XXX-XX-XXXX |
| street | VARCHAR(255) | NOT NULL | Street address |
| city | VARCHAR(100) | NOT NULL | City name |
| state | VARCHAR(2) | NOT NULL | US state code (e.g., NY, CA) |
| zipCode | VARCHAR(10) | NOT NULL | ZIP/postal code |
| employmentStatus | ENUM | NOT NULL | employed, self_employed, unemployed, retired |
| employer | VARCHAR(255) | NULL | Employer name (if applicable) |
| monthlyIncome | INT | NOT NULL | Monthly income in cents |
| loanType | ENUM | NOT NULL | installment, short_term |
| requestedAmount | INT | NOT NULL | Requested loan amount in cents |
| loanPurpose | TEXT | NOT NULL | Description of loan purpose |
| approvedAmount | INT | NULL | Approved loan amount in cents |
| processingFeeAmount | INT | NULL | Calculated processing fee in cents |
| status | ENUM | NOT NULL, DEFAULT 'pending' | Current application status |
| rejectionReason | TEXT | NULL | Reason for rejection (if applicable) |
| adminNotes | TEXT | NULL | Internal admin notes |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW() | Application submission time |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last modification time |
| approvedAt | TIMESTAMP | NULL | Approval timestamp |
| disbursedAt | TIMESTAMP | NULL | Disbursement timestamp |

**Status Enum Values:**
- `pending` - Initial submission, awaiting review
- `under_review` - Being reviewed by admin
- `approved` - Approved, awaiting processing fee payment
- `fee_pending` - Processing fee payment initiated
- `fee_paid` - Processing fee confirmed paid (ready for disbursement)
- `disbursed` - Loan funds disbursed to applicant
- `rejected` - Application rejected
- `cancelled` - Application cancelled by user

**Status Workflow:**

```
pending → under_review → approved → fee_pending → fee_paid → disbursed
                      ↓
                   rejected
                      ↓
                  cancelled
```

**Business Rules:**
- All monetary values stored in **cents** to avoid floating-point precision issues
- `approvedAmount` and `processingFeeAmount` are set when status changes to `approved`
- `processingFeeAmount` is automatically calculated based on active fee configuration
- Status must be `fee_paid` before disbursement can be initiated

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `userId` for efficient user application lookups
- INDEX on `status` for admin filtering

---

### feeConfiguration

Stores processing fee calculation settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Configuration record ID |
| calculationMode | ENUM('percentage', 'fixed') | NOT NULL, DEFAULT 'percentage' | Fee calculation method |
| percentageRate | INT | NOT NULL, DEFAULT 200 | Fee rate in basis points (200 = 2.00%) |
| fixedFeeAmount | INT | NOT NULL, DEFAULT 200 | Fixed fee in cents ($2.00) |
| isActive | INT | NOT NULL, DEFAULT 1 | 1 = active, 0 = inactive |
| updatedBy | INT | NULL | Admin user ID who made the update |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW() | Configuration creation time |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update time |

**Calculation Modes:**

1. **Percentage Mode** (`calculationMode = 'percentage'`)
   - Fee = `(loanAmount × percentageRate) / 10000`
   - Range: 150-250 basis points (1.5% - 2.5%)
   - Example: $10,000 loan × 200 / 10000 = $200 fee

2. **Fixed Mode** (`calculationMode = 'fixed'`)
   - Fee = `fixedFeeAmount`
   - Range: 150-250 cents ($1.50 - $2.50)
   - Example: $2.00 fee regardless of loan amount

**Business Rules:**
- Only one configuration can be active (`isActive = 1`) at a time
- When a new configuration is created, all previous configurations are set to `isActive = 0`
- Default configuration: 2.00% percentage mode

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `isActive` for quick active config lookup

---

### payments

Tracks processing fee payment records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Payment record ID |
| loanApplicationId | INT | NOT NULL | Foreign key to loanApplications.id |
| userId | INT | NOT NULL | Foreign key to users.id |
| amount | INT | NOT NULL | Payment amount in cents |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Currency code |
| paymentProvider | VARCHAR(50) | NOT NULL, DEFAULT 'stripe' | Payment processor name |
| paymentIntentId | VARCHAR(255) | NULL | Provider's payment intent ID |
| paymentMethodId | VARCHAR(255) | NULL | Provider's payment method ID |
| status | ENUM | NOT NULL, DEFAULT 'pending' | Payment status |
| failureReason | TEXT | NULL | Reason for payment failure |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW() | Payment initiation time |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update time |
| completedAt | TIMESTAMP | NULL | Payment completion timestamp |

**Status Enum Values:**
- `pending` - Payment initiated, awaiting processing
- `processing` - Payment being processed by provider
- `succeeded` - Payment successfully completed
- `failed` - Payment failed
- `cancelled` - Payment cancelled by user

**Payment Workflow:**

```
pending → processing → succeeded
                    ↓
                  failed
                    ↓
                cancelled
```

**Business Rules:**
- One payment record per loan application (multiple attempts create new records)
- When payment status changes to `succeeded`, loan application status updates to `fee_paid`
- `completedAt` is set when status changes to `succeeded` or `failed`

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `loanApplicationId` for application payment lookup
- INDEX on `userId` for user payment history

---

### disbursements

Tracks loan disbursement records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Disbursement record ID |
| loanApplicationId | INT | NOT NULL | Foreign key to loanApplications.id |
| userId | INT | NOT NULL | Foreign key to users.id |
| amount | INT | NOT NULL | Disbursement amount in cents |
| accountHolderName | VARCHAR(255) | NOT NULL | Bank account holder name |
| accountNumber | VARCHAR(50) | NOT NULL | Bank account number |
| routingNumber | VARCHAR(20) | NOT NULL | Bank routing number |
| status | ENUM | NOT NULL, DEFAULT 'pending' | Disbursement status |
| transactionId | VARCHAR(255) | NULL | External transaction reference |
| failureReason | TEXT | NULL | Reason for disbursement failure |
| adminNotes | TEXT | NULL | Internal admin notes |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW() | Disbursement initiation time |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT NOW() ON UPDATE NOW() | Last update time |
| completedAt | TIMESTAMP | NULL | Disbursement completion timestamp |
| initiatedBy | INT | NULL | Admin user ID who initiated |

**Status Enum Values:**
- `pending` - Awaiting processing
- `processing` - Being processed
- `completed` - Successfully disbursed
- `failed` - Disbursement failed

**Disbursement Workflow:**

```
pending → processing → completed
                    ↓
                  failed
```

**Critical Business Rules:**
- **Loan application status MUST be `fee_paid` before disbursement can be initiated**
- Only one disbursement record allowed per loan application
- `amount` must match `approvedAmount` from loan application
- When disbursement is initiated, loan application status updates to `disbursed`

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `loanApplicationId` (one disbursement per loan)
- INDEX on `userId` for user disbursement lookup

---

## Data Types and Conventions

### Monetary Values

All monetary values are stored as **integers in cents** to avoid floating-point precision issues.

**Examples:**
- $10,000.00 → 1000000 cents
- $2.50 → 250 cents
- 2.00% → 200 basis points

**Conversion:**
```typescript
// Dollars to cents
const cents = Math.round(dollars * 100);

// Cents to dollars
const dollars = cents / 100;
```

### Timestamps

All timestamps use MySQL `TIMESTAMP` type with automatic management:
- `DEFAULT NOW()` for creation timestamps
- `DEFAULT NOW() ON UPDATE NOW()` for update timestamps
- Stored in UTC, converted to local timezone in application layer

### Enums

Enums are used for fields with fixed value sets to ensure data integrity:
- `users.role`: 'user', 'admin'
- `loanApplications.employmentStatus`: 'employed', 'self_employed', 'unemployed', 'retired'
- `loanApplications.loanType`: 'installment', 'short_term'
- `loanApplications.status`: 'pending', 'under_review', 'approved', 'fee_pending', 'fee_paid', 'disbursed', 'rejected', 'cancelled'
- `feeConfiguration.calculationMode`: 'percentage', 'fixed'
- `payments.status`: 'pending', 'processing', 'succeeded', 'failed', 'cancelled'
- `disbursements.status`: 'pending', 'processing', 'completed', 'failed'

---

## Migrations

Database migrations are managed using **Drizzle Kit**.

### Running Migrations

```bash
# Generate migration files
pnpm db:push

# This command:
# 1. Generates SQL migration file in drizzle/ directory
# 2. Applies migration to database
```

### Migration History

| Version | Date | Description |
|---------|------|-------------|
| 0001_faulty_daimon_hellstrom.sql | 2025-11-02 | Initial schema with users, loanApplications, feeConfiguration, payments, disbursements |

---

## Seed Data

Default fee configuration is seeded on first deployment:

```sql
INSERT INTO feeConfiguration (calculationMode, percentageRate, fixedFeeAmount, isActive)
VALUES ('percentage', 200, 200, 1);
```

This sets the default processing fee to **2.00% of loan amount**.

---

## Query Optimization

### Recommended Indexes

Current indexes are sufficient for typical query patterns:

1. **User lookups by openId** (OAuth authentication)
   - UNIQUE INDEX on `users.openId`

2. **User's loan applications**
   - INDEX on `loanApplications.userId`

3. **Admin application filtering by status**
   - INDEX on `loanApplications.status`

4. **Active fee configuration lookup**
   - INDEX on `feeConfiguration.isActive`

5. **Payment history by application**
   - INDEX on `payments.loanApplicationId`

6. **Disbursement lookup by application**
   - UNIQUE INDEX on `disbursements.loanApplicationId`

### Query Patterns

**Get user's applications with payment status:**
```sql
SELECT 
  la.*,
  p.status as payment_status,
  p.completedAt as payment_completed_at
FROM loanApplications la
LEFT JOIN payments p ON la.id = p.loanApplicationId
WHERE la.userId = ?
ORDER BY la.createdAt DESC;
```

**Get applications ready for disbursement:**
```sql
SELECT la.*
FROM loanApplications la
WHERE la.status = 'fee_paid'
  AND NOT EXISTS (
    SELECT 1 FROM disbursements d 
    WHERE d.loanApplicationId = la.id
  )
ORDER BY la.approvedAt ASC;
```

---

## Security Considerations

### Sensitive Data

The following fields contain sensitive information and should be handled with care:

- `loanApplications.ssn` - Social Security Number
- `loanApplications.dateOfBirth` - Date of birth
- `disbursements.accountNumber` - Bank account number
- `disbursements.routingNumber` - Bank routing number

**Recommendations:**
- Encrypt at rest in production environments
- Mask in logs and error messages
- Limit access to admin users only
- Implement audit logging for access

### Access Control

Database access is controlled through application-level authorization:

- **Public access**: Fee configuration (read-only)
- **User access**: Own loan applications, payments, disbursements
- **Admin access**: All records, write access to fee configuration

### Data Retention

Consider implementing data retention policies:
- Archive completed loans after 7 years (regulatory requirement)
- Anonymize rejected applications after 1 year
- Purge cancelled applications after 90 days

---

## Backup and Recovery

### Backup Strategy

Recommended backup schedule:
- **Full backup**: Daily at 2:00 AM UTC
- **Incremental backup**: Every 6 hours
- **Transaction log backup**: Every 15 minutes

### Recovery Procedures

1. **Point-in-time recovery**: Use transaction logs to restore to specific timestamp
2. **Table-level recovery**: Restore individual tables from backup
3. **Disaster recovery**: Maintain off-site backup replicas

---

## Performance Metrics

Expected table sizes (1 year, 10,000 applications):

| Table | Estimated Rows | Estimated Size |
|-------|----------------|----------------|
| users | 10,000 | ~2 MB |
| loanApplications | 10,000 | ~15 MB |
| feeConfiguration | ~50 | <1 MB |
| payments | ~8,000 | ~3 MB |
| disbursements | ~7,000 | ~2 MB |

**Total estimated size**: ~25 MB per 10,000 applications

---

## Changelog

### Version 1.0 (2025-11-02)

- Initial schema design
- Five core tables: users, loanApplications, feeConfiguration, payments, disbursements
- Complete workflow support from application to disbursement
- Configurable fee calculation system
- Status-based workflow enforcement

---

**For schema modifications or questions, contact the development team.**
