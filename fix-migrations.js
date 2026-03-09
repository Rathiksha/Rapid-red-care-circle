/**
 * Fix Migration State
 * Mark the initial schema as migrated since tables already exist
 */

const db = require('./src/models');

async function fixMigrations() {
  try {
    console.log('🔧 Fixing migration state...\n');
    
    // Check if initial migration is already recorded
    const [existing] = await db.sequelize.query(
      "SELECT name FROM SequelizeMeta WHERE name = '20260212000001-create-initial-schema.js';"
    );
    
    if (existing.length > 0) {
      console.log('✅ Initial migration already recorded');
    } else {
      // Mark initial migration as complete since tables exist
      await db.sequelize.query(
        "INSERT INTO SequelizeMeta (name) VALUES ('20260212000001-create-initial-schema.js');"
      );
      console.log('✅ Marked initial schema migration as complete');
    }
    
    console.log('\n📋 Current migration status:');
    const [migrations] = await db.sequelize.query(
      "SELECT name FROM SequelizeMeta ORDER BY name;"
    );
    migrations.forEach(m => console.log(`  ✅ ${m.name}`));
    
    console.log('\n✅ Migration state fixed!');
    console.log('\nNow run: npm run migrate');
    console.log('This will apply the pending migrations:');
    console.log('  - 20260303000001-add-address-to-users.js');
    console.log('  - 20260303000002-add-willingness-fields-to-donors.js');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixMigrations();
