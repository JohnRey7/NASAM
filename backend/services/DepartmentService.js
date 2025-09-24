const mongoose = require('mongoose');
const Department = require('../models/Department');

class DepartmentService {
  // Create a new department
  static async createDepartment({ departmentCode, name }) {
    if (!departmentCode || !name) {
      throw new Error('Department code and name are required');
    }

    const normalizedCode = departmentCode.toUpperCase();

    // Check for existing departmentCode
    const existingDepartment = await Department.findOne({ departmentCode: normalizedCode });
    if (existingDepartment) {
      throw new Error('Department code already exists');
    }

    // Create department
    const department = new Department({ departmentCode: normalizedCode, name });
    await department.save();

    return department;
  }

  // Get all departments
  static async getAllDepartments({ page = 1, limit = 10 } = {}) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('Invalid page number');
    }
    if (isNaN(limitNum) || limitNum < 1) {
      throw new Error('Invalid limit');
    }

    const skip = (pageNum - 1) * limitNum;

    const departments = await Department.find({})
      .skip(skip)
      .limit(limitNum)
      .sort({ name: 1 })
      .lean();

    const totalCount = await Department.countDocuments();
    const totalPages = Math.ceil(totalCount / limitNum);

    return {
      departments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    };
  }

  // Get department by ID
  static async getDepartmentById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid department ID');
    }

    const department = await Department.findById(id);
    if (!department) {
      throw new Error('Department not found');
    }

    return department;
  }

  // Get department by code
  static async getDepartmentByCode(departmentCode) {
    if (!departmentCode) {
      throw new Error('Department code is required');
    }

    const normalizedCode = departmentCode.toUpperCase();
    const department = await Department.findOne({ departmentCode: normalizedCode });
    
    if (!department) {
      throw new Error('Department not found');
    }

    return department;
  }

  // Update department
  static async updateDepartment(id, { departmentCode, name }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid department ID');
    }

    const department = await Department.findById(id);
    if (!department) {
      throw new Error('Department not found');
    }

    // Update fields if provided
    if (departmentCode) {
      const normalizedCode = departmentCode.toUpperCase();
      
      // Check for existing code (excluding current department)
      const existingDepartment = await Department.findOne({ 
        departmentCode: normalizedCode,
        _id: { $ne: id }
      });
      
      if (existingDepartment) {
        throw new Error('Department code already exists');
      }
      
      department.departmentCode = normalizedCode;
    }

    if (name) {
      department.name = name;
    }

    await department.save();
    return department;
  }

  // Delete department
  static async deleteDepartment(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid department ID');
    }

    const department = await Department.findById(id);
    if (!department) {
      throw new Error('Department not found');
    }

    // Check if department is in use by any users
    const User = require('../models/User');
    const usersInDepartment = await User.countDocuments({ department: id });
    
    if (usersInDepartment > 0) {
      throw new Error('Cannot delete department that has assigned users');
    }

    await Department.findByIdAndDelete(id);
    
    return { message: 'Department deleted successfully' };
  }

  // Get departments with user counts
  static async getDepartmentsWithUserCounts() {
    const departments = await Department.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'users'
        }
      },
      {
        $project: {
          departmentCode: 1,
          name: 1,
          createdAt: 1,
          userCount: { $size: '$users' }
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    return departments;
  }

  // Search departments
  static async searchDepartments(searchTerm) {
    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    const departments = await Department.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { departmentCode: { $regex: searchTerm, $options: 'i' } }
      ]
    }).sort({ name: 1 });

    return departments;
  }
}

module.exports = DepartmentService;