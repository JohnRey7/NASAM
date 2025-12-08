require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

// Sample courses matching the frontend
const COURSES = [
  { courseId: "bsit", name: "Bachelor of Science in Information Technology" },
  { courseId: "bscs", name: "Bachelor of Science in Computer Science" },
  { courseId: "bsarch", name: "Bachelor of Science in Architecture" },
  { courseId: "bsn", name: "Bachelor of Science in Nursing" },
  { courseId: "bsma", name: "Bachelor of Science in Multimedia Arts" },
  { courseId: "bsce", name: "Bachelor of Science in Civil Engineering" },
  { courseId: "bsee", name: "Bachelor of Science in Electrical Engineering" },
  { courseId: "bsme", name: "Bachelor of Science in Mechanical Engineering" },
  { courseId: "bsacct", name: "Bachelor of Science in Accountancy" },
  { courseId: "bsba", name: "Bachelor of Science in Business Administration" },
  { courseId: "bstm", name: "Bachelor of Science in Tourism Management" },
  { courseId: "bshm", name: "Bachelor of Science in Hospitality Management" },
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