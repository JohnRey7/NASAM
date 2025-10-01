// controllers/AuditLogController.js
const AuditLog = require('../models/AuditLogs');
const AuditLogService = require('../services/AuditLogService');
const PDFDocument = require('pdfkit');   // for PDF export
const ExcelJS = require('exceljs');      // for Excel export

// ✅ Get logs with filters (excluding archived by default)
exports.getLogs = async (req, res) => {
  try {
    const { userId, module, startDate, endDate, includeArchived } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (module) filter.module = module;
    if (!includeArchived) filter.archived = false; // default exclude archived
    if (startDate && endDate) {
      filter.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'username email')
      .sort({ timestamp: -1 });

    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Export logs as PDF
exports.exportLogsPDF = async (req, res) => {
  try {
    const logs = await AuditLog.find({ archived: false }).populate('userId', 'username email');

    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.pdf');
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(18).text('Audit Logs Report', { align: 'center' });
    doc.moveDown();

    logs.forEach(log => {
      doc.fontSize(12).text(
        `User: ${log.userId?.username || 'N/A'} | Action: ${log.action} | Module: ${log.module} | Date: ${log.timestamp}`
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
    const logs = await AuditLog.find({ archived: false }).populate('userId', 'username email');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Audit Logs');

    sheet.columns = [
      { header: 'User', key: 'user', width: 25 },
      { header: 'Action', key: 'action', width: 25 },
      { header: 'Module', key: 'module', width: 25 },
      { header: 'Date', key: 'date', width: 30 },
    ];

    logs.forEach(log => {
      sheet.addRow({
        user: log.userId?.username || 'N/A',
        action: log.action,
        module: log.module,
        date: log.timestamp
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
