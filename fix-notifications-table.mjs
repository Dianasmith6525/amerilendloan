import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Check if table exists
    const [tables] = await conn.query("SHOW TABLES LIKE 'notifications'");
    
    if (tables.length === 0) {
      console.log('notifications table does not exist. Creating it...');
      
      await conn.query(`
        CREATE TABLE notifications (
          id int AUTO_INCREMENT NOT NULL,
          userId int NOT NULL,
          loanApplicationId int,
          type enum('loan_submitted','loan_approved','loan_rejected','payment_confirmed','loan_disbursed','payment_reminder','general') NOT NULL,
          channel enum('email','sms','push') NOT NULL DEFAULT 'email',
          recipient varchar(320) NOT NULL,
          subject varchar(255),
          message text NOT NULL,
          status enum('pending','sent','delivered','failed','bounced') NOT NULL DEFAULT 'pending',
          sentAt timestamp NULL,
          deliveredAt timestamp NULL,
          errorMessage text,
          metadata text,
          createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT notifications_id PRIMARY KEY(id)
        );
      `);
      
      console.log('✓ notifications table created successfully!');
    } else {
      console.log('notifications table already exists. Checking structure...');
      const [rows] = await conn.query('DESCRIBE notifications');
      console.table(rows);
    }
    
    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
})();
