const mongoose = require('mongoose');
const Role = require('../models/Role');
const Permission = require('../models/Permissions');
require('dotenv').config();

async function seedRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Initialize permissions first
    const permissions = [
      'administrator',
      'application.create',
      'application.readOwn',
      'application.read',
      'application.updateOwn',
      'application.update',
      'application.delete',
      'application.readAll',
      'document.set',
      'document.get',
      'document.delete'
    ];

    const permissionDocs = [];
    for (const perm of permissions) {
      const doc = await Permission.findOneAndUpdate(
        { name: perm },
        { name: perm },
        { upsert: true, new: true }
      );
      permissionDocs.push(doc);
    }
    console.log('Permissions initialized');

    // Delete existing roles
    await Role.deleteMany({});
    console.log('Cleared existing roles');

    // Create roles with appropriate permissions
    const roles = [
      {
        name: 'applicant',
        permissions: permissionDocs
          .filter(p => ['application.create', 'application.readOwn', 'application.updateOwn', 'document.set', 'document.get'].includes(p.name))
          .map(p => p._id)
      },
      {
        name: 'oas_staff',
        permissions: permissionDocs
          .filter(p => ['application.read', 'application.readAll', 'document.get', 'document.delete'].includes(p.name))
          .map(p => p._id)
      },
      {
        name: 'department_head',
        permissions: permissionDocs
          .filter(p => ['application.read', 'application.readAll', 'document.get'].includes(p.name))
          .map(p => p._id)
      }
    ];

    // Insert new roles
    const result = await Role.insertMany(roles);
    console.log(`Added ${result.length} roles to the database`);
    console.log('Roles:', result.map(r => ({ id: r._id, name: r.name })));

    console.log('Roles seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
}

seedRoles(); 