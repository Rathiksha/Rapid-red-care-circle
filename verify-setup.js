/**
 * Verification Script - Check Database Schema After Migrations
 * Run this after: npx sequelize-cli db:migrate
 */

const db = require('./src/models');

async function verifySetup() {
  console.log('🔍 Verifying Database Setup...\n');
  
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Check Users table for address column
    console.log('📋 Checking Users table...');
    const [usersColumns] = await db.sequelize.query(
      "PRAGMA table_info(users);"
    );
    const hasAddress = usersColumns.some(col => col.name === 'address');
    console.log(hasAddress ? '✅ address column exists' : '❌ address column MISSING');
    
    // Check Donors table for willingness columns
    console.log('\n📋 Checking Donors table...');
    const [donorsColumns] = await db.sequelize.query(
      "PRAGMA table_info(donors);"
    );
    
    const requiredColumns = [
      'is_willing',
      'passed_eligibility', 
      'eligibility_passed_at',
      'willingness_confirmed_at'
    ];
    
    requiredColumns.forEach(colName => {
      const exists = donorsColumns.some(col => col.name === colName);
      console.log(exists ? `✅ ${colName} column exists` : `❌ ${colName} column MISSING`);
    });
    
    // Check migration status
    console.log('\n📋 Checking Migration Status...');
    const [migrations] = await db.sequelize.query(
      "SELECT name FROM SequelizeMeta ORDER BY name;"
    );
    
    console.log('\nMigrations applied:');
    migrations.forEach(m => {
      console.log(`  ✅ ${m.name}`);
    });
    
    const requiredMigrations = [
      '20260303000001-add-address-to-users.js',
      '20260303000002-add-willingness-fields-to-donors.js'
    ];
    
    console.log('\nRequired migrations check:');
    requiredMigrations.forEach(migName => {
      const applied = migrations.some(m => m.name === migName);
      console.log(applied ? `✅ ${migName}` : `❌ ${migName} NOT APPLIED`);
    });
    
    // Count records
    console.log('\n📊 Database Statistics:');
    const userCount = await db.User.count();
    const donorCount = await db.Donor.count();
    console.log(`  Users: ${userCount}`);
    console.log(`  Donors: ${donorCount}`);
    
    // Check for users with address
    const usersWithAddress = await db.User.count({
      where: {
        address: {
          [db.Sequelize.Op.ne]: null
        }
      }
    });
    console.log(`  Users with address: ${usersWithAddress}`);
    
    // Check for willing donors
    const willingDonors = await db.Donor.count({
      where: {
        is_willing: true
      }
    });
    console.log(`  Willing donors: ${willingDonors}`);
    
    console.log('\n✅ Verification Complete!\n');
    
    if (hasAddress && requiredColumns.every(col => donorsColumns.some(c => c.name === col))) {
      console.log('🎉 All required columns exist. Database is ready!');
      console.log('\nYou can now:');
      console.log('  1. Start the server: npm start');
      console.log('  2. Test the willingness flow at http://localhost:3000');
      console.log('  3. Complete eligibility questionnaire');
      console.log('  4. Confirm willingness to donate');
    } else {
      console.log('⚠️  Some columns are missing. Please run migrations:');
      console.log('  npx sequelize-cli db:migrate');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure database.sqlite exists');
    console.error('  2. Run migrations: npx sequelize-cli db:migrate');
    console.error('  3. Check .env file for correct database path');
  } finally {
    await db.sequelize.close();
  }
}

// Run verification
verifySetup();
