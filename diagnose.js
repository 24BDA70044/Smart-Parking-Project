const mysql = require('mysql2/promise');

async function testConnection(password) {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password,
      multipleStatements: true
    });
    console.log(`✅ SUCCESS with password: "${password}"`);
    await connection.end();
    return true;
  } catch (error) {
    console.log(`❌ FAILED with password: "${password}" - ${error.message}`);
    return false;
  }
}

async function diagnose() {
  console.log('Testing MySQL connections...\n');
  
  // Test with various common passwords
  const passwords = ['', 'root', 'password', '123456', 'admin', 'Lak@230506'];
  
  for (const pwd of passwords) {
    await testConnection(pwd);
  }
}

diagnose();
