require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

// Sample courses matching the frontend
const COURSES = [
  { courseId: "bsit", name: "BS Information Technology" },
  { courseId: "bscs", name: "BS Computer Science" },
  { courseId: "bsce", name: "BS Civil Engineering" },
  { courseId: "bsee", name: "BS Electrical Engineering" },
  { courseId: "bsme", name: "BS Mechanical Engineering" },
  { courseId: "bsarch", name: "BS Architecture" },
  { courseId: "bsacct", name: "BS Accountancy" },
  { courseId: "bsba", name: "BS Business Administration" },
  { courseId: "bstm", name: "BS Tourism Management" },
  { courseId: "bshm", name: "BS Hospitality Management" },
];

async function seedCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Delete existing courses
    await Course.deleteMany({});
    console.log('Cleared existing courses');

    // Insert new courses
    const result = await Course.insertMany(COURSES);
    console.log(`Added ${result.length} courses to the database`);

    console.log('Courses seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding courses:', error);
    process.exit(1);
  }
}

seedCourses(); 