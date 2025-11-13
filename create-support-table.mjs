import { getDb } from "./server/db.ts";

async function createSupportMessagesTable() {
  const db = await getDb();
  
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`supportMessages\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`userId\` int,
        \`senderName\` varchar(255) NOT NULL,
        \`senderEmail\` varchar(320) NOT NULL,
        \`senderPhone\` varchar(20),
        \`subject\` varchar(500) NOT NULL,
        \`message\` text NOT NULL,
        \`category\` enum('general','loan_inquiry','payment_issue','technical_support','complaint','other') NOT NULL DEFAULT 'general',
        \`status\` enum('new','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
        \`priority\` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
        \`adminResponse\` text,
        \`respondedBy\` int,
        \`respondedAt\` timestamp,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`supportMessages_id\` PRIMARY KEY(\`id\`)
      )
    `);
    
    console.log("✅ Support messages table created successfully!");
  } catch (error) {
    console.error("Error creating support messages table:", error);
  }
}

createSupportMessagesTable();
