// controllers/AuditLogController.js
const AuditLog = require('../models/AuditLogs');
const AuditLogService = require('../services/AuditLogService');
const PDFDocument = require('pdfkit');   // for PDF export
const ExcelJS = require('exceljs');      // for Excel export

// ✅ Get logs with filters (excluding archived by default)
exports.getLogs = async (req, res) => {
  try {
    const { userId, module, startDate, endDate, includeArchived, page = 1, limit = 20, search } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build match filter
    const matchFilter = {};
    if (userId) matchFilter.userId = userId;
    if (module && module !== 'all') matchFilter.module = module;
    if (!includeArchived) matchFilter.archived = false;
    if (startDate && endDate) {
      matchFilter.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // If search is provided, use aggregation to search across user fields
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      
      const pipeline = [
        // Match initial filters
        { $match: matchFilter },
        // Lookup user data
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        // Unwind user info (make it a single object instead of array)
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true
          }
        },
        // Search across action, module, and user fields
        {
          $match: {
            $or: [
              { action: searchRegex },
              { module: searchRegex },
              { 'userInfo.name': searchRegex },
              { 'userInfo.email': searchRegex },
              { 'userInfo.idNumber': searchRegex }
            ]
          }
        },
        // Sort by timestamp descending
        { $sort: { timestamp: -1 } }
      ];

      // Get total count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await AuditLog.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      // Get paginated results
      const resultPipeline = [
        ...pipeline,
        { $skip: skip },
        { $limit: limitNum },
        // Project to match the expected format
        {
          $project: {
            _id: 1,
            timestamp: 1,
            action: 1,
            module: 1,
            archived: 1,
            userId: {
              _id: '$userInfo._id',
              name: '$userInfo.name',
              email: '$userInfo.email',
              idNumber: '$userInfo.idNumber'
            }
          }
        }
      ];

      const logs = await AuditLog.aggregate(resultPipeline);

      return res.status(200).json({
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasMore: skip + logs.length < total
        }
      });
    }

    // No search - use simple find with populate
    const total = await AuditLog.countDocuments(matchFilter);

    const logs = await AuditLog.find(matchFilter)
      .populate('userId', 'name idNumber email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + logs.length < total
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Export logs as PDF
exports.exportLogsPDF = async (req, res) => {
  try {
    const logs = await AuditLog.find({ archived: false }).populate('userId', 'name idNumber email');

    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.pdf');
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(18).text('Audit Logs Report', { align: 'center' });
    doc.moveDown();

    logs.forEach(log => {
      // Try to get user identifier in order of preference: name, email, idNumber
      const userIdentifier = log.userId?.name || log.userId?.email || log.userId?.idNumber || 'N/A';
      
      doc.fontSize(12).text(
        `User: ${userIdentifier} | Action: ${log.action} | Module: ${log.module} | Date: ${new Date(log.timestamp).toLocaleString()}`
      );
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Export logs as Excel/CSV
exports.exportLogsExcel = async (req, res) => {
  try {
    const logs = await AuditLog.find({ archived: false }).populate('userId', 'name idNumber email');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Audit Logs');

    sheet.columns = [
      { header: 'User', key: 'user', width: 25 },
      { header: 'Action', key: 'action', width: 25 },
      { header: 'Module', key: 'module', width: 25 },
      { header: 'Date', key: 'date', width: 30 },
    ];

    logs.forEach(log => {
      // Try to get user identifier in order of preference: name, email, idNumber
      let userIdentifier = 'N/A';
      if (log.userId) {
        userIdentifier = log.userId.name || 
                        log.userId.email || 
                        log.userId.idNumber ||
                        'N/A';
      }

      sheet.addRow({
        user: userIdentifier,
        action: log.action,
        module: log.module,
        date: new Date(log.timestamp).toLocaleString()
      });
    });

    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Archive log
exports.archiveLog = async (req, res) => {
  try {
    const { id } = req.params;
    const archivedLog = await AuditLogService.archiveLog(id);

    if (!archivedLog) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.status(200).json({ message: 'Log archived successfully', log: archivedLog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
