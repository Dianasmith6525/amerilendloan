# AmeriLend User Guide

**Website:** Available after deployment  
**Purpose:** Apply for consumer loans with transparent fees, multiple payment options, and comprehensive legal protection  
**Access:** Public website with secure authentication (OAuth or OTP)

## Powered by Manus

AmeriLend leverages cutting-edge technology to deliver a secure, fast, and professional lending platform.

**Frontend:** React 19 with TypeScript provides a type-safe, responsive user interface. Tailwind CSS 4 and shadcn/ui components create a modern, professional design with the signature blue and gold branding. The tRPC client ensures end-to-end type safety from frontend to backend.

**Backend:** Express 4 server with tRPC 11 provides a fully typed API layer with automatic validation. Superjson serialization handles complex data types seamlessly. Dual authentication supports both Manus OAuth and OTP email verification for maximum flexibility and security.

**Database:** MySQL/TiDB stores all data with Drizzle ORM for type-safe queries. The schema tracks loan applications, payments, fee configuration, disbursements, legal document acceptances, and OTP codes with comprehensive audit trails.

**Payment Processing:** Authorize.net integration handles secure card payments (Visa, Mastercard, Amex, Discover) with Accept.js tokenization that keeps card data off our servers. Cryptocurrency gateway supports Bitcoin, Ethereum, USDT, and USDC with real-time exchange rates, QR code generation, and blockchain monitoring.

**Legal Compliance:** Comprehensive legal documents include Terms of Service, Privacy Policy, Loan Agreements with TILA disclosures, and E-Sign Consent complying with federal E-SIGN Act requirements. All acceptances are tracked with timestamps and IP addresses for audit compliance.

**Deployment:** Auto-scaling infrastructure with global CDN ensures fast load times worldwide with built-in analytics.

## Using Your Website

### Signing In

AmeriLend offers two secure authentication methods. Click "Sign In" or "Get Started" to use Manus OAuth, which redirects to a secure login portal. Alternatively, click "OTP Login" to receive a 6-digit verification code via email. Enter your email address, click "Send Code", check your inbox, and enter the code within 10 minutes to access your account without passwords.

### Applying for a Loan

Click "Apply for a Loan" from the homepage or dashboard. Complete the application form with your personal information (name, email, phone, date of birth, Social Security Number), address details, employment status and monthly income, and loan requirements (type, amount, purpose). The form validates all inputs in real-time to catch errors before submission. After submitting, your application enters the review queue with a "Pending" status visible in your dashboard.

### Paying Processing Fees

After loan approval, you must pay the processing fee before receiving funds. Navigate to "Dashboard" and click "Pay Processing Fee" on your approved loan. The system displays the exact fee amount (typically 2% of your loan amount, configurable by admin). Choose your payment method from two options.

**Credit/Debit Card:** Select the "Credit/Debit Card" tab, enter your card number, expiration date, CVV, and billing ZIP code. Click "Pay Now" to process the payment securely through Authorize.net. Your card information is tokenized and never stored on our servers. You'll receive instant confirmation after successful payment.

**Cryptocurrency:** Select the "Cryptocurrency" tab, choose your preferred currency (Bitcoin, Ethereum, USDT, or USDC), and click "Generate Payment Address". The system displays a wallet address and QR code with the exact amount to send. Use your crypto wallet to send the payment to the provided address. The system monitors the blockchain and automatically confirms payment within minutes. Your loan status updates to "Fee Paid" after confirmation.

After payment confirmation, funds are disbursed to your bank account within 1-3 business days. You'll receive a receipt and can track disbursement status in your dashboard.

### Tracking Applications

Visit "Dashboard" to see all your loan applications in a table. Each row shows the application ID, loan type (Installment or Short-Term), requested amount, current status (Pending, Approved, Rejected, Fee Paid, or Disbursed), and submission date. Click "View Details" on any application to see complete information including approval decision, processing fee amount, payment method used, and disbursement details. For approved loans, you can download the loan agreement document and view your repayment schedule.

## Managing Your Website

### Admin Dashboard

Administrators sign in and navigate to "/admin" to access the admin panel. The dashboard has four tabs for managing the lending platform.

**Applications Tab:** View all loan applications in a searchable table. Filter by status using the dropdown menu. Click "Review" on pending applications to open the approval form. Enter the approved loan amount, interest rate, repayment term, and any notes. Click "Approve" to accept or "Reject" to decline the application. Approved applications automatically calculate the processing fee based on current configuration.

**Fee Configuration Tab:** Adjust processing fee settings. Toggle between "Percentage Mode" (1.5% - 2.5% of loan amount) and "Fixed Mode" ($1.50 - $2.50 flat fee). Use the slider to set the fee amount within the allowed range. Click "Save Configuration" to apply changes. The system validates that fees stay within regulatory limits.

**Disbursements Tab:** Process fund transfers for loans with confirmed fee payments. The table shows only loans in "Fee Paid" status ready for disbursement. Click "Disburse Funds" to open the disbursement form. Enter the transaction ID, disbursement method (ACH, Wire, Check), and any notes. Click "Complete Disbursement" to mark funds as sent and update the loan status to "Disbursed".

**Analytics Tab:** Monitor platform performance with key metrics displayed in cards: total applications submitted, approval rate percentage, total processing fees collected, and total amount disbursed. Use these metrics to track business growth and identify trends.

### Settings Panel

Access Settings from the Management UI (right panel icon in chatbox header) to configure platform settings.

**General:** Update "Website Name" and "Logo URL" to customize branding across the platform.

**Domains:** Modify the auto-generated domain prefix (xxx.manus.space) or bind custom domains for professional branding.

**Secrets:** View and edit environment variables. For Authorize.net, the system already has your API Login ID, Transaction Key, and Client Key configured. Set AUTHORIZENET_ENVIRONMENT to "production" when ready for live transactions. Add cryptocurrency gateway credentials (COINBASE_COMMERCE_API_KEY) for live crypto payments. Configure email service credentials (SENDGRID_API_KEY) for sending OTP codes to users.

**Database:** Use the built-in CRUD interface to view and edit loan applications, payments, and other data directly. Access full connection info in bottom-left settings (enable SSL for production databases).

### Legal Documents

AmeriLend includes four comprehensive legal documents accessible at "/legal/" URLs.

**Terms of Service** defines the lending relationship, eligibility requirements (18+, U.S. resident, valid SSN), loan terms and conditions, processing fee requirements, repayment obligations, default consequences, and arbitration provisions. Users must accept before applying for loans.

**Privacy Policy** discloses data collection practices (personal, financial, automated), information usage (services, communications, compliance), sharing practices (service providers, credit bureaus, legal authorities), user rights (access, correction, deletion, opt-out), and state-specific rights including CCPA for California residents.

**Loan Agreement** is generated for each approved loan with specific terms including borrower information, loan amount and purpose, interest rate and APR, processing fee details with payment confirmation, repayment schedule, disbursement conditions, Truth in Lending Act disclosures, and state-specific provisions. Borrowers must electronically sign before receiving funds.

**E-Sign Consent** complies with federal E-SIGN Act requirements, explaining electronic signature methods, hardware and software requirements, how to access and retain documents, right to receive paper copies, and withdrawal of consent procedures.

All document acceptances are tracked in the database with user ID, document type and version, timestamp, IP address, and user agent for compliance and audit purposes.

## Next Steps

Talk to Manus AI anytime to request changes or add features. The platform is fully customizable to meet your specific lending requirements and regulatory needs.

### Production Readiness

Your Authorize.net credentials are already configured and ready for production. Before going live with real payments:

**Authorize.net:** Set AUTHORIZENET_ENVIRONMENT to "production" in Settings → Secrets to enable live card processing. Your API Login ID, Transaction Key, and Client Key are already configured.

**Cryptocurrency Gateway:** Add COINBASE_COMMERCE_API_KEY and COINBASE_COMMERCE_WEBHOOK_SECRET in Settings → Secrets for live crypto payments. Get production keys from commerce.coinbase.com.

**Email Service:** Add SENDGRID_API_KEY in Settings → Secrets to send OTP codes via email. Get API key from sendgrid.com. Currently, OTP codes are logged to console for development.

Test all payment flows in sandbox mode before switching to production. Verify that processing fees are collected and confirmed before disbursements occur. Review all legal documents with an attorney to ensure compliance with your state's lending regulations.

Start by testing the complete loan workflow: apply for a loan, get approval from admin panel, pay processing fee with your preferred method, and verify disbursement processing. The blue and gold branding with professional background image creates a trustworthy first impression for your customers.
