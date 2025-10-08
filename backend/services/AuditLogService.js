// services/AuditLogService.js
const AuditLog = require('../models/AuditLogs');

async function createLog({ userId, action, module }) {
  try {
    const log = new AuditLog({ userId, action, module });
    await log.save();
    console.log('✅ Audit log created:', log);
    return log;
  } catch (err) {
    console.error("❌ Failed to save audit log:", err.message);
  }
}


async function archiveLog(logId) {
  try {
    return await AuditLog.findByIdAndUpdate(
      logId,
      { archived: true },
      { new: true }
    );
  } catch (err) {
    console.error("❌ Failed to archive audit log:", err.message);
    throw err;
  }
}

module.exports = { createLog, archiveLog };
