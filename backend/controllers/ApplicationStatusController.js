const ApplicationStatusService = require('../services/ApplicationStatusService');

/**
 * Get comprehensive application status for the authenticated user
 * GET /api/status/me
 */
async function getMyComprehensiveStatus(req, res) {
  try {
    const userId = req.user.id;
    const status = await ApplicationStatusService.getComprehensiveStatus(userId);
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error in getMyComprehensiveStatus:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
}

/**
 * Get comprehensive application status for a specific user by userId
 * GET /api/status/:userId/user
 */
async function getComprehensiveStatusByUserId(req, res) {
  try {
    const { userId } = req.params;
    const status = await ApplicationStatusService.getComprehensiveStatus(userId);
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error in getComprehensiveStatusByUserId:', error);
    if (error.message.includes('Invalid') || error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
}

/**
 * Get comprehensive application status by ID number
 * GET /api/status/:idNumber/id
 */
async function getComprehensiveStatusByIdNumber(req, res) {
  try {
    const { idNumber } = req.params;
    const status = await ApplicationStatusService.getComprehensiveStatusByIdNumber(idNumber);
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error in getComprehensiveStatusByIdNumber:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
}

module.exports = {
  getMyComprehensiveStatus,
  getComprehensiveStatusByUserId,
  getComprehensiveStatusByIdNumber
};
