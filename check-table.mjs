import mysql from 'mysql2/promise';

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'amerilend_db'
    });
    
    const [rows] = await conn.query('DESCRIBE notifications');
    console.log('Notifications table structure:');
    console.table(rows);
    
    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
