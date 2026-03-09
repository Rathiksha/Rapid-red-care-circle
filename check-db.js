const db = require('./src/models');

async function checkDatabase() {
  try {
    const [tables] = await db.sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    );
    
    console.log('\n📊 Existing Tables:');
    tables.forEach(t => console.log(`  - ${t.name}`));
    
    if (tables.some(t => t.name === 'users')) {
      const [columns] = await db.sequelize.query("PRAGMA table_info(users);");
      console.log('\n📋 Users table columns:');
      columns.forEach(c => console.log(`  - ${c.name} (${c.type})`));
    }
    
    if (tables.some(t => t.name === 'donors')) {
      const [columns] = await db.sequelize.query("PRAGMA table_info(donors);");
      console.log('\n📋 Donors table columns:');
      columns.forEach(c => console.log(`  - ${c.name} (${c.type})`));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
