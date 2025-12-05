const mongoose = require('mongoose');
const Role = require('../models/Role');
const Permission = require('../models/Permissions');
require('dotenv').config();

async function seedRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Comprehensive permissions list based on backend endpoints
    const permissions = [
      'administrator',
      // User management
      'user.create',
      'user.read',
      'user.update',
      'user.delete',
      // Role management
      'role.create',
      'role.read',
      'role.read.id',
      'role.update',
      'role.delete',
      // Application Form
      'applicationForm.create',
      'applicationForm.readOwn',
      'applicationForm.read',
      'applicationForm.updateOwn',
      'applicationForm.update',
      'applicationForm.delete',
      'applicationForm.status.set',
      'applicationForm.approvals.set',
      'application.export',
      'application.export.csv',
      'application.readAll',
      // Application History
      'applicationHistory.readOwn',
      'applicationHistory.read',
      // Documents
      'document.create',
      'document.set',
      'document.get',
      'document.read',
      'document.update',
      'document.delete',
      'document.upload.endTermGrade',
      // Personality Test
      'personality_test.create',
      'personality_test.answer',
      'personality_test.stop',
      'personality_test.readOwn',
      'personality_test.readAll',
      'personality_test.read',
      'personality_test.update',
      'personality_test.delete',
      'personality_test.template.create',
      'personality_test.template.read',
      'personality_test.template.update',
      'personality_test.template.delete',
      // Interview
      'interview.create',
      'interview.readAll',
      'interview.read',
      'interview.readOwn',
      'interview.update',
      'interview.updateOwn',
      'interview.delete',
      'interview.deleteOwn',
      // Evaluation
      'evaluation.create',
      'evaluation.read',
      'evaluation.read.all',
      'evaluation.update',
      'evaluation.delete',
      'evaluation.update_timekeeping',
      'evaluation.read_timekeeping',
      'evaluation.manage',
      // Department
      'department.create',
      'department.read',
      'department.update',
      'department.delete',
      // Course
      'course.create',
      'course.read',
      'course.read.deleted',
      'course.update',
      'course.delete.soft',
      'course.delete.hard',
      // Activity
      'activity.readAll',
      // Audit
      'audit.read',
      'audit.manage'
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

    // Delete existing roles for fresh seed
    await Role.deleteMany({ name: { $in: ['applicant', 'oas_staff', 'department_head'] } });
    console.log('Cleared existing applicant, oas_staff, and department_head roles');

    // Define role permissions based on system requirements
    
    // APPLICANT PERMISSIONS
    // - Can create, read, and update their own application
    // - Can upload and view their own documents
    // - Can take personality test (start, answer, stop, view own results)
    // - Can view their own interview details
    // - Can view their own application/activity history
    // - Can upload end-term semester grades (for scholars)
    // - Can view their own evaluation status (for scholars)
    // - Can read departments/courses for form dropdowns
    const applicantPermissions = [
      // Application
      'applicationForm.create',
      'applicationForm.readOwn',
      'applicationForm.updateOwn',
      'applicationHistory.readOwn',
      'application.export',  // Export own application PDF
      // Documents
      'document.set',
      'document.get',
      'document.upload.endTermGrade',
      // Personality Test
      'personality_test.create',
      'personality_test.answer',
      'personality_test.stop',
      'personality_test.readOwn',
      // Interview
      'interview.readOwn',
      'interview.updateOwn',  // For updating availability
      // Evaluation (for scholars)
      'evaluation.read_timekeeping',  // View own timekeeping
      // Reference data
      'department.read',
      'course.read'
    ];

    // OAS STAFF PERMISSIONS
    // OAS Staff gets 'administrator' permission which grants full access to all endpoints
    const oasStaffPermissions = [
      'administrator'
    ];

    // DEPARTMENT HEAD PERMISSIONS
    // - Can read applications assigned to their department
    // - Can read documents of scholars in their department
    // - Can schedule/reschedule interviews for department scholars
    // - Can create and manage evaluations for scholars
    // - Can read department and course info
    // - Can view personality test results for review
    // - Can export application PDFs
    const departmentHeadPermissions = [
      // Application access
      'application.readAll',         // View assigned applicants list
      'applicationForm.read',        // Read application details
      'applicationHistory.read',     // View application history
      'application.export',          // Export application PDF
      // Documents
      'document.get',                // Download/view documents
      'document.read',               // Read document records
      // Personality Test
      'personality_test.read',       // View applicant's test results
      // Interview
      'interview.read',              // View interview details
      'interview.update',            // Update/reschedule interviews
      'interview.readOwn',           // View own review list
      // Evaluation
      'evaluation.create',           // Create scholar evaluations
      'evaluation.read',             // Read evaluations (read-only after submission)
      'evaluation.read_timekeeping', // View timekeeping records
      // Reference data
      'department.read',             // View departments
      'course.read'                  // View courses
    ];

    // Create roles with appropriate permissions
    const roles = [
      {
        name: 'applicant',
        permissions: permissionDocs
          .filter(p => applicantPermissions.includes(p.name))
          .map(p => p._id)
      },
      {
        name: 'oas_staff',
        permissions: permissionDocs
          .filter(p => oasStaffPermissions.includes(p.name))
          .map(p => p._id)
      },
      {
        name: 'department_head',
        permissions: permissionDocs
          .filter(p => departmentHeadPermissions.includes(p.name))
          .map(p => p._id)
      }
    ];

    // Insert new roles
    const result = await Role.insertMany(roles);
    console.log(`Added ${result.length} roles to the database`);
    
    // Log each role with its permissions
    for (const role of result) {
      const populatedRole = await Role.findById(role._id).populate('permissions', 'name');
      console.log(`\n${role.name.toUpperCase()} (${populatedRole.permissions.length} permissions):`);
      console.log(populatedRole.permissions.map(p => `  - ${p.name}`).join('\n'));
    }

    console.log('\n✅ Roles seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
}

seedRoles(); 