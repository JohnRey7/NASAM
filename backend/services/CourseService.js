const Course = require('../models/Course');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');

class CourseService {
  /**
   * Create a new course
   * @param {Object} courseData - { courseId, name }
   * @returns {Object} Created course
   */
  static async createCourse(courseData) {
    try {
      const { courseId, name } = courseData;

      // Validate required fields
      if (!courseId || !name) {
        throw new Error('Course ID and name are required');
      }

      // Check if course already exists by courseId or name
      const existingCourse = await Course.findOne({
        $or: [
          { courseId },
          { name }
        ],
        is_deleted: false
      });

      if (existingCourse) {
        if (existingCourse.courseId === courseId) {
          throw new Error('Course with this ID already exists');
        }
        if (existingCourse.name === name) {
          throw new Error('Course with this name already exists');
        }
      }

      const course = new Course({
        courseId,
        name
      });

      await course.save();
      return course;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all courses with pagination (excludes soft deleted)
   * @param {Object} options - { page, limit, search }
   * @returns {Object} Paginated courses
   */
  static async getAllCourses(options = {}) {
    try {
      const { page = 1, limit = 25, search = '' } = options;

      // Build filter query - exclude soft deleted courses
      let filter = { is_deleted: false };

      // Search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { courseId: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const courses = await Course.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Course.countDocuments(filter);

      return {
        courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCourses: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all soft deleted courses with pagination
   * @param {Object} options - { page, limit }
   * @returns {Object} Paginated deleted courses
   */
  static async getDeletedCourses(options = {}) {
    try {
      const { page = 1, limit = 25 } = options;

      const filter = { is_deleted: true };
      const skip = (page - 1) * limit;

      const courses = await Course.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Course.countDocuments(filter);

      return {
        courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCourses: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get course by courseId
   * @param {String} courseId - The course ID
   * @returns {Object} Course
   */
  static async getCourseById(courseId) {
    try {
      const course = await Course.findOne({ courseId, is_deleted: false });

      if (!course) {
        throw new Error('Course not found');
      }

      return course;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get course by name
   * @param {String} name - The course name
   * @returns {Object} Course
   */
  static async getCourseByName(name) {
    try {
      const course = await Course.findOne({ name, is_deleted: false });

      if (!course) {
        throw new Error('Course not found');
      }

      return course;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update course by courseId
   * @param {String} courseId - The course ID
   * @param {Object} updateData - { courseId, name }
   * @returns {Object} Updated course
   */
  static async updateCourseByCourseId(courseId, updateData) {
    try {
      const course = await Course.findOne({ courseId, is_deleted: false });

      if (!course) {
        throw new Error('Course not found');
      }

      // Check for duplicates if updating courseId or name
      if (updateData.courseId && updateData.courseId !== courseId) {
        const existingCourse = await Course.findOne({
          courseId: updateData.courseId,
          _id: { $ne: course._id },
          is_deleted: false
        });
        if (existingCourse) {
          throw new Error('Course with this ID already exists');
        }
      }

      if (updateData.name && updateData.name !== course.name) {
        const existingCourse = await Course.findOne({
          name: updateData.name,
          _id: { $ne: course._id },
          is_deleted: false
        });
        if (existingCourse) {
          throw new Error('Course with this name already exists');
        }
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        course._id,
        {
          ...(updateData.courseId && { courseId: updateData.courseId }),
          ...(updateData.name && { name: updateData.name })
        },
        { new: true }
      );

      return updatedCourse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update course by name
   * @param {String} name - The course name
   * @param {Object} updateData - { courseId, name }
   * @returns {Object} Updated course
   */
  static async updateCourseByName(name, updateData) {
    try {
      const course = await Course.findOne({ name, is_deleted: false });

      if (!course) {
        throw new Error('Course not found');
      }

      // Check for duplicates if updating courseId or name
      if (updateData.courseId && updateData.courseId !== course.courseId) {
        const existingCourse = await Course.findOne({
          courseId: updateData.courseId,
          _id: { $ne: course._id },
          is_deleted: false
        });
        if (existingCourse) {
          throw new Error('Course with this ID already exists');
        }
      }

      if (updateData.name && updateData.name !== name) {
        const existingCourse = await Course.findOne({
          name: updateData.name,
          _id: { $ne: course._id },
          is_deleted: false
        });
        if (existingCourse) {
          throw new Error('Course with this name already exists');
        }
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        course._id,
        {
          ...(updateData.courseId && { courseId: updateData.courseId }),
          ...(updateData.name && { name: updateData.name })
        },
        { new: true }
      );

      return updatedCourse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete course by courseId
   * @param {String} courseId - The course ID
   * @returns {Object} Deleted course
   */
  static async softDeleteByCourseId(courseId) {
    try {
      const course = await Course.findOne({ courseId, is_deleted: false });

      if (!course) {
        throw new Error('Course not found');
      }

      const deletedCourse = await Course.findByIdAndUpdate(
        course._id,
        { is_deleted: true },
        { new: true }
      );

      return deletedCourse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete course by name
   * @param {String} name - The course name
   * @returns {Object} Deleted course
   */
  static async softDeleteByName(name) {
    try {
      const course = await Course.findOne({ name, is_deleted: false });

      if (!course) {
        throw new Error('Course not found');
      }

      const deletedCourse = await Course.findByIdAndUpdate(
        course._id,
        { is_deleted: true },
        { new: true }
      );

      return deletedCourse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Permanently delete course by courseId
   * @param {String} courseId - The course ID
   * @returns {Object} Result
   */
  static async permanentDeleteByCourseId(courseId) {
    try {
      const course = await Course.findOne({ courseId });

      if (!course) {
        throw new Error('Course not found');
      }

      await Course.findByIdAndDelete(course._id);

      return { message: 'Course permanently deleted' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Permanently delete course by name
   * @param {String} name - The course name
   * @returns {Object} Result
   */
  static async permanentDeleteByName(name) {
    try {
      const course = await Course.findOne({ name });

      if (!course) {
        throw new Error('Course not found');
      }

      await Course.findByIdAndDelete(course._id);

      return { message: 'Course permanently deleted' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restore soft deleted course by courseId
   * @param {String} courseId - The course ID
   * @returns {Object} Restored course
   */
  static async restoreByCourseId(courseId) {
    try {
      const course = await Course.findOne({ courseId, is_deleted: true });

      if (!course) {
        throw new Error('Deleted course not found');
      }

      const restoredCourse = await Course.findByIdAndUpdate(
        course._id,
        { is_deleted: false },
        { new: true }
      );

      return restoredCourse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restore soft deleted course by name
   * @param {String} name - The course name
   * @returns {Object} Restored course
   */
  static async restoreByName(name) {
    try {
      const course = await Course.findOne({ name, is_deleted: true });

      if (!course) {
        throw new Error('Deleted course not found');
      }

      const restoredCourse = await Course.findByIdAndUpdate(
        course._id,
        { is_deleted: false },
        { new: true }
      );

      return restoredCourse;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CourseService;
