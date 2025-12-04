const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseId: { type: String, required: true, unique: true }, 
    name: { type: String, required: true, unique: true },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        index: true
    },
    is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
