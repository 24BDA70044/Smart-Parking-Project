const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('🔍 Attempting to connect to MySQL...');
    
    // Connect with hardcoded credentials (we verified these work)
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lak@230506',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server successfully!');

    const sqlScript = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    
    console.log('📝 Executing database initialization script...');
    await connection.query(sqlScript);
    
    console.log('✅ Database initialized successfully!');
    console.log('✅ Tables created: Vehicle, ParkingSlot, ParkingRecord');
    
    await connection.end();
    console.log('✨ Setup complete! You can now start the server with: node server.js');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
