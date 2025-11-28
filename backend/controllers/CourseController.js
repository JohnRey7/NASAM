const CourseService = require('../services/CourseService');

const CourseController = {
  /**
   * Create a new course
   * POST /api/course
   */
  async createCourse(req, res) {
    try {
      const { courseId, name } = req.body;

      if (!courseId || !name) {
        return res.status(400).json({
          message: 'Course ID and name are required'
        });
      }

      const course = await CourseService.createCourse({ courseId, name });

      return res.status(201).json({
        message: 'Course created successfully',
        course
      });
    } catch (error) {
      console.error('Create course error:', error);
      if (error.message.includes('already exists') || error.message.includes('required')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to create course' });
    }
  },

  /**
   * Get all courses with pagination (excludes soft deleted)
   * GET /api/course/all
   */
  async getAllCourses(req, res) {
    try {
      const { page = 1, limit = 25, search = '' } = req.query;

      const result = await CourseService.getAllCourses({
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      return res.json({
        message: 'Courses retrieved successfully',
        ...result
      });
    } catch (error) {
      console.error('Get all courses error:', error);
      return res.status(500).json({ message: 'Failed to retrieve courses' });
    }
  },

  /**
   * Get all soft deleted courses
   * GET /api/course/all/deleted
   */
  async getDeletedCourses(req, res) {
    try {
      const { page = 1, limit = 25 } = req.query;

      const result = await CourseService.getDeletedCourses({
        page: parseInt(page),
        limit: parseInt(limit)
      });

      return res.json({
        message: 'Deleted courses retrieved successfully',
        ...result
      });
    } catch (error) {
      console.error('Get deleted courses error:', error);
      return res.status(500).json({ message: 'Failed to retrieve deleted courses' });
    }
  },

  /**
   * Update course by courseId
   * PUT /api/course/:courseId
   */
  async updateCourseByCourseId(req, res) {
    try {
      const { courseId } = req.params;
      const updateData = req.body;

      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }

      const course = await CourseService.updateCourseByCourseId(courseId, updateData);

      return res.json({
        message: 'Course updated successfully',
        course
      });
    } catch (error) {
      console.error('Update course by courseId error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('already exists')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to update course' });
    }
  },

  /**
   * Update course by name
   * PUT /api/course/name/:name
   */
  async updateCourseByName(req, res) {
    try {
      const { name } = req.params;
      const updateData = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Course name is required' });
      }

      const course = await CourseService.updateCourseByName(decodeURIComponent(name), updateData);

      return res.json({
        message: 'Course updated successfully',
        course
      });
    } catch (error) {
      console.error('Update course by name error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('already exists')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to update course' });
    }
  },

  /**
   * Soft delete course by courseId
   * DELETE /api/course/:courseId/soft
   */
  async softDeleteByCourseId(req, res) {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }

      const course = await CourseService.softDeleteByCourseId(courseId);

      return res.json({
        message: 'Course soft deleted successfully',
        course
      });
    } catch (error) {
      console.error('Soft delete course by courseId error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to soft delete course' });
    }
  },

  /**
   * Soft delete course by name
   * DELETE /api/course/name/:name/soft
   */
  async softDeleteByName(req, res) {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).json({ message: 'Course name is required' });
      }

      const course = await CourseService.softDeleteByName(decodeURIComponent(name));

      return res.json({
        message: 'Course soft deleted successfully',
        course
      });
    } catch (error) {
      console.error('Soft delete course by name error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to soft delete course' });
    }
  },

  /**
   * Permanently delete course by courseId
   * DELETE /api/course/:courseId/permanent
   */
  async permanentDeleteByCourseId(req, res) {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }

      await CourseService.permanentDeleteByCourseId(courseId);

      return res.json({
        message: 'Course permanently deleted successfully'
      });
    } catch (error) {
      console.error('Permanent delete course by courseId error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to permanently delete course' });
    }
  },

  /**
   * Permanently delete course by name
   * DELETE /api/course/name/:name/permanent
   */
  async permanentDeleteByName(req, res) {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).json({ message: 'Course name is required' });
      }

      await CourseService.permanentDeleteByName(decodeURIComponent(name));

      return res.json({
        message: 'Course permanently deleted successfully'
      });
    } catch (error) {
      console.error('Permanent delete course by name error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to permanently delete course' });
    }
  },

  /**
   * Restore soft deleted course by courseId
   * PUT /api/course/:courseId/restore
   */
  async restoreByCourseId(req, res) {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }

      const course = await CourseService.restoreByCourseId(courseId);

      return res.json({
        message: 'Course restored successfully',
        course
      });
    } catch (error) {
      console.error('Restore course by courseId error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to restore course' });
    }
  },

  /**
   * Restore soft deleted course by name
   * PUT /api/course/name/:name/restore
   */
  async restoreByName(req, res) {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).json({ message: 'Course name is required' });
      }

      const course = await CourseService.restoreByName(decodeURIComponent(name));

      return res.json({
        message: 'Course restored successfully',
        course
      });
    } catch (error) {
      console.error('Restore course by name error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to restore course' });
    }
  }
};

module.exports = CourseController;
