import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

// Expected columns from schema.ts
const expectedColumns = {
  'id': 'INT',
  'userId': 'INT',
  'referenceNumber': 'VARCHAR(20)',
  'fullName': 'VARCHAR(255)',
  'email': 'VARCHAR(320)',
  'phone': 'VARCHAR(20)',
  'dateOfBirth': 'VARCHAR(10)',
  'ssn': 'VARCHAR(11)',
  'street': 'VARCHAR(255)',
  'city': 'VARCHAR(100)',
  'state': 'VARCHAR(2)',
  'zipCode': 'VARCHAR(10)',
  'employmentStatus': 'ENUM',
  'employer': 'VARCHAR(255)',
  'monthlyIncome': 'INT',
  'loanType': 'ENUM',
  'requestedAmount': 'INT',
  'loanPurpose': 'TEXT',
  'approvedAmount': 'INT',
  'processingFeeAmount': 'INT',
  'processingFeePaid': 'INT',
  'processingFeePaymentId': 'INT',
  'idFrontUrl': 'MEDIUMTEXT',
  'idBackUrl': 'MEDIUMTEXT',
  'selfieUrl': 'MEDIUMTEXT',
  'idVerificationStatus': 'ENUM',
  'idVerificationNotes': 'TEXT',
  'ipAddress': 'VARCHAR(45)',
  'ipCountry': 'VARCHAR(100)',
  'ipRegion': 'VARCHAR(100)',
  'ipCity': 'VARCHAR(100)',
  'ipTimezone': 'VARCHAR(100)',
  'status': 'ENUM',
  'rejectionReason': 'TEXT',
  'adminNotes': 'TEXT',
  'createdAt': 'TIMESTAMP',
  'updatedAt': 'TIMESTAMP',
  'approvedAt': 'TIMESTAMP',
  'disbursedAt': 'TIMESTAMP'
};

async function checkColumns() {
  console.log('=== Checking loanApplications Table Columns ===\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM loanApplications`
    );

    const existingColumns = new Set();
    console.log('📋 Existing columns in database:');
    columns.forEach(col => {
      existingColumns.add(col.Field);
      console.log(`  ✓ ${col.Field} (${col.Type})`);
    });

    console.log('\n🔍 Checking for missing columns...\n');
    
    const missingColumns = [];
    const extraColumns = [];

    // Check for missing columns
    for (const [columnName, columnType] of Object.entries(expectedColumns)) {
      if (!existingColumns.has(columnName)) {
        missingColumns.push({ name: columnName, type: columnType });
        console.log(`  ❌ MISSING: ${columnName} (${columnType})`);
      }
    }

    // Check for extra columns (in DB but not in schema)
    columns.forEach(col => {
      if (!expectedColumns.hasOwnProperty(col.Field)) {
        extraColumns.push(col.Field);
        console.log(`  ⚠️  EXTRA: ${col.Field} (not in schema.ts)`);
      }
    });

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log('='.repeat(50));
    console.log(`Total expected columns: ${Object.keys(expectedColumns).length}`);
    console.log(`Total existing columns: ${columns.length}`);
    console.log(`Missing columns: ${missingColumns.length}`);
    console.log(`Extra columns: ${extraColumns.length}`);
    
    if (missingColumns.length === 0 && extraColumns.length === 0) {
      console.log('\n✅ Database schema matches perfectly!');
    } else {
      console.log('\n⚠️  Schema mismatch detected!');
      
      if (missingColumns.length > 0) {
        console.log('\n📝 Columns to ADD:');
        missingColumns.forEach(col => {
          console.log(`  - ${col.name} (${col.type})`);
        });
      }
      
      if (extraColumns.length > 0) {
        console.log('\n📝 Extra columns (not in schema.ts):');
        extraColumns.forEach(col => {
          console.log(`  - ${col}`);
        });
        console.log('\n💡 These might be legacy columns that can be removed or should be added to schema.ts');
      }
    }

    return { missingColumns, extraColumns };

  } finally {
    await connection.end();
  }
}

checkColumns()
  .then(({ missingColumns, extraColumns }) => {
    if (missingColumns.length === 0) {
      console.log('\n✅ All required columns are present!');
      process.exit(0);
    } else {
      console.log(`\n❌ Found ${missingColumns.length} missing column(s)`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
