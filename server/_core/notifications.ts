import { getDb } from "../db";
import { userNotifications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Helper functions to create notifications for users
 */

export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: "loan_status" | "payment_reminder" | "payment_received" | "disbursement" | "system" | "referral",
  actionUrl?: string,
  metadata?: any
) {
  const database = await getDb();
  if (!database) {
    console.error("Database not available for notification creation");
    return null;
  }

  try {
    const [notification] = await database.insert(userNotifications).values({
      userId,
      title,
      message,
      type,
      read: 0,
      actionUrl,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

/**
 * Create loan status notification
 */
export async function notifyLoanStatus(
  userId: number,
  loanId: number,
  status: string,
  approvedAmount?: number
) {
  const messages: Record<string, { title: string; message: string }> = {
    approved: {
      title: "Loan Approved! 🎉",
      message: approvedAmount
        ? `Congratulations! Your loan of $${(approvedAmount / 100).toFixed(2)} has been approved.`
        : "Your loan application has been approved!",
    },
    rejected: {
      title: "Loan Application Update",
      message: "Unfortunately, your loan application was not approved at this time.",
    },
    fee_paid: {
      title: "Payment Received",
      message: "Your processing fee payment has been confirmed. Your loan is being processed.",
    },
    disbursed: {
      title: "Funds Disbursed! 💰",
      message: "Your loan has been disbursed. Check your bank account.",
    },
  };

  const notification = messages[status];
  if (!notification) return null;

  return await createNotification(
    userId,
    notification.title,
    notification.message,
    "loan_status",
    `/dashboard`,
    { loanId, status }
  );
}

/**
 * Create payment reminder notification
 */
export async function notifyPaymentReminder(
  userId: number,
  loanId: number,
  amount: number,
  dueDate: Date
) {
  const formattedAmount = `$${(amount / 100).toFixed(2)}`;
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return await createNotification(
    userId,
    "Payment Reminder",
    `Your payment of ${formattedAmount} is due on ${formattedDate}.`,
    "payment_reminder",
    `/payment/${loanId}`,
    { loanId, amount, dueDate: dueDate.toISOString() }
  );
}

/**
 * Create payment received notification
 */
export async function notifyPaymentReceived(
  userId: number,
  loanId: number,
  amount: number,
  paymentMethod: string
) {
  const formattedAmount = `$${(amount / 100).toFixed(2)}`;

  return await createNotification(
    userId,
    "Payment Received ✓",
    `We've received your payment of ${formattedAmount} via ${paymentMethod}.`,
    "payment_received",
    `/dashboard`,
    { loanId, amount, paymentMethod }
  );
}

/**
 * Create disbursement notification
 */
export async function notifyDisbursement(
  userId: number,
  loanId: number,
  amount: number,
  accountLast4?: string
) {
  const formattedAmount = `$${(amount / 100).toFixed(2)}`;
  const accountInfo = accountLast4 ? ` to account ending in ${accountLast4}` : "";

  return await createNotification(
    userId,
    "Loan Disbursed! 💰",
    `Your loan of ${formattedAmount} has been disbursed${accountInfo}.`,
    "disbursement",
    `/dashboard`,
    { loanId, amount }
  );
}

/**
 * Create referral notification
 */
export async function notifyReferral(
  userId: number,
  referralCode: string,
  rewardAmount: number,
  referredUserName?: string
) {
  const formattedAmount = `$${(rewardAmount / 100).toFixed(2)}`;
  const userName = referredUserName || "A friend";

  return await createNotification(
    userId,
    "Referral Bonus Earned! 🎁",
    `${userName} used your code ${referralCode}. You've earned ${formattedAmount}!`,
    "referral",
    `/referrals`,
    { referralCode, rewardAmount }
  );
}

/**
 * Create system notification
 */
export async function notifySystem(
  userId: number,
  title: string,
  message: string,
  actionUrl?: string
) {
  return await createNotification(userId, title, message, "system", actionUrl);
}

/**
 * Bulk create payment reminders for upcoming due dates
 * This should be called by a scheduled job (e.g., daily cron)
 */
export async function createPaymentReminders() {
  const database = await getDb();
  if (!database) return;

  // Logic to find loans with payments due in the next 3 days
  // and create notifications for users who haven't been notified yet
  // Implementation depends on your payment schedule schema
  
  console.log("Payment reminder job executed");
}
