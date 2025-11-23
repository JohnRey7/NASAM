/**
 * Script to create the department_head role in MongoDB
 * Run this script if you're getting "Department head role not found" error
 * 
 * Usage:
 * node backend/scripts/create-department-head-role.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  permissions: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Role = mongoose.model('Role', roleSchema, 'role');

async function createDepartmentHeadRole() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nasm_database';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    // Check if role already exists
    const existingRole = await Role.findOne({ name: 'department_head' });
    
    if (existingRole) {
      console.log('\n✓ Department Head role already exists:');
      console.log(JSON.stringify(existingRole, null, 2));
      console.log('\nNo action needed.');
    } else {
      // Create the role
      console.log('\nCreating department_head role...');
      
      const newRole = await Role.create({
        name: 'department_head',
        description: 'Department Head role with permissions to manage department applicants and conduct interviews',
        permissions: [
          'application.readAll',      // View all applications in their department
          'application.update',       // Update application status
          'interview.create',         // Schedule interviews
          'interview.update',         // Reschedule/update interviews
          'interview.read',           // View interview details
          'evaluation.create',        // Create evaluations
          'evaluation.read',          // View evaluations
          'evaluation.update',        // Update evaluations
          'notification.create',      // Send notifications to applicants
          'document.read',            // View applicant documents
          'personality_test.read'     // View personality test results
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('\n✓ Department Head role created successfully:');
      console.log(JSON.stringify(newRole, null, 2));
    }

    // List all roles for verification
    console.log('\n--- All Roles in Database ---');
    const allRoles = await Role.find({});
    allRoles.forEach(role => {
      console.log(`- ${role.name} (${role.permissions?.length || 0} permissions)`);
    });

    console.log('\n✓ Script completed successfully');
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
createDepartmentHeadRole();
