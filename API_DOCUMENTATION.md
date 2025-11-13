# AmeriLend API Documentation

**Author:** Manus AI  
**Version:** 1.0  
**Last Updated:** 2025-11-02

## Overview

The AmeriLend platform provides a comprehensive tRPC-based API for managing consumer loan applications, processing fee collection, and loan disbursement. This document outlines all available endpoints, request/response schemas, and workflow requirements.

## Architecture

AmeriLend uses **tRPC** for type-safe API communication between the frontend and backend. All procedures are defined in `server/routers.ts` and automatically generate TypeScript types for the client.

### Base URL

All API calls are made through the tRPC client at `/api/trpc`.

### Authentication

The platform uses **Manus OAuth** for authentication. Session cookies are automatically managed by the system. Protected procedures require a valid session token.

**Authentication States:**
- **Public Procedures**: Accessible without authentication
- **Protected Procedures**: Require authenticated user session
- **Admin Procedures**: Require authenticated user with `role = "admin"`

## API Endpoints

### Authentication

#### `auth.me`

Get current authenticated user information.

**Type:** Query  
**Access:** Public  
**Input:** None  
**Output:** `User | null`

```typescript
const { data: user } = trpc.auth.me.useQuery();
```

#### `auth.logout`

Logout current user and clear session.

**Type:** Mutation  
**Access:** Public  
**Input:** None  
**Output:** `{ success: boolean }`

```typescript
const logoutMutation = trpc.auth.logout.useMutation();
```

---

### Loan Applications

#### `loans.submit`

Submit a new loan application.

**Type:** Mutation  
**Access:** Protected  
**Input:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| fullName | string | Yes | Min 1 character |
| email | string | Yes | Valid email format |
| phone | string | Yes | Min 10 characters |
| dateOfBirth | string | Yes | Format: YYYY-MM-DD |
| ssn | string | Yes | Format: XXX-XX-XXXX |
| street | string | Yes | Min 1 character |
| city | string | Yes | Min 1 character |
| state | string | Yes | Exactly 2 characters (US state code) |
| zipCode | string | Yes | Min 5 characters |
| employmentStatus | enum | Yes | "employed", "self_employed", "unemployed", "retired" |
| employer | string | No | - |
| monthlyIncome | number | Yes | Positive integer (cents) |
| loanType | enum | Yes | "installment", "short_term" |
| requestedAmount | number | Yes | Positive integer (cents) |
| loanPurpose | string | Yes | Min 10 characters |

**Output:** `{ success: boolean }`

**Example:**

```typescript
const submitMutation = trpc.loans.submit.useMutation();

submitMutation.mutate({
  fullName: "John Doe",
  email: "john@example.com",
  phone: "(555) 123-4567",
  dateOfBirth: "1990-01-15",
  ssn: "123-45-6789",
  street: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001",
  employmentStatus: "employed",
  employer: "Tech Corp",
  monthlyIncome: 500000, // $5,000.00 in cents
  loanType: "installment",
  requestedAmount: 1000000, // $10,000.00 in cents
  loanPurpose: "Home renovation and repairs",
});
```

#### `loans.myApplications`

Get all loan applications for the authenticated user.

**Type:** Query  
**Access:** Protected  
**Input:** None  
**Output:** `LoanApplication[]`

```typescript
const { data: applications } = trpc.loans.myApplications.useQuery();
```

#### `loans.getById`

Get a specific loan application by ID.

**Type:** Query  
**Access:** Protected  
**Input:** `{ id: number }`  
**Output:** `LoanApplication`

**Authorization:** Users can only view their own applications. Admins can view all applications.

```typescript
const { data: application } = trpc.loans.getById.useQuery({ id: 123 });
```

#### `loans.adminList`

Get all loan applications (admin only).

**Type:** Query  
**Access:** Admin  
**Input:** None  
**Output:** `LoanApplication[]`

```typescript
const { data: allApplications } = trpc.loans.adminList.useQuery();
```

#### `loans.adminApprove`

Approve a loan application and calculate processing fee.

**Type:** Mutation  
**Access:** Admin  
**Input:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | Yes | Application ID |
| approvedAmount | number | Yes | Approved loan amount in cents |
| adminNotes | string | No | Internal notes |

**Output:** `{ success: boolean, processingFeeAmount: number }`

**Business Logic:**
1. Retrieves active fee configuration
2. Calculates processing fee based on mode:
   - **Percentage mode**: `(approvedAmount × percentageRate) / 10000`
   - **Fixed mode**: Uses `fixedFeeAmount` from config
3. Updates application status to `"approved"`
4. Sets `approvedAt` timestamp

```typescript
const approveMutation = trpc.loans.adminApprove.useMutation();

approveMutation.mutate({
  id: 123,
  approvedAmount: 1000000, // $10,000.00
  adminNotes: "Approved based on credit score and income verification",
});
```

#### `loans.adminReject`

Reject a loan application.

**Type:** Mutation  
**Access:** Admin  
**Input:**

| Field | Type | Required |
|-------|------|----------|
| id | number | Yes |
| rejectionReason | string | Yes |

**Output:** `{ success: boolean }`

```typescript
const rejectMutation = trpc.loans.adminReject.useMutation();

rejectMutation.mutate({
  id: 123,
  rejectionReason: "Insufficient income to support requested loan amount",
});
```

---

### Fee Configuration

#### `feeConfig.getActive`

Get the currently active fee configuration.

**Type:** Query  
**Access:** Public  
**Input:** None  
**Output:** `FeeConfiguration`

**Default Values (if no config exists):**
- `calculationMode`: "percentage"
- `percentageRate`: 200 (2.00%)
- `fixedFeeAmount`: 200 ($2.00)

```typescript
const { data: config } = trpc.feeConfig.getActive.useQuery();
```

#### `feeConfig.adminUpdate`

Update fee configuration (admin only).

**Type:** Mutation  
**Access:** Admin  
**Input:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| calculationMode | enum | Yes | "percentage" or "fixed" |
| percentageRate | number | Conditional | 150-250 (1.5%-2.5% in basis points) |
| fixedFeeAmount | number | Conditional | 150-250 ($1.50-$2.50 in cents) |

**Validation Rules:**
- If `calculationMode = "percentage"`, `percentageRate` is required
- If `calculationMode = "fixed"`, `fixedFeeAmount` is required

**Output:** `{ success: boolean }`

**Example:**

```typescript
// Set percentage mode at 2.0%
updateFeeConfigMutation.mutate({
  calculationMode: "percentage",
  percentageRate: 200, // 2.00%
});

// Set fixed fee mode at $2.00
updateFeeConfigMutation.mutate({
  calculationMode: "fixed",
  fixedFeeAmount: 200, // $2.00
});
```

---

### Payments

#### `payments.createIntent`

Create a payment intent for processing fee.

**Type:** Mutation  
**Access:** Protected  
**Input:** `{ loanApplicationId: number }`  
**Output:** `{ success: boolean, amount: number }`

**Validation:**
- Application must exist
- User must own the application
- Application status must be `"approved"`
- Processing fee must be calculated

**Side Effects:**
- Creates payment record with status `"pending"`
- Updates loan application status to `"fee_pending"`

```typescript
const createPaymentMutation = trpc.payments.createIntent.useMutation();

createPaymentMutation.mutate({
  loanApplicationId: 123,
});
```

#### `payments.confirmPayment`

Confirm payment completion (simulated for demo).

**Type:** Mutation  
**Access:** Protected  
**Input:** `{ paymentId: number }`  
**Output:** `{ success: boolean }`

**Side Effects:**
- Updates payment status to `"succeeded"`
- Sets `completedAt` timestamp
- Updates loan application status to `"fee_paid"`

**Production Note:** In production, this would be triggered by a payment provider webhook (e.g., Stripe).

```typescript
const confirmPaymentMutation = trpc.payments.confirmPayment.useMutation();

confirmPaymentMutation.mutate({
  paymentId: 456,
});
```

#### `payments.getByLoanId`

Get all payments for a specific loan application.

**Type:** Query  
**Access:** Protected  
**Input:** `{ loanApplicationId: number }`  
**Output:** `Payment[]`

**Authorization:** Users can only view payments for their own applications. Admins can view all payments.

```typescript
const { data: payments } = trpc.payments.getByLoanId.useQuery({
  loanApplicationId: 123,
});
```

---

### Disbursements

#### `disbursements.adminInitiate`

Initiate loan disbursement (admin only).

**Type:** Mutation  
**Access:** Admin  
**Input:**

| Field | Type | Required |
|-------|------|----------|
| loanApplicationId | number | Yes |
| accountHolderName | string | Yes |
| accountNumber | string | Yes |
| routingNumber | string | Yes |
| adminNotes | string | No |

**Critical Validation:**
- **Application status MUST be `"fee_paid"`** (enforces fee collection before disbursement)
- No existing disbursement for this application

**Output:** `{ success: boolean }`

**Side Effects:**
- Creates disbursement record with status `"pending"`
- Updates loan application status to `"disbursed"`
- Sets `disbursedAt` timestamp

```typescript
const disburseMutation = trpc.disbursements.adminInitiate.useMutation();

disburseMutation.mutate({
  loanApplicationId: 123,
  accountHolderName: "John Doe",
  accountNumber: "1234567890",
  routingNumber: "021000021",
  adminNotes: "Disbursement approved by manager",
});
```

#### `disbursements.getByLoanId`

Get disbursement record for a loan application.

**Type:** Query  
**Access:** Protected  
**Input:** `{ loanApplicationId: number }`  
**Output:** `Disbursement | undefined`

**Authorization:** Users can only view disbursements for their own applications. Admins can view all disbursements.

```typescript
const { data: disbursement } = trpc.disbursements.getByLoanId.useQuery({
  loanApplicationId: 123,
});
```

---

## Data Models

### LoanApplication

| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key |
| userId | number | Foreign key to users table |
| fullName | string | Applicant's full name |
| email | string | Contact email |
| phone | string | Contact phone |
| dateOfBirth | string | Format: YYYY-MM-DD |
| ssn | string | Format: XXX-XX-XXXX |
| street | string | Street address |
| city | string | City |
| state | string | US state code (2 chars) |
| zipCode | string | ZIP code |
| employmentStatus | enum | employed, self_employed, unemployed, retired |
| employer | string | null | Employer name |
| monthlyIncome | number | Monthly income in cents |
| loanType | enum | installment, short_term |
| requestedAmount | number | Requested loan amount in cents |
| loanPurpose | string | Purpose description |
| approvedAmount | number | null | Approved amount in cents |
| processingFeeAmount | number | null | Calculated fee in cents |
| status | enum | See status workflow below |
| rejectionReason | string | null | Reason if rejected |
| adminNotes | string | null | Internal admin notes |
| createdAt | timestamp | Application submission time |
| updatedAt | timestamp | Last update time |
| approvedAt | timestamp | null | Approval timestamp |
| disbursedAt | timestamp | null | Disbursement timestamp |

**Status Workflow:**

```
pending → under_review → approved → fee_pending → fee_paid → disbursed
                      ↓
                   rejected
```

### Payment

| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key |
| loanApplicationId | number | Foreign key |
| userId | number | Foreign key |
| amount | number | Payment amount in cents |
| currency | string | Currency code (default: USD) |
| paymentProvider | string | Provider name (default: stripe) |
| paymentIntentId | string | null | Provider payment intent ID |
| paymentMethodId | string | null | Provider payment method ID |
| status | enum | pending, processing, succeeded, failed, cancelled |
| failureReason | string | null | Reason if failed |
| createdAt | timestamp | Payment creation time |
| updatedAt | timestamp | Last update time |
| completedAt | timestamp | null | Completion timestamp |

### Disbursement

| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key |
| loanApplicationId | number | Foreign key |
| userId | number | Foreign key |
| amount | number | Disbursement amount in cents |
| accountHolderName | string | Bank account holder name |
| accountNumber | string | Bank account number |
| routingNumber | string | Bank routing number |
| status | enum | pending, processing, completed, failed |
| transactionId | string | null | External transaction reference |
| failureReason | string | null | Reason if failed |
| adminNotes | string | null | Internal notes |
| createdAt | timestamp | Disbursement creation time |
| updatedAt | timestamp | Last update time |
| completedAt | timestamp | null | Completion timestamp |
| initiatedBy | number | null | Admin user ID who initiated |

### FeeConfiguration

| Field | Type | Description |
|-------|------|-------------|
| id | number | Primary key |
| calculationMode | enum | percentage, fixed |
| percentageRate | number | Rate in basis points (200 = 2.00%) |
| fixedFeeAmount | number | Fixed fee in cents |
| isActive | number | 1 = active, 0 = inactive |
| updatedBy | number | null | Admin user ID |
| createdAt | timestamp | Configuration creation time |
| updatedAt | timestamp | Last update time |

---

## Workflow Examples

### Complete Loan Application Workflow

**1. User submits application**

```typescript
await trpc.loans.submit.mutate({
  // ... application data
  requestedAmount: 1000000, // $10,000
});
// Status: pending
```

**2. Admin reviews and approves**

```typescript
await trpc.loans.adminApprove.mutate({
  id: 123,
  approvedAmount: 1000000,
});
// Status: approved
// Processing fee calculated: $200 (2% of $10,000)
```

**3. User pays processing fee**

```typescript
// Create payment intent
const { amount } = await trpc.payments.createIntent.mutate({
  loanApplicationId: 123,
});
// Status: fee_pending

// Confirm payment (in production, triggered by webhook)
await trpc.payments.confirmPayment.mutate({
  paymentId: 456,
});
// Status: fee_paid
```

**4. Admin initiates disbursement**

```typescript
await trpc.disbursements.adminInitiate.mutate({
  loanApplicationId: 123,
  accountHolderName: "John Doe",
  accountNumber: "1234567890",
  routingNumber: "021000021",
});
// Status: disbursed
```

### Fee Configuration Update

**Update to percentage mode (2.5%)**

```typescript
await trpc.feeConfig.adminUpdate.mutate({
  calculationMode: "percentage",
  percentageRate: 250, // 2.5%
});
```

**Update to fixed fee mode ($1.50)**

```typescript
await trpc.feeConfig.adminUpdate.mutate({
  calculationMode: "fixed",
  fixedFeeAmount: 150, // $1.50
});
```

---

## Error Handling

All tRPC procedures use standard error codes:

| Code | Description | HTTP Equivalent |
|------|-------------|-----------------|
| BAD_REQUEST | Invalid input or business logic violation | 400 |
| UNAUTHORIZED | Not authenticated | 401 |
| FORBIDDEN | Insufficient permissions | 403 |
| NOT_FOUND | Resource not found | 404 |
| INTERNAL_SERVER_ERROR | Server error | 500 |

**Example Error Response:**

```typescript
try {
  await trpc.loans.adminApprove.mutate({ id: 123, approvedAmount: 1000000 });
} catch (error) {
  // error.code: "FORBIDDEN"
  // error.message: "User is not an admin"
}
```

---

## Security Considerations

### Authentication & Authorization

- All protected procedures verify session validity
- Admin procedures check `user.role === "admin"`
- Users can only access their own loan applications and payments
- Admins have full access to all resources

### Data Validation

- All monetary values stored in **cents** to avoid floating-point errors
- SSN format strictly validated: `XXX-XX-XXXX`
- Date of birth format: `YYYY-MM-DD`
- State codes validated against US state list
- Fee configuration ranges enforced (1.5%-2.5% or $1.50-$2.50)

### Critical Business Rules

1. **Processing fee MUST be paid before disbursement**
   - Enforced in `disbursements.adminInitiate` procedure
   - Application status must be `"fee_paid"`
   
2. **Fee calculation is automatic on approval**
   - Based on active fee configuration
   - Cannot be manually overridden
   
3. **Only one disbursement per loan application**
   - Checked before creating disbursement record

---

## Rate Limits

Currently, no rate limits are enforced. In production, consider implementing:

- Request throttling per user/IP
- Maximum concurrent requests
- API key-based quotas for third-party integrations

---

## Changelog

### Version 1.0 (2025-11-02)

- Initial API release
- Complete loan application workflow
- Processing fee collection system
- Admin approval and disbursement management
- Configurable fee calculation (percentage/fixed modes)

---

**For support or questions, contact the development team.**
