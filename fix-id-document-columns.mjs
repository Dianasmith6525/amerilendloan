import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Parse the DATABASE_URL connection string
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not set in .env file');
  process.exit(1);
}

// Parse connection URL: mysql://user:password@host:port/database
const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+?)(\?|$)/);
if (!urlMatch) {
  console.error('❌ Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  port: parseInt(port),
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function fixIdDocumentColumns() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Starting ID document column migration...\n');

    // Fix idFrontUrl column
    console.log('📝 Altering idFrontUrl column to MEDIUMTEXT...');
    await connection.query(
      'ALTER TABLE `loanApplications` MODIFY COLUMN `idFrontUrl` MEDIUMTEXT'
    );
    console.log('✅ idFrontUrl column fixed\n');

    // Fix idBackUrl column
    console.log('📝 Altering idBackUrl column to MEDIUMTEXT...');
    await connection.query(
      'ALTER TABLE `loanApplications` MODIFY COLUMN `idBackUrl` MEDIUMTEXT'
    );
    console.log('✅ idBackUrl column fixed\n');

    // Fix selfieUrl column (also called selfieFrontUrl in some places)
    console.log('📝 Altering selfieUrl column to MEDIUMTEXT...');
    await connection.query(
      'ALTER TABLE `loanApplications` MODIFY COLUMN `selfieUrl` MEDIUMTEXT'
    );
    console.log('✅ selfieUrl column fixed\n');

    // Verify the changes
    console.log('🔍 Verifying column types...\n');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'loanApplications' 
      AND COLUMN_NAME IN ('idFrontUrl', 'idBackUrl', 'selfieUrl')
    `);

    console.log('Column verification results:');
    columns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (max length: ${col.CHARACTER_MAXIMUM_LENGTH || 'unlimited'})`);
    });

    console.log('\n✨ Migration completed successfully!');
    console.log('   - idFrontUrl: Can now store up to 16MB base64 data');
    console.log('   - idBackUrl: Can now store up to 16MB base64 data');
    console.log('   - selfieUrl: Can now store up to 16MB base64 data\n');
  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('   Column does not exist yet - it may have a different name');
    }
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

fixIdDocumentColumns().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
