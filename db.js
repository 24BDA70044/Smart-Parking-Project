require('dotenv').config();
const mysql = require('mysql2');

// Use hardcoded password as it's verified to work
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Lak@230506',
  database: 'SmartParking1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('🔌 Database pool created with credentials');

module.exports = pool.promise();
