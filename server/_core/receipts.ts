/**
 * Receipt generation and transaction export functionality
 */

import { Payment, LoanApplication, Disbursement } from '../../drizzle/schema';
import { logger } from './logging';

export interface Receipt {
  id: string;
  type: 'payment' | 'disbursement';
  date: string;
  amount: number;
  currency: string;
  description: string;
  recipient: string;
  metadata: Record<string, unknown>;
}

/**
 * Generate payment receipt HTML
 */
export function generatePaymentReceiptHTML(
  payment: Payment,
  application: LoanApplication,
  userEmail: string
): string {
  const amountFormatted = (payment.amount / 100).toFixed(2);
  const paymentMethod = payment.paymentMethod === 'crypto'
    ? `Cryptocurrency (${payment.cryptoCurrency})`
    : `Card ending in ${payment.cardLast4}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - AmeriLend</title>
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
    }
    .receipt-number {
      color: #666;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .total-row {
      background: #f0f9ff;
      font-weight: bold;
      font-size: 18px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      background: #16a34a;
      color: white;
      font-size: 12px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">AmeriLend</div>
    <div class="receipt-number">Payment Receipt #${payment.id}</div>
    <div class="receipt-number">Date: ${new Date(payment.completedAt || payment.createdAt).toLocaleDateString()}</div>
  </div>

  <h2>Payment Receipt</h2>
  <p>Thank you for your payment. This receipt confirms your transaction.</p>

  <table>
    <tr>
      <th>Description</th>
      <th style="text-align: right;">Amount</th>
    </tr>
    <tr>
      <td>Processing Fee - Loan Application #${application.id}</td>
      <td style="text-align: right;">$${amountFormatted}</td>
    </tr>
    <tr class="total-row">
      <td>Total Paid</td>
      <td style="text-align: right;">$${amountFormatted}</td>
    </tr>
  </table>

  <h3>Payment Details</h3>
  <table>
    <tr>
      <td><strong>Transaction ID:</strong></td>
      <td>${payment.paymentIntentId || payment.id}</td>
    </tr>
    <tr>
      <td><strong>Payment Method:</strong></td>
      <td>${paymentMethod}</td>
    </tr>
    <tr>
      <td><strong>Status:</strong></td>
      <td><span class="status-badge">${payment.status.toUpperCase()}</span></td>
    </tr>
    <tr>
      <td><strong>Email:</strong></td>
      <td>${userEmail}</td>
    </tr>
    ${payment.cryptoCurrency && payment.cryptoTxHash ? `
    <tr>
      <td><strong>Blockchain Transaction:</strong></td>
      <td>${payment.cryptoTxHash}</td>
    </tr>
    ` : ''}
  </table>

  <h3>Loan Application Details</h3>
  <table>
    <tr>
      <td><strong>Application ID:</strong></td>
      <td>#${application.id}</td>
    </tr>
    <tr>
      <td><strong>Applicant Name:</strong></td>
      <td>${application.fullName}</td>
    </tr>
    <tr>
      <td><strong>Approved Amount:</strong></td>
      <td>$${((application.approvedAmount || 0) / 100).toFixed(2)}</td>
    </tr>
    <tr>
      <td><strong>Loan Type:</strong></td>
      <td>${application.loanType === 'installment' ? 'Installment Loan' : 'Short-term Loan'}</td>
    </tr>
  </table>

  <div class="footer">
    <p><strong>AmeriLend</strong></p>
    <p>This is an official receipt for your records.</p>
    <p>For questions, contact us at support@amerilendloan.com or call 1-945-212-1609</p>
    <p>© ${new Date().getFullYear()} AmeriLend. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate disbursement receipt HTML
 */
export function generateDisbursementReceiptHTML(
  disbursement: Disbursement,
  application: LoanApplication,
  userEmail: string
): string {
  const amountFormatted = (disbursement.amount / 100).toFixed(2);
  const accountLast4 = disbursement.accountNumber.slice(-4);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Disbursement Receipt - AmeriLend</title>
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid #16a34a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #16a34a;
    }
    .receipt-number {
      color: #666;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .total-row {
      background: #f0fdf4;
      font-weight: bold;
      font-size: 18px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      background: #16a34a;
      color: white;
      font-size: 12px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">AmeriLend</div>
    <div class="receipt-number">Disbursement Receipt #${disbursement.id}</div>
    <div class="receipt-number">Date: ${new Date(disbursement.completedAt || disbursement.createdAt).toLocaleDateString()}</div>
  </div>

  <h2>Loan Disbursement Receipt</h2>
  <p>Your loan has been successfully disbursed. This receipt confirms the transaction.</p>

  <table>
    <tr>
      <th>Description</th>
      <th style="text-align: right;">Amount</th>
    </tr>
    <tr>
      <td>Loan Disbursement - Application #${application.id}</td>
      <td style="text-align: right;">$${amountFormatted}</td>
    </tr>
    <tr class="total-row">
      <td>Total Disbursed</td>
      <td style="text-align: right;">$${amountFormatted}</td>
    </tr>
  </table>

  <h3>Disbursement Details</h3>
  <table>
    <tr>
      <td><strong>Transaction ID:</strong></td>
      <td>${disbursement.transactionId || disbursement.id}</td>
    </tr>
    <tr>
      <td><strong>Account Holder:</strong></td>
      <td>${disbursement.accountHolderName}</td>
    </tr>
    <tr>
      <td><strong>Account Number:</strong></td>
      <td>****${accountLast4}</td>
    </tr>
    <tr>
      <td><strong>Routing Number:</strong></td>
      <td>${disbursement.routingNumber}</td>
    </tr>
    <tr>
      <td><strong>Status:</strong></td>
      <td><span class="status-badge">${disbursement.status.toUpperCase()}</span></td>
    </tr>
    <tr>
      <td><strong>Email:</strong></td>
      <td>${userEmail}</td>
    </tr>
  </table>

  <h3>Loan Details</h3>
  <table>
    <tr>
      <td><strong>Application ID:</strong></td>
      <td>#${application.id}</td>
    </tr>
    <tr>
      <td><strong>Applicant Name:</strong></td>
      <td>${application.fullName}</td>
    </tr>
    <tr>
      <td><strong>Loan Type:</strong></td>
      <td>${application.loanType === 'installment' ? 'Installment Loan' : 'Short-term Loan'}</td>
    </tr>
  </table>

  <div class="footer">
    <p><strong>AmeriLend</strong></p>
    <p>This is an official receipt for your records.</p>
    <p>The funds should appear in your account within 1-2 business days.</p>
    <p>For questions, contact us at support@amerilendloan.com or call 1-945-212-1609</p>
    <p>© ${new Date().getFullYear()} AmeriLend. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Export transaction history as CSV
 */
export function generateTransactionHistoryCSV(
  payments: Payment[],
  disbursements: Disbursement[]
): string {
  const headers = [
    'Date',
    'Type',
    'Transaction ID',
    'Amount',
    'Status',
    'Payment Method',
    'Description'
  ];

  const rows: string[][] = [headers];

  // Add payments
  for (const payment of payments) {
    rows.push([
      new Date(payment.createdAt).toLocaleDateString(),
      'Payment',
      payment.paymentIntentId || payment.id.toString(),
      `$${(payment.amount / 100).toFixed(2)}`,
      payment.status,
      payment.paymentMethod === 'crypto' ? `Crypto (${payment.cryptoCurrency})` : `Card (${payment.cardLast4})`,
      `Processing fee for loan #${payment.loanApplicationId}`
    ]);
  }

  // Add disbursements
  for (const disbursement of disbursements) {
    rows.push([
      new Date(disbursement.createdAt).toLocaleDateString(),
      'Disbursement',
      disbursement.transactionId || disbursement.id.toString(),
      `$${(disbursement.amount / 100).toFixed(2)}`,
      disbursement.status,
      `Bank Transfer`,
      `Loan disbursement for application #${disbursement.loanApplicationId}`
    ]);
  }

  // Convert to CSV
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

/**
 * Convert HTML receipt to PDF (placeholder - requires PDF library in production)
 */
export async function convertHTMLToPDF(html: string): Promise<Buffer> {
  // In production, use a library like puppeteer or pdfkit
  // For now, return the HTML as a buffer
  logger.warn('PDF conversion not implemented, returning HTML buffer');
  return Buffer.from(html, 'utf-8');
}

