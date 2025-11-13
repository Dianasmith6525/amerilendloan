import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool(process.env.DATABASE_URL);

async function checkTable() {
  const [rows] = await pool.query('DESCRIBE systemSettings');
  console.log(JSON.stringify(rows, null, 2));
  await pool.end();
}

checkTable();
