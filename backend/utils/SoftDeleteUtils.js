const mongoose = require('mongoose');

/**
 * Utility class for soft delete operations
 */
class SoftDeleteUtils {
  /**
   * Add soft delete filter to query
   * @param {Object} query - Mongoose query object
   * @param {boolean} includeDeleted - Whether to include soft-deleted records
   * @returns {Object} Modified query with is_deleted filter
   */
  static addSoftDeleteFilter(query = {}, includeDeleted = false) {
    if (!includeDeleted) {
      return { ...query, is_deleted: false };
    }
    return query;
  }

  /**
   * Soft delete a document by ID
   * @param {Object} Model - Mongoose model
   * @param {string} id - Document ID
   * @returns {Object} Update result
   */
  static async softDeleteById(Model, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ID format');
    }
    
    const result = await Model.findByIdAndUpdate(id, { is_deleted: true }, { new: true });
    if (!result) {
      throw new Error('Document not found');
    }
    return result;
  }

  /**
   * Soft delete documents by query
   * @param {Object} Model - Mongoose model
   * @param {Object} query - Query to match documents
   * @returns {Object} Update result
   */
  static async softDeleteByQuery(Model, query) {
    const result = await Model.updateMany(
      { ...query, is_deleted: false }, 
      { is_deleted: true }
    );
    return result;
  }

  /**
   * Restore soft deleted document by ID
   * @param {Object} Model - Mongoose model
   * @param {string} id - Document ID
   * @returns {Object} Update result
   */
  static async restoreById(Model, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ID format');
    }
    
    const result = await Model.findByIdAndUpdate(id, { is_deleted: false }, { new: true });
    if (!result) {
      throw new Error('Document not found');
    }
    return result;
  }

  /**
   * Permanently delete a soft-deleted document by ID
   * @param {Object} Model - Mongoose model
   * @param {string} id - Document ID
   * @returns {Object} Delete result
   */
  static async permanentDeleteById(Model, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ID format');
    }
    
    const result = await Model.findOneAndDelete({ _id: id, is_deleted: true });
    if (!result) {
      throw new Error('Document not found or not soft-deleted');
    }
    return result;
  }

  /**
   * Get soft-deleted documents
   * @param {Object} Model - Mongoose model
   * @param {Object} query - Additional query filters
   * @returns {Array} Soft-deleted documents
   */
  static async getSoftDeleted(Model, query = {}) {
    return await Model.find({ ...query, is_deleted: true });
  }

  /**
   * Count soft-deleted documents
   * @param {Object} Model - Mongoose model
   * @param {Object} query - Additional query filters
   * @returns {number} Count of soft-deleted documents
   */
  static async countSoftDeleted(Model, query = {}) {
    return await Model.countDocuments({ ...query, is_deleted: true });
  }
}

module.exports = SoftDeleteUtils;