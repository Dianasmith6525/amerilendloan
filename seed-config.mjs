import { drizzle } from "drizzle-orm/mysql2";
import { feeConfiguration } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seedFeeConfiguration() {
  console.log("Seeding default fee configuration...");
  
  try {
    // Insert default configuration
    await db.insert(feeConfiguration).values({
      calculationMode: "percentage",
      percentageRate: 200, // 2.00%
      fixedFeeAmount: 200, // $2.00
      isActive: 1,
    });
    
    console.log("✓ Default fee configuration created (2.00% percentage mode)");
  } catch (error) {
    console.error("Error seeding configuration:", error);
  }
  
  process.exit(0);
}

seedFeeConfiguration();
