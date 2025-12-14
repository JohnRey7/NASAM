const ApplicationForm = require('../models/ApplicationForm');
const puppeteer = require('puppeteer');

const AnalyticsExportController = {
  // GET: Export analytics report as CSV or PDF
  async exportAnalytics(req, res) {
    try {
      const { format = 'csv' } = req.query;
      console.log(`📊 Exporting analytics as ${format.toUpperCase()}...`);

      // Get the analytics data using the same aggregation as getAnalytics
      const results = await ApplicationForm.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDoc'
          }
        },
        { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            status: 1,
            program: '$programOfStudyAndYear',
            annualFamilyIncome: 1,
            collegeLevel: '$education.collegeLevel',
            normalizedGender: {
              $cond: [
                { $in: [ { $toLower: { $ifNull: ['$gender', '$userDoc.gender'] } }, ['male', 'female'] ] },
                { $ifNull: ['$gender', '$userDoc.gender'] },
                null  // Use null instead of 'Unknown' - will be filtered out in analytics
              ]
            }
          }
        },
        {
          $facet: {
            totalApplicants: [ { $count: 'count' } ],
            statusCounts: [
              { $group: { _id: { $toLower: { $ifNull: ['$status', 'pending'] } }, count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            programCounts: [
              { $group: { _id: '$program', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            incomeCounts: [
              { $group: { _id: '$annualFamilyIncome', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            genderCounts: [
              { $group: { _id: '$normalizedGender', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            gpaStats: [
              {
                $project: {
                  perEntryAvg: {
                    $map: {
                      input: { $ifNull: ['$collegeLevel', []] },
                      as: 'cl',
                      in: {
                        $let: {
                          vars: {
                            sum: {
                              $add: [
                                { $ifNull: ['$$cl.firstSemesterAverageFinalGrade', null] },
                                { $ifNull: ['$$cl.secondSemesterAverageFinalGrade', null] },
                                { $ifNull: ['$$cl.thirdSemesterAverageFinalGrade', null] }
                              ]
                            },
                            cnt: {
                              $add: [
                                { $cond: [{ $ifNull: ['$$cl.firstSemesterAverageFinalGrade', false] }, 1, 0] },
                                { $cond: [{ $ifNull: ['$$cl.secondSemesterAverageFinalGrade', false] }, 1, 0] },
                                { $cond: [{ $ifNull: ['$$cl.thirdSemesterAverageFinalGrade', false] }, 1, 0] }
                              ]
                            }
                          },
                          in: {
                            $cond: [{ $gt: ['$$cnt', 0] }, { $divide: ['$$sum', '$$cnt'] }, null]
                          }
                        }
                      }
                    }
                  }
                }
              },
              {
                $addFields: {
                  applicantAvg: { $avg: '$perEntryAvg' }
                }
              },
              { $match: { applicantAvg: { $ne: null } } },
              {
                $group: {
                  _id: null,
                  avgGPA: { $avg: '$applicantAvg' },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]).allowDiskUse(true);

      console.log('✅ Aggregation complete');

      const facet = (results && results[0]) || {};
      const totalApplicants = (facet.totalApplicants && facet.totalApplicants[0] && facet.totalApplicants[0].count) || 0;
      
      const statusCounts = {};
      (facet.statusCounts || []).forEach(s => { statusCounts[s._id || 'unknown'] = s.count; });
      
      const programs = (facet.programCounts || []).map(p => ({ program: p._id || 'Unknown', count: p.count }));
      
      const incomeCounts = {};
      (facet.incomeCounts || []).forEach(i => { incomeCounts[i._id || 'Unknown'] = i.count; });
      
      const genderCounts = {};
      // Filter out null/undefined genders - only show Male and Female in analytics
      (facet.genderCounts || []).forEach(g => { 
        if (g._id && (g._id === 'Male' || g._id === 'Female')) {
          genderCounts[g._id] = g.count; 
        }
      });
      
      const avgGPA = (facet.gpaStats && facet.gpaStats[0] && facet.gpaStats[0].avgGPA) ? Number((facet.gpaStats[0].avgGPA).toFixed(2)) : null;
      const gpaCount = (facet.gpaStats && facet.gpaStats[0] && facet.gpaStats[0].count) || 0;

      console.log(`📊 Data: ${totalApplicants} applicants, ${programs.length} programs`);

      if (format === 'csv') {
        // Generate CSV
        let csv = 'Analytics Report\n';
        csv += `Generated: ${new Date().toLocaleString()}\n\n`;
        
        csv += 'SUMMARY\n';
        csv += `Total Applicants,${totalApplicants}\n`;
        csv += `Average GPA,${avgGPA || 'N/A'}\n`;
        csv += `Applicants with GPA,${gpaCount}\n\n`;
        
        csv += 'APPLICATION STATUS\n';
        csv += 'Status,Count\n';
        Object.entries(statusCounts).forEach(([status, count]) => {
          csv += `${status},${count}\n`;
        });
        
        csv += '\nTOP PROGRAMS\n';
        csv += 'Program,Count\n';
        programs.slice(0, 20).forEach(p => {
          csv += `"${p.program}",${p.count}\n`;
        });
        
        csv += '\nINCOME DISTRIBUTION\n';
        csv += 'Income Bracket,Count\n';
        Object.entries(incomeCounts).forEach(([income, count]) => {
          csv += `${income},${count}\n`;
        });
        
        csv += '\nGENDER DISTRIBUTION\n';
        csv += 'Gender,Count\n';
        Object.entries(genderCounts).forEach(([gender, count]) => {
          csv += `${gender},${count}\n`;
        });

        console.log('✅ CSV generated');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
        
      } else if (format === 'pdf') {
        console.log('🔄 Starting PDF generation...');
        
        // Simple PDF without charts (for testing)
        const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #800000; border-bottom: 3px solid #800000; padding-bottom: 10px; }
    h2 { color: #800000; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #800000; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .summary { background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
    .summary-item:last-child { border-bottom: none; }
    .label { font-weight: bold; }
    .value { color: #800000; font-size: 1.2em; }
  </style>
</head>
<body>
  <h1>Analytics Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  
  <div class="summary">
    <div class="summary-item">
      <span class="label">Total Applicants:</span>
      <span class="value">${totalApplicants}</span>
    </div>
    <div class="summary-item">
      <span class="label">Average GPA:</span>
      <span class="value">${avgGPA || 'N/A'}</span>
    </div>
    <div class="summary-item">
      <span class="label">Applicants with GPA:</span>
      <span class="value">${gpaCount}</span>
    </div>
  </div>

  <h2>Application Status Distribution</h2>
  <table>
    <tr><th>Status</th><th>Count</th></tr>
    ${Object.entries(statusCounts).map(([status, count]) => 
      `<tr><td>${status}</td><td>${count}</td></tr>`
    ).join('')}
  </table>

  <h2>Top Programs (Top 20)</h2>
  <table>
    <tr><th>Program</th><th>Count</th></tr>
    ${programs.slice(0, 20).map(p => 
      `<tr><td>${p.program}</td><td>${p.count}</td></tr>`
    ).join('')}
  </table>

  <h2>Income Distribution</h2>
  <table>
    <tr><th>Income Bracket</th><th>Count</th></tr>
    ${Object.entries(incomeCounts).map(([income, count]) => 
      `<tr><td>${income}</td><td>${count}</td></tr>`
    ).join('')}
  </table>

  <h2>Gender Distribution</h2>
  <table>
    <tr><th>Gender</th><th>Count</th></tr>
    ${Object.entries(genderCounts).map(([gender, count]) => 
      `<tr><td>${gender}</td><td>${count}</td></tr>`
    ).join('')}
  </table>
</body>
</html>
        `;

        console.log('🚀 Launching Puppeteer...');
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        console.log('📄 Creating page...');
        const page = await browser.newPage();
        
        console.log('✍️ Setting content...');
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        console.log('📑 Generating PDF...');
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        
        console.log('🔒 Closing browser...');
        await browser.close();

        console.log('✅ PDF generated successfully');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
        res.send(pdf);
        
      } else {
        res.status(400).json({ success: false, message: 'Invalid format. Use csv or pdf.' });
      }
      
    } catch (error) {
      console.error('❌ Error exporting analytics:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to export analytics', 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};

module.exports = AnalyticsExportController;
