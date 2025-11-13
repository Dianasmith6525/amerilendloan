import { config } from "dotenv";
import { getDb } from "./server/db.ts";
import { readFileSync } from "fs";
import { sql } from "drizzle-orm";

// Load environment variables
config();

async function createFeeConfigTable() {
  try {
    console.log("[DB] Creating feeConfiguration table...");
    
    const db = await getDb();
    const sqlContent = readFileSync("create-fee-configuration-table.sql", "utf-8");
    const statements = sqlContent
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));
    
    for (const statement of statements) {
      await db.execute(sql.raw(statement));
      console.log("[DB] ✓ Executed statement");
    }
    
    console.log("[DB] ✓ feeConfiguration table created successfully");
    console.log("[DB] ✓ Default fee configuration inserted");
    process.exit(0);
  } catch (error) {
    console.error("[DB] Error creating table:", error);
    process.exit(1);
  }
}

createFeeConfigTable();
