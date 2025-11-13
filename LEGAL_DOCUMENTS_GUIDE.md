# Legal Documents Implementation Guide

## Overview

AmeriLend now includes comprehensive legal documentation to ensure compliance with federal and state lending regulations. This guide covers the legal documents included, the acceptance tracking system, and implementation details for displaying and managing legal agreements.

## Included Legal Documents

### 1. Terms of Service

**Location:** `client/public/legal/terms-of-service.md`  
**Version:** 1.0  
**Effective Date:** November 2, 2025

The Terms of Service document covers all aspects of the lending relationship, including:

- Eligibility requirements (18+, U.S. resident, valid SSN)
- Loan application process and approval criteria
- Processing fee requirements and payment methods
- Loan types (installment and short-term)
- Interest rates and APR disclosures
- Repayment terms and prepayment rights
- Default consequences and collections procedures
- Privacy and data protection overview
- Electronic communications and signatures consent
- Prohibited uses and intellectual property rights
- Disclaimers, limitations of liability, and indemnification
- Governing law and arbitration provisions
- State-specific disclosures

**Key Provisions:**

The Terms of Service explicitly states that processing fees are non-refundable and must be paid before loan disbursement. This aligns with the core business requirement that fees must be collected and confirmed paid before any funds are released.

### 2. Privacy Policy

**Location:** `client/public/legal/privacy-policy.md`  
**Version:** 1.0  
**Effective Date:** November 2, 2025

The Privacy Policy provides comprehensive disclosure of data practices, including:

- Types of information collected (personal, financial, automated)
- How information is used (services, communications, compliance)
- Information sharing practices (service providers, credit bureaus, legal authorities)
- User privacy rights (access, correction, deletion, opt-out)
- State-specific rights (CCPA for California, Nevada opt-out)
- Data security measures (technical, organizational, physical)
- Data retention policies
- Cookies and tracking technologies
- Third-party links and children's privacy
- International data transfers

**Compliance Features:**

The Privacy Policy includes specific sections for California residents under CCPA, Nevada residents' opt-out rights, and general state law compliance. It provides clear contact information for privacy inquiries and complaint procedures.

### 3. Loan Agreement

**Location:** `client/public/legal/loan-agreement.md`  
**Version:** 1.0

The Loan Agreement is a template that will be populated with specific loan details for each approved application. It includes:

- Borrower and lender information
- Loan amount, type, and purpose
- Interest rate and APR
- Processing fee details and payment confirmation
- Repayment schedule and payment methods
- Application of payments (fees → interest → principal)
- Prepayment rights (no penalty)
- Disbursement details and conditions
- Borrower representations and warranties
- Borrower covenants and obligations
- Events of default and remedies
- Credit reporting disclosures
- Right to cancel (3-day rescission for secured loans)
- Truth in Lending Act (TILA) disclosures
- Electronic signature consent
- State-specific disclosures

**Dynamic Fields:**

The loan agreement template includes placeholders for dynamic data:
- `[BORROWER_NAME]`, `[BORROWER_ADDRESS]`, `[SSN]`
- `[LOAN_AMOUNT]`, `[LOAN_TYPE]`, `[LOAN_PURPOSE]`
- `[INTEREST_RATE]`, `[APR]`
- `[PROCESSING_FEE]`, `[FEE_PAYMENT_DATE]`, `[PAYMENT_METHOD]`
- `[NUMBER_OF_PAYMENTS]`, `[PAYMENT_AMOUNT]`, `[PAYMENT_DAY]`
- `[BANK_NAME]`, `[ACCOUNT_NUMBER]`, `[ROUTING_NUMBER]`
- `[STATE]` (for governing law and state-specific disclosures)

### 4. E-Sign Consent

**Location:** `client/public/legal/esign-consent.md`  
**Version:** 1.0  
**Effective Date:** November 2, 2025

The E-Sign Consent document complies with the Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and covers:

- Scope of electronic communications
- Electronic delivery methods (email, account dashboard, SMS)
- Electronic signature methods
- Hardware and software requirements
- How to access and retain communications
- Right to receive paper copies
- Withdrawal of consent and consequences
- Updating contact information
- System requirements changes
- Federal law compliance (E-SIGN Act)
- Demonstration and acknowledgment

**Technical Requirements:**

The document clearly states the technical requirements for accessing electronic documents:
- Computer, smartphone, or tablet with internet access
- Current web browser (Chrome, Firefox, Safari, Edge)
- PDF reader software
- Email account with sufficient storage

## Database Schema

### Legal Acceptances Table

The `legalAcceptances` table tracks all legal document acceptances:

```sql
CREATE TABLE legalAcceptances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  loanApplicationId INT,  -- Optional, for loan-specific agreements
  documentType ENUM(
    'terms_of_service',
    'privacy_policy',
    'loan_agreement',
    'esign_consent'
  ) NOT NULL,
  documentVersion VARCHAR(20) NOT NULL,  -- e.g., "1.0", "2.1"
  ipAddress VARCHAR(45),  -- IPv4 or IPv6
  userAgent TEXT,
  acceptedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

**Key Features:**

1. **User Tracking:** Links acceptances to specific users via `userId`
2. **Loan Association:** Optional `loanApplicationId` for loan-specific agreements
3. **Document Versioning:** Tracks which version was accepted
4. **Audit Trail:** Records IP address, user agent, and timestamp
5. **Compliance:** Provides evidence of informed consent

## API Endpoints

### Accept Document

```typescript
trpc.legal.acceptDocument.useMutation({
  documentType: "terms_of_service" | "privacy_policy" | "loan_agreement" | "esign_consent",
  documentVersion: "1.0",
  loanApplicationId: 123,  // Optional
  ipAddress: "192.168.1.1",  // Optional
  userAgent: "Mozilla/5.0..."  // Optional
})
```

**Purpose:** Records a user's acceptance of a legal document.

**Authentication:** Requires user to be logged in (`protectedProcedure`)

**Behavior:**
- Inserts a new record in `legalAcceptances` table
- Associates acceptance with current user
- Optionally links to specific loan application
- Records IP address and user agent for audit trail
- Returns success confirmation

### Check Acceptance

```typescript
trpc.legal.hasAccepted.useQuery({
  documentType: "terms_of_service",
  loanApplicationId: 123  // Optional
})
```

**Purpose:** Checks if the current user has accepted a specific document.

**Authentication:** Requires user to be logged in

**Behavior:**
- Queries `legalAcceptances` table
- Filters by user ID and document type
- Optionally filters by loan application ID
- Returns boolean (true if accepted, false otherwise)

**Use Cases:**
- Show/hide acceptance checkboxes
- Enforce acceptance before proceeding
- Display acceptance status in admin panel

### Get User Acceptances

```typescript
trpc.legal.getMyAcceptances.useQuery()
```

**Purpose:** Retrieves all legal document acceptances for the current user.

**Authentication:** Requires user to be logged in

**Behavior:**
- Queries all acceptances for current user
- Returns array of acceptance records
- Includes document type, version, timestamp, IP address

**Use Cases:**
- Display acceptance history in user profile
- Audit trail for compliance
- Support for user data requests (CCPA, GDPR)

## Implementation Workflow

### During Signup

1. **Display E-Sign Consent**
   - Show E-Sign Consent document
   - Require explicit acceptance checkbox
   - Record acceptance with timestamp and IP

2. **Display Terms of Service**
   - Show Terms of Service document
   - Require explicit acceptance checkbox
   - Record acceptance

3. **Display Privacy Policy**
   - Show Privacy Policy document
   - Require explicit acceptance checkbox
   - Record acceptance

4. **Create Account**
   - Only proceed if all documents accepted
   - Store acceptance records in database

### During Loan Application

1. **Check Previous Acceptances**
   - Query if user has accepted current versions
   - If not, require re-acceptance

2. **Display Loan-Specific Documents**
   - Show any updated terms
   - Require acceptance before submission

3. **Submit Application**
   - Record document acceptances
   - Link to loan application ID

### Upon Loan Approval

1. **Generate Loan Agreement**
   - Populate template with loan details
   - Include processing fee information
   - Display to borrower

2. **Require Acceptance**
   - Show complete loan agreement
   - Require electronic signature
   - Record acceptance with loan application ID

3. **Process Payment**
   - Only allow payment after agreement acceptance
   - Link payment to accepted agreement

4. **Disbursement**
   - Verify all documents accepted
   - Verify processing fee paid
   - Proceed with disbursement

## Frontend Implementation

### Document Display Component

Create a reusable component for displaying legal documents:

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import ReactMarkdown from "react-markdown";

interface LegalDocumentProps {
  documentType: "terms_of_service" | "privacy_policy" | "loan_agreement" | "esign_consent";
  documentVersion: string;
  loanApplicationId?: number;
  onAccept?: () => void;
}

export function LegalDocument({ 
  documentType, 
  documentVersion, 
  loanApplicationId,
  onAccept 
}: LegalDocumentProps) {
  const [accepted, setAccepted] = useState(false);
  const [content, setContent] = useState("");

  // Load document content
  useEffect(() => {
    fetch(`/legal/${documentType}.md`)
      .then(res => res.text())
      .then(setContent);
  }, [documentType]);

  const acceptMutation = trpc.legal.acceptDocument.useMutation({
    onSuccess: () => {
      toast.success("Document accepted");
      onAccept?.();
    },
  });

  const handleAccept = () => {
    acceptMutation.mutate({
      documentType,
      documentVersion,
      loanApplicationId,
      ipAddress: window.location.hostname, // Or use a service to get real IP
      userAgent: navigator.userAgent,
    });
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-96 border rounded-lg p-4">
        <ReactMarkdown>{content}</ReactMarkdown>
      </ScrollArea>
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="accept" 
          checked={accepted}
          onCheckedChange={(checked) => setAccepted(checked as boolean)}
        />
        <label htmlFor="accept" className="text-sm">
          I have read and agree to the {documentType.replace(/_/g, " ")}
        </label>
      </div>

      <Button 
        onClick={handleAccept}
        disabled={!accepted || acceptMutation.isPending}
      >
        {acceptMutation.isPending ? "Processing..." : "Accept and Continue"}
      </Button>
    </div>
  );
}
```

### Loan Application Integration

Update the loan application flow to require legal document acceptance:

```typescript
// In ApplyLoan.tsx

const [legalAccepted, setLegalAccepted] = useState({
  terms: false,
  privacy: false,
  esign: false,
});

// Check if user has already accepted current versions
const { data: hasAcceptedTerms } = trpc.legal.hasAccepted.useQuery({
  documentType: "terms_of_service",
});

const { data: hasAcceptedPrivacy } = trpc.legal.hasAccepted.useQuery({
  documentType: "privacy_policy",
});

const { data: hasAcceptedEsign } = trpc.legal.hasAccepted.useQuery({
  documentType: "esign_consent",
});

// Before form submission
const handleSubmit = (e) => {
  e.preventDefault();

  if (!hasAcceptedTerms || !hasAcceptedPrivacy || !hasAcceptedEsign) {
    toast.error("Please accept all legal documents before submitting");
    return;
  }

  // Proceed with submission
  submitMutation.mutate(formData);
};
```

## Compliance Considerations

### Federal Regulations

1. **Truth in Lending Act (TILA)**
   - Loan agreement includes all required TILA disclosures
   - APR, finance charge, amount financed, total of payments
   - Payment schedule and late fee disclosures

2. **E-SIGN Act**
   - E-Sign Consent complies with federal requirements
   - Users can access, download, and print documents
   - Right to receive paper copies upon request

3. **Fair Credit Reporting Act (FCRA)**
   - Privacy Policy discloses credit bureau reporting
   - Terms of Service explains impact on credit score

4. **Gramm-Leach-Bliley Act (GLBA)**
   - Privacy Policy meets GLBA privacy notice requirements
   - Explains information sharing practices

### State Regulations

1. **State Lending Laws**
   - Loan agreement includes state-specific disclosures
   - Interest rate caps and fee limitations vary by state
   - Some states require additional licensing

2. **State Privacy Laws**
   - Privacy Policy includes CCPA provisions for California
   - Nevada opt-out rights included
   - Other state laws addressed as applicable

3. **Usury Laws**
   - Interest rates must comply with state usury limits
   - Some states cap rates at 36% APR or lower

### Best Practices

1. **Regular Updates**
   - Review legal documents annually
   - Update for regulatory changes
   - Increment version numbers when updated
   - Require re-acceptance of updated documents

2. **Audit Trail**
   - Maintain complete acceptance records
   - Include IP addresses and timestamps
   - Store for at least 7 years

3. **Accessibility**
   - Ensure documents are readable
   - Provide in plain language where possible
   - Offer assistance for users with disabilities

4. **Legal Review**
   - Have documents reviewed by attorney
   - Ensure compliance with current laws
   - Update for jurisdiction-specific requirements

## Testing

### Test Document Acceptance

1. Create test user account
2. Navigate to legal document display
3. Read document
4. Check acceptance checkbox
5. Click "Accept and Continue"
6. Verify acceptance recorded in database
7. Verify timestamp and IP address captured

### Test Acceptance Enforcement

1. Attempt to submit loan application without accepting documents
2. Verify error message displayed
3. Accept required documents
4. Verify application submission proceeds

### Test Acceptance History

1. Accept multiple documents
2. Query user's acceptance history
3. Verify all acceptances returned
4. Verify correct versions and timestamps

## Production Deployment

### Pre-Deployment Checklist

- [ ] Legal documents reviewed by attorney
- [ ] State-specific disclosures added
- [ ] Document versions finalized
- [ ] Acceptance tracking tested
- [ ] IP address capture verified
- [ ] Timestamp accuracy confirmed
- [ ] Document display tested on all devices
- [ ] Accessibility verified
- [ ] Paper copy request process documented
- [ ] Document retention policy established

### Post-Deployment

- Monitor acceptance rates
- Track document access patterns
- Respond to paper copy requests promptly
- Maintain audit trail
- Update documents as regulations change

---

**Last Updated:** November 2, 2025  
**Version:** 1.0  
**Author:** Manus AI
