import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

async function addIPColumns() {
  console.log('=== Adding IP Tracking Columns to loanApplications ===\n');
  console.log('Connecting to database...');
  
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // First, let's see what columns exist
    console.log('Checking existing columns...');
    const [allColumns] = await connection.execute(
      `SHOW COLUMNS FROM loanApplications`
    );
    
    console.log('\nExisting columns:');
    allColumns.forEach(col => console.log('  -', col.Field));
    
    // Check if IP columns already exist
    const hasIpAddress = allColumns.some(col => col.Field === 'ipAddress');
    
    if (hasIpAddress) {
      console.log('\n✅ IP columns already exist!');
      await connection.end();
      return;
    }

    console.log('\nAdding IP tracking columns...');

    // Add columns one by one to avoid AFTER reference issues
    await connection.execute(`
      ALTER TABLE loanApplications
      ADD COLUMN ipAddress VARCHAR(45),
      ADD COLUMN ipCountry VARCHAR(100),
      ADD COLUMN ipRegion VARCHAR(100),
      ADD COLUMN ipCity VARCHAR(100),
      ADD COLUMN ipTimezone VARCHAR(100)
    `);

    console.log('✅ Successfully added IP tracking columns!');
    console.log('\nColumns added:');
    console.log('  - ipAddress (VARCHAR 45)');
    console.log('  - ipCountry (VARCHAR 100)');
    console.log('  - ipRegion (VARCHAR 100)');
    console.log('  - ipCity (VARCHAR 100)');
    console.log('  - ipTimezone (VARCHAR 100)');

  } catch (error) {
    console.error('❌ Error adding columns:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addIPColumns()
  .then(() => {
    console.log('\n✅ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
