/**
 * Seed Hospital Data
 * Populate database with sample hospitals for testing
 */

const db = require('./src/models');

const sampleHospitals = [
  {
    hospital_name: 'Apollo Hospital Chennai',
    address: '21, Greams Lane, Off Greams Road, Chennai, Tamil Nadu 600006',
    location: 'POINT(80.2501 13.0569)',
    contact_number: '+91-44-28296000',
    emergency_contact: '+91-44-28296001',
    service_rating: 4.7,
    is_active: true,
    operating_hours: {
      emergency: '24/7',
      bloodBank: 'Mon-Sun: 8:00 AM - 8:00 PM'
    },
    blood_availability: {
      'A+': { units: 15, updated_at: new Date().toISOString() },
      'A-': { units: 3, updated_at: new Date().toISOString() },
      'B+': { units: 12, updated_at: new Date().toISOString() },
      'B-': { units: 2, updated_at: new Date().toISOString() },
      'AB+': { units: 5, updated_at: new Date().toISOString() },
      'AB-': { units: 1, updated_at: new Date().toISOString() },
      'O+': { units: 22, updated_at: new Date().toISOString() },
      'O-': { units: 7, updated_at: new Date().toISOString() }
    }
  },
  {
    hospital_name: 'Fortis Malar Hospital',
    address: 'No. 52, 1st Main Road, Gandhi Nagar, Adyar, Chennai, Tamil Nadu 600020',
    location: 'POINT(80.2574 13.0067)',
    contact_number: '+91-44-42892222',
    emergency_contact: '+91-44-42892223',
    service_rating: 4.5,
    is_active: true,
    operating_hours: {
      emergency: '24/7',
      bloodBank: 'Mon-Sun: 7:00 AM - 9:00 PM'
    },
    blood_availability: {
      'A+': { units: 10, updated_at: new Date().toISOString() },
      'A-': { units: 2, updated_at: new Date().toISOString() },
      'B+': { units: 8, updated_at: new Date().toISOString() },
      'B-': { units: 0, updated_at: new Date().toISOString() },
      'AB+': { units: 4, updated_at: new Date().toISOString() },
      'AB-': { units: 0, updated_at: new Date().toISOString() },
      'O+': { units: 18, updated_at: new Date().toISOString() },
      'O-': { units: 5, updated_at: new Date().toISOString() }
    }
  },
  {
    hospital_name: 'MIOT International Hospital',
    address: '4/112, Mount Poonamallee Road, Manapakkam, Chennai, Tamil Nadu 600089',
    location: 'POINT(80.1629 13.0199)',
    contact_number: '+91-44-42002000',
    emergency_contact: '+91-44-42002001',
    service_rating: 4.6,
    is_active: true,
    operating_hours: {
      emergency: '24/7',
      bloodBank: 'Mon-Sun: 8:00 AM - 8:00 PM'
    },
    blood_availability: {
      'A+': { units: 20, updated_at: new Date().toISOString() },
      'A-': { units: 4, updated_at: new Date().toISOString() },
      'B+': { units: 15, updated_at: new Date().toISOString() },
      'B-': { units: 3, updated_at: new Date().toISOString() },
      'AB+': { units: 6, updated_at: new Date().toISOString() },
      'AB-': { units: 2, updated_at: new Date().toISOString() },
      'O+': { units: 25, updated_at: new Date().toISOString() },
      'O-': { units: 8, updated_at: new Date().toISOString() }
    }
  },
  {
    hospital_name: 'Kauvery Hospital Chennai',
    address: '81, TTK Road, Alwarpet, Chennai, Tamil Nadu 600018',
    location: 'POINT(80.2503 13.0338)',
    contact_number: '+91-44-40004000',
    emergency_contact: '+91-44-40004001',
    service_rating: 4.4,
    is_active: true,
    operating_hours: {
      emergency: '24/7',
      bloodBank: 'Mon-Sun: 8:00 AM - 7:00 PM'
    },
    blood_availability: {
      'A+': { units: 8, updated_at: new Date().toISOString() },
      'A-': { units: 1, updated_at: new Date().toISOString() },
      'B+': { units: 6, updated_at: new Date().toISOString() },
      'B-': { units: 1, updated_at: new Date().toISOString() },
      'AB+': { units: 3, updated_at: new Date().toISOString() },
      'AB-': { units: 0, updated_at: new Date().toISOString() },
      'O+': { units: 12, updated_at: new Date().toISOString() },
      'O-': { units: 4, updated_at: new Date().toISOString() }
    }
  },
  {
    hospital_name: 'Gleneagles Global Health City',
    address: '439, Cheran Nagar, Perumbakkam, Chennai, Tamil Nadu 600100',
    location: 'POINT(80.2275 12.9010)',
    contact_number: '+91-44-44777000',
    emergency_contact: '+91-44-44777001',
    service_rating: 4.8,
    is_active: true,
    operating_hours: {
      emergency: '24/7',
      bloodBank: 'Mon-Sun: 24/7'
    },
    blood_availability: {
      'A+': { units: 18, updated_at: new Date().toISOString() },
      'A-': { units: 5, updated_at: new Date().toISOString() },
      'B+': { units: 14, updated_at: new Date().toISOString() },
      'B-': { units: 4, updated_at: new Date().toISOString() },
      'AB+': { units: 7, updated_at: new Date().toISOString() },
      'AB-': { units: 3, updated_at: new Date().toISOString() },
      'O+': { units: 28, updated_at: new Date().toISOString() },
      'O-': { units: 10, updated_at: new Date().toISOString() }
    }
  }
];

async function seedHospitals() {
  try {
    console.log('🏥 Starting hospital data seeding...\n');
    
    // Check if hospitals already exist
    const existingCount = await db.HospitalBloodBank.count();
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing hospitals`);
      console.log('Do you want to:');
      console.log('  1. Skip seeding (keep existing data)');
      console.log('  2. Add new hospitals (keep existing + add new)');
      console.log('  3. Replace all (delete existing + add new)');
      console.log('\nDefaulting to option 2 (add new hospitals)\n');
    }
    
    let created = 0;
    let skipped = 0;
    
    for (const hospitalData of sampleHospitals) {
      // Check if hospital already exists
      const existing = await db.HospitalBloodBank.findOne({
        where: { hospital_name: hospitalData.hospital_name }
      });
      
      if (existing) {
        console.log(`⏭️  Skipping ${hospitalData.hospital_name} (already exists)`);
        skipped++;
        continue;
      }
      
      const hospital = await db.HospitalBloodBank.create(hospitalData);
      console.log(`✅ Created: ${hospital.hospital_name}`);
      console.log(`   📍 Location: ${hospitalData.address}`);
      console.log(`   ⭐ Rating: ${hospital.service_rating}/5`);
      console.log(`   🩸 Blood types available: ${Object.keys(hospitalData.blood_availability).length}`);
      console.log('');
      created++;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Hospital seeding completed!');
    console.log(`   Created: ${created} hospitals`);
    console.log(`   Skipped: ${skipped} hospitals`);
    console.log(`   Total in database: ${await db.HospitalBloodBank.count()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Show sample query
    console.log('🧪 Test the API with:');
    console.log('   GET http://localhost:3000/api/hospitals/nearby?latitude=13.0827&longitude=80.2707&radius=20');
    console.log('   GET http://localhost:3000/api/hospitals/search?latitude=13.0827&longitude=80.2707&bloodGroup=O+');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding hospitals:', error);
    process.exit(1);
  }
}

// Run seeding
seedHospitals();
