/**
 * Script to check existing departments and create default ones if needed
 * Run with: node scripts/check-and-create-departments.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Department = require('../models/Department');

// Default departments for CIT-U
const DEFAULT_DEPARTMENTS = [
  { departmentCode: 'CCS', name: 'College of Computer Studies' },
  { departmentCode: 'CEA', name: 'College of Engineering and Architecture' },
  { departmentCode: 'CAS', name: 'College of Arts and Sciences' },
  { departmentCode: 'CBA', name: 'College of Business Administration' },
  { departmentCode: 'CHTM', name: 'College of Hospitality and Tourism Management' },
  { departmentCode: 'CNAHS', name: 'College of Nursing and Allied Health Sciences' },
  { departmentCode: 'CED', name: 'College of Education' },
  { departmentCode: 'CCJE', name: 'College of Criminal Justice Education' }
];

async function checkAndCreateDepartments() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nasm_database';
    console.log('🔌 Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check existing departments
    const existingDepts = await Department.find({ is_deleted: false });
    console.log('📋 Existing Departments:');
    
    if (existingDepts.length === 0) {
      console.log('   ⚠️  No departments found!\n');
    } else {
      existingDepts.forEach(dept => {
        console.log(`   ✓ ${dept.departmentCode} - ${dept.name}`);
      });
      console.log('');
    }

    // Create missing departments
    console.log('🔍 Checking for missing departments...\n');
    let createdCount = 0;

    for (const deptData of DEFAULT_DEPARTMENTS) {
      const exists = await Department.findOne({ 
        departmentCode: deptData.departmentCode,
        is_deleted: false 
      });

      if (!exists) {
        console.log(`   ➕ Creating: ${deptData.departmentCode} - ${deptData.name}`);
        const newDept = new Department(deptData);
        await newDept.save();
        createdCount++;
      } else {
        console.log(`   ✓ Already exists: ${deptData.departmentCode} - ${deptData.name}`);
      }
    }

    console.log('');
    if (createdCount > 0) {
      console.log(`✅ Created ${createdCount} new department(s)`);
    } else {
      console.log('✅ All default departments already exist');
    }

    // Show final list
    const finalDepts = await Department.find({ is_deleted: false }).sort({ departmentCode: 1 });
    console.log('\n📋 Final Department List:');
    finalDepts.forEach(dept => {
      console.log(`   ${dept.departmentCode} - ${dept.name}`);
    });

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAndCreateDepartments();
