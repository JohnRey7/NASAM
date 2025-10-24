const mongoose = require('mongoose');
const Department = require('../models/Department');
require('dotenv').config();

const departments = [
  { departmentCode: 'LSAC', name: 'Liberal Arts and Communication' },
  { departmentCode: 'IT', name: 'Information Technology' },
  { departmentCode: 'ENGINEERING', name: 'Engineering' },
  { departmentCode: 'BUSINESS', name: 'Business Administration' },
  { departmentCode: 'EDUCATION', name: 'Education' },
  { departmentCode: 'NURSING', name: 'Nursing' },
  { departmentCode: 'ARCHITECTURE', name: 'Architecture' },
  { departmentCode: 'ACCOUNTANCY', name: 'Accountancy' }
];

async function seedDepartments() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nasam');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n📋 Seeding departments...\n');
    
    let created = 0;
    let skipped = 0;
    
    for (const dept of departments) {
      const existing = await Department.findOne({ 
        departmentCode: dept.departmentCode,
        is_deleted: false 
      });
      
      if (!existing) {
        await Department.create(dept);
        console.log(`✅ Created department: ${dept.departmentCode} - ${dept.name}`);
        created++;
      } else {
        console.log(`⏭️  Department already exists: ${dept.departmentCode} - ${dept.name}`);
        skipped++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📦 Total: ${departments.length}`);
    console.log('\n✅ Department seeding complete!');
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding departments:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedDepartments();
