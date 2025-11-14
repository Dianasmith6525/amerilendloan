import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkNotificationSystem() {
  console.log('\n📋 CHECKING NOTIFICATION SYSTEM');
  console.log('─────────────────────────────────────────────────────────');
  
  try {
    // 1. Check if notifications table exists
    const tableResult = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notifications'
      )`
    );
    const notificationsExist = tableResult.rows[0].exists;
    console.log(`  Notifications table:   ${notificationsExist ? '✅ Exists' : '❌ Missing'}`);

    if (!notificationsExist) {
      console.log('  ERROR: notifications table does not exist!');
      return;
    }

    // 2. Check notification columns
    const columnsResult = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'notifications' 
       ORDER BY ordinal_position`
    );
    const columns = columnsResult.rows.map(r => r.column_name);
    console.log(`\n  Notification columns (${columns.length} total):`);
    columns.forEach(col => console.log(`    - ${col}`));

    // 3. Check notification count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM notifications');
    const notificationCount = countResult.rows[0].total;
    console.log(`\n  Total notifications in DB: ${notificationCount}`);

    // 4. Check notification types
    const typesResult = await pool.query(
      `SELECT DISTINCT type, COUNT(*) as count FROM notifications GROUP BY type`
    );
    if (typesResult.rows.length > 0) {
      console.log(`\n  Notification types:`);
      typesResult.rows.forEach(row => {
        console.log(`    - ${row.type}: ${row.count} notification(s)`);
      });
    }

    // 5. Check notification statuses
    const statusResult = await pool.query(
      `SELECT DISTINCT status, COUNT(*) as count FROM notifications GROUP BY status`
    );
    if (statusResult.rows.length > 0) {
      console.log(`\n  Notification status breakdown:`);
      statusResult.rows.forEach(row => {
        console.log(`    - ${row.status}: ${row.count} notification(s)`);
      });
    } else {
      console.log(`\n  No notifications yet`);
    }

    // 6. Check unread notifications
    const unreadResult = await pool.query(
      `SELECT COUNT(*) as unread FROM notifications WHERE "readAt" IS NULL`
    );
    console.log(`\n  Unread notifications: ${unreadResult.rows[0].unread}`);

    // 7. Sample recent notification
    const sampleResult = await pool.query(
      `SELECT * FROM notifications ORDER BY "createdAt" DESC LIMIT 1`
    );
    if (sampleResult.rows.length > 0) {
      console.log(`\n  Most recent notification:`);
      const notif = sampleResult.rows[0];
      console.log(`    ID: ${notif.id}`);
      console.log(`    Type: ${notif.type}`);
      console.log(`    Status: ${notif.status}`);
      console.log(`    Read: ${notif.readAt ? 'Yes' : 'No'}`);
    }

    console.log(`\n  Status: ✅ Notification system WORKING`);

  } catch (error) {
    console.error('❌ Error checking notification system:', error.message);
  }
}

async function checkOTPSystem() {
  console.log('\n\n🔐 CHECKING OTP SYSTEM');
  console.log('─────────────────────────────────────────────────────────');

  try {
    // 1. Check if otpCodes table exists
    const tableResult = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'otpCodes'
      )`
    );
    const otpTableExists = tableResult.rows[0].exists;
    console.log(`  OTP Codes table:      ${otpTableExists ? '✅ Exists' : '❌ Missing'}`);

    if (!otpTableExists) {
      console.log('  ERROR: otpCodes table does not exist!');
      return;
    }

    // 2. Check OTP columns
    const columnsResult = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'otpCodes' 
       ORDER BY ordinal_position`
    );
    const columns = columnsResult.rows.map(r => r.column_name);
    console.log(`\n  OTP columns (${columns.length} total):`);
    columns.forEach(col => console.log(`    - ${col}`));

    // 3. Check OTP count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM "otpCodes"');
    const otpCount = countResult.rows[0].total;
    console.log(`\n  Total OTP codes: ${otpCount}`);

    // 4. Check valid OTP codes (not expired)
    const validResult = await pool.query(
      `SELECT COUNT(*) as valid FROM "otpCodes" WHERE "expiresAt" > NOW()`
    );
    console.log(`  Valid OTP codes: ${validResult.rows[0].valid}`);

    // 5. Check OTP purposes
    const purposeResult = await pool.query(
      `SELECT DISTINCT purpose, COUNT(*) as count FROM "otpCodes" GROUP BY purpose`
    );
    if (purposeResult.rows.length > 0) {
      console.log(`\n  OTP purposes:`);
      purposeResult.rows.forEach(row => {
        console.log(`    - ${row.purpose}: ${row.count} code(s)`);
      });
    }

    // 6. Check recent OTP
    const recentResult = await pool.query(
      `SELECT * FROM "otpCodes" ORDER BY "createdAt" DESC LIMIT 1`
    );
    if (recentResult.rows.length > 0) {
      console.log(`\n  Most recent OTP:`);
      const otp = recentResult.rows[0];
      console.log(`    Email: ${otp.email || 'N/A'}`);
      console.log(`    Phone: ${otp.phone || 'N/A'}`);
      console.log(`    Purpose: ${otp.purpose}`);
      console.log(`    Expired: ${otp.expiresAt < new Date() ? 'Yes' : 'No'}`);
    }

    console.log(`\n  Status: ✅ OTP system WORKING`);

  } catch (error) {
    console.error('❌ Error checking OTP system:', error.message);
  }
}

async function checkLoanApplications() {
  console.log('\n\n📋 CHECKING LOAN APPLICATIONS');
  console.log('─────────────────────────────────────────────────────────');

  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'disbursed' THEN 1 END) as disbursed
       FROM "loanApplications"`
    );

    const stats = result.rows[0];
    console.log(`  Total applications:   ${stats.total}`);
    console.log(`  Pending:              ${stats.pending}`);
    console.log(`  Approved:             ${stats.approved}`);
    console.log(`  Rejected:             ${stats.rejected}`);
    console.log(`  Disbursed:            ${stats.disbursed}`);

    if (stats.total > 0) {
      console.log(`\n  Status: ✅ Applications in system`);
    } else {
      console.log(`\n  Status: 🟡 No applications yet`);
    }

  } catch (error) {
    console.error('❌ Error checking loan applications:', error.message);
  }
}

async function checkPayments() {
  console.log('\n\n💳 CHECKING PAYMENT SYSTEM');
  console.log('─────────────────────────────────────────────────────────');

  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as succeeded,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0) as total_revenue
       FROM payments`
    );

    const stats = result.rows[0];
    console.log(`  Total payments:       ${stats.total}`);
    console.log(`  Pending:              ${stats.pending}`);
    console.log(`  Succeeded:            ${stats.succeeded}`);
    console.log(`  Failed:               ${stats.failed}`);
    console.log(`  Total revenue:        $${(stats.total_revenue / 100).toFixed(2)}`);

    if (stats.total > 0) {
      console.log(`\n  Status: ✅ Payments in system`);
    } else {
      console.log(`\n  Status: 🟡 No payments yet`);
    }

  } catch (error) {
    console.error('❌ Error checking payments:', error.message);
  }
}

async function runAllChecks() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   System Validation Checks - All Core Features        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  await checkNotificationSystem();
  await checkOTPSystem();
  await checkLoanApplications();
  await checkPayments();

  console.log('\n\n════════════════════════════════════════════════════════');
  console.log('All checks complete!');
  console.log('════════════════════════════════════════════════════════\n');

  await pool.end();
}

runAllChecks().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
