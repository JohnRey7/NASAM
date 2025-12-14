const ApplicationForm = require('../models/ApplicationForm');
const puppeteer = require('puppeteer');

const AnalyticsExportController = {
  // GET: Export analytics report as CSV or PDF
  async exportAnalytics(req, res) {
    try {
      console.log('🚀 AnalyticsExportController.exportAnalytics called');
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
        // Join with document uploads to compute GPA from uploaded grade averages (collegeTerm1-4)
        {
          $lookup: {
            from: 'documentuploads',
            localField: 'user',
            foreignField: 'user',
            as: 'documentUpload'
          }
        },
        { $unwind: { path: '$documentUpload', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            status: 1,
            program: '$programOfStudyAndYear',
            annualFamilyIncome: 1,
            collegeLevel: '$education.collegeLevel',
            gradeAverages: '$documentUpload.gradeAverages',
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
                  applicantAvg: {
                    $let: {
                      vars: {
                        collegeLevelArr: { $ifNull: ['$collegeLevel', []] },
                        uploadGrades: {
                          $map: {
                            input: {
                              $ifNull: [
                                [
                                  '$gradeAverages.collegeTerm1',
                                  '$gradeAverages.collegeTerm2',
                                  '$gradeAverages.collegeTerm3',
                                  '$gradeAverages.collegeTerm4'
                                ],
                                []
                              ]
                            },
                            as: 'g',
                            in: {
                              $convert: {
                                input: '$$g',
                                to: 'double',
                                onError: null,
                                onNull: null
                              }
                            }
                          }
                        }
                      },
                      in: {
                        $cond: [
                          { $gt: [{ $size: '$$collegeLevelArr' }, 0] },
                          {
                            $avg: {
                              $map: {
                                input: '$$collegeLevelArr',
                                as: 'cl',
                                in: {
                                  $let: {
                                    vars: {
                                      t1: {
                                        $convert: {
                                          input: '$$cl.firstSemesterAverageFinalGrade',
                                          to: 'double',
                                          onError: null,
                                          onNull: null
                                        }
                                      },
                                      t2: {
                                        $convert: {
                                          input: '$$cl.secondSemesterAverageFinalGrade',
                                          to: 'double',
                                          onError: null,
                                          onNull: null
                                        }
                                      },
                                      t3: {
                                        $convert: {
                                          input: '$$cl.thirdSemesterAverageFinalGrade',
                                          to: 'double',
                                          onError: null,
                                          onNull: null
                                        }
                                      }
                                    },
                                    in: {
                                      $let: {
                                        vars: {
                                          sum: {
                                            $add: [
                                              { $ifNull: ['$$t1', 0] },
                                              { $ifNull: ['$$t2', 0] },
                                              { $ifNull: ['$$t3', 0] }
                                            ]
                                          },
                                          cnt: {
                                            $add: [
                                              { $cond: [{ $ne: ['$$t1', null] }, 1, 0] },
                                              { $cond: [{ $ne: ['$$t2', null] }, 1, 0] },
                                              { $cond: [{ $ne: ['$$t3', null] }, 1, 0] }
                                            ]
                                          }
                                        },
                                        in: { $cond: [{ $gt: ['$$cnt', 0] }, { $divide: ['$$sum', '$$cnt'] }, null] }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          },
                          {
                            $let: {
                              vars: {
                                validUploads: {
                                  $filter: {
                                    input: '$$uploadGrades',
                                    as: 'g',
                                    cond: { $ne: ['$$g', null] }
                                  }
                                }
                              },
                              in: {
                                $cond: [
                                  { $gt: [{ $size: '$$validUploads' }, 0] },
                                  { $avg: '$$validUploads' },
                                  null
                                ]
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              },
              { $match: { applicantAvg: { $ne: null, $gte: 1, $lte: 5 } } },
              {
                $group: {
                  _id: null,
                  avgGPA: { $avg: '$applicantAvg' },
                  count: { $sum: 1 }
                }
              }
            ],
            gpaBuckets: [
              {
                $project: {
                  applicantAvg: {
                    $let: {
                      vars: {
                        collegeLevelArr: { $ifNull: ['$collegeLevel', []] },
                        uploadGrades: {
                          $map: {
                            input: {
                              $ifNull: [
                                [
                                  '$gradeAverages.collegeTerm1',
                                  '$gradeAverages.collegeTerm2',
                                  '$gradeAverages.collegeTerm3',
                                  '$gradeAverages.collegeTerm4'
                                ],
                                []
                              ]
                            },
                            as: 'g',
                            in: {
                              $convert: {
                                input: '$$g',
                                to: 'double',
                                onError: null,
                                onNull: null
                              }
                            }
                          }
                        }
                      },
                      in: {
                        $cond: [
                          { $gt: [{ $size: '$$collegeLevelArr' }, 0] },
                          {
                            $avg: {
                              $map: {
                                input: '$$collegeLevelArr',
                                as: 'cl',
                                in: {
                                  $let: {
                                    vars: {
                                      t1: {
                                        $convert: {
                                          input: '$$cl.firstSemesterAverageFinalGrade',
                                          to: 'double',
                                          onError: null,
                                          onNull: null
                                        }
                                      },
                                      t2: {
                                        $convert: {
                                          input: '$$cl.secondSemesterAverageFinalGrade',
                                          to: 'double',
                                          onError: null,
                                          onNull: null
                                        }
                                      },
                                      t3: {
                                        $convert: {
                                          input: '$$cl.thirdSemesterAverageFinalGrade',
                                          to: 'double',
                                          onError: null,
                                          onNull: null
                                        }
                                      }
                                    },
                                    in: {
                                      $let: {
                                        vars: {
                                          sum: {
                                            $add: [
                                              { $ifNull: ['$$t1', 0] },
                                              { $ifNull: ['$$t2', 0] },
                                              { $ifNull: ['$$t3', 0] }
                                            ]
                                          },
                                          cnt: {
                                            $add: [
                                              { $cond: [{ $ne: ['$$t1', null] }, 1, 0] },
                                              { $cond: [{ $ne: ['$$t2', null] }, 1, 0] },
                                              { $cond: [{ $ne: ['$$t3', null] }, 1, 0] }
                                            ]
                                          }
                                        },
                                        in: { $cond: [{ $gt: ['$$cnt', 0] }, { $divide: ['$$sum', '$$cnt'] }, null] }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          },
                          {
                            $let: {
                              vars: {
                                validUploads: {
                                  $filter: {
                                    input: '$$uploadGrades',
                                    as: 'g',
                                    cond: { $ne: ['$$g', null] }
                                  }
                                }
                              },
                              in: {
                                $cond: [
                                  { $gt: [{ $size: '$$validUploads' }, 0] },
                                  { $avg: '$$validUploads' },
                                  null
                                ]
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              },
              { $match: { applicantAvg: { $ne: null, $gte: 1, $lte: 5 } } },
              {
                $bucket: {
                  groupBy: '$applicantAvg',
                  boundaries: [0, 1.6, 2.1, 2.6, 3.1, 3.6, 4.1, 4.6, 5.1],
                  default: 'Other',
                  output: { count: { $sum: 1 } }
                }
              }
            ]
          }
        }
      ]).allowDiskUse(true);

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
      
      // Format GPA distribution buckets
      const bucketDefs = [
        { id: 0, label: '≤ 1.5' },
        { id: 1.6, label: '1.6 - 2.0' },
        { id: 2.1, label: '2.1 - 2.5' },
        { id: 2.6, label: '2.6 - 3.0' },
        { id: 3.1, label: '3.1 - 3.5' },
        { id: 3.6, label: '3.6 - 4.0' },
        { id: 4.1, label: '4.1 - 4.5' },
        { id: 4.6, label: '4.6 - 5.0' }
      ];
      const rawBuckets = facet.gpaBuckets || [];
      const bucketCountById = {};
      rawBuckets.forEach(b => {
        if (b && b._id !== undefined && b._id !== null && b._id !== 'Other') {
          bucketCountById[Number(b._id)] = b.count || 0;
        }
      });
      const gpaDistribution = bucketDefs.map(def => ({
        range: def.label,
        count: bucketCountById[def.id] || 0
      }));

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
        
        csv += '\nGPA DISTRIBUTION\n';
        csv += 'GPA Range,Applicant Count\n';
        gpaDistribution.forEach(bucket => {
          csv += `${bucket.range},${bucket.count}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
        
      } else if (format === 'pdf') {
        // Prepare chart data
        const statusLabels = Object.keys(statusCounts);
        const statusData = Object.values(statusCounts);
        const statusColors = ['#800000', '#a52a2a', '#dc143c', '#ff6347', '#ffa07a'];
        
        const incomeLabels = Object.keys(incomeCounts);
        const incomeData = Object.values(incomeCounts);
        const incomeColors = ['#2e7d32', '#66bb6a', '#81c784', '#a5d6a7'];
        
        const genderLabels = Object.keys(genderCounts);
        const genderData = Object.values(genderCounts);
        const genderColors = ['#1976d2', '#e91e63', '#9c27b0'];
        
        const topPrograms = programs.slice(0, 10);
        const programLabels = topPrograms.map(p => p.program.length > 30 ? p.program.substring(0, 30) + '...' : p.program);
        const programData = topPrograms.map(p => p.count);
        
        // GPA Distribution chart data
        const gpaLabels = gpaDistribution.map(b => b.range);
        const gpaData = gpaDistribution.map(b => b.count);
        const gpaColors = ['#4caf50', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9', '#e8f5e9', '#f1f8e9'];
        
        // Generate PDF using puppeteer with Chart.js
        const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; padding: 30px; }
    h1 { color: #800000; border-bottom: 3px solid #800000; padding-bottom: 8px; margin-bottom: 8px; font-size: 24px; }
    h2 { color: #800000; margin-top: 10px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px; font-size: 18px; }
    h3 { font-size: 14px; margin-top: 15px; margin-bottom: 8px; }
    .summary { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .summary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
    .summary-item:last-child { border-bottom: none; }
    .label { font-weight: bold; font-size: 14px; }
    .value { color: #800000; font-size: 18px; }
    .section { page-break-after: always; page-break-inside: avoid; }
    .section:last-child { page-break-after: auto; }
    .chart-container { margin: 15px auto; text-align: center; max-width: 650px; }
    .chart-row { display: flex; justify-content: space-around; gap: 25px; margin: 15px 0; }
    .chart-box { flex: 1; text-align: center; }
    canvas { max-width: 100%; height: auto !important; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
    th { background-color: #800000; color: white; font-size: 11px; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <!-- Page 1: Summary -->
  <div class="section">
    <h1>Analytics Report</h1>
    <p style="margin-bottom: 20px;">Generated: ${new Date().toLocaleString()}</p>
    
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

    <h2 style="margin-top: 40px;">Quick Statistics</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
      <div style="background: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107;">
        <h3 style="margin: 0 0 10px 0; color: #856404;">Application Status</h3>
        <div style="font-size: 12px;">
          ${Object.entries(statusCounts).map(([status, count]) => 
            `<div style="display: flex; justify-content: space-between; padding: 5px 0;">
              <span style="text-transform: capitalize;">${status}:</span>
              <strong>${count}</strong>
            </div>`
          ).join('')}
        </div>
      </div>
      <div style="background: #d1ecf1; padding: 20px; border-radius: 5px; border-left: 4px solid #17a2b8;">
        <h3 style="margin: 0 0 10px 0; color: #0c5460;">Top 5 Programs</h3>
        <div style="font-size: 12px;">
          ${programs.slice(0, 5).map(p => 
            `<div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #bee5eb;">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">${p.program}</span>
              <strong>${p.count}</strong>
            </div>`
          ).join('')}
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
      <div style="background: #d4edda; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745;">
        <h3 style="margin: 0 0 10px 0; color: #155724;">Income Distribution</h3>
        <div style="font-size: 12px;">
          ${Object.entries(incomeCounts).map(([income, count]) => 
            `<div style="display: flex; justify-content: space-between; padding: 5px 0;">
              <span>${income}:</span>
              <strong>${count}</strong>
            </div>`
          ).join('')}
        </div>
      </div>
      <div style="background: #f8d7da; padding: 20px; border-radius: 5px; border-left: 4px solid #dc3545;">
        <h3 style="margin: 0 0 10px 0; color: #721c24;">Gender Distribution</h3>
        <div style="font-size: 12px;">
          ${Object.entries(genderCounts).map(([gender, count]) => 
            `<div style="display: flex; justify-content: space-between; padding: 5px 0;">
              <span style="text-transform: capitalize;">${gender}:</span>
              <strong>${count}</strong>
            </div>`
          ).join('')}
        </div>
      </div>
    </div>

    <!-- GPA Distribution Summary Card -->
    <div style="background: #e8f5e9; padding: 20px; border-radius: 5px; border-left: 4px solid #4caf50; margin-top: 20px;">
      <h3 style="margin: 0 0 15px 0; color: #2e7d32;">📊 GPA Distribution</h3>
      <p style="font-size: 11px; color: #555; margin-bottom: 15px;">Distribution of applicant average GPAs</p>
      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; font-size: 11px;">
        ${gpaDistribution.map(bucket => 
          `<div style="text-align: center; padding: 12px; background: white; border-radius: 5px; border: 1px solid #c8e6c9;">
            <div style="font-size: 18px; font-weight: bold; color: #2e7d32;">${bucket.count}</div>
            <div style="color: #666; margin-top: 5px; font-size: 10px;">${bucket.range}</div>
          </div>`
        ).join('')}
      </div>
      <div style="margin-top: 15px; text-align: center; padding: 10px; background: white; border-radius: 5px;">
        <span style="color: #666; font-size: 12px;">Total Applicants with GPA: </span>
        <span style="font-weight: bold; color: #2e7d32; font-size: 14px;">${gpaCount}</span>
      </div>
    </div>
  </div>

  <!-- Page 2: Application Status -->
  <div class="section">
    <h2>Application Status Distribution</h2>
    <div class="chart-container">
      <canvas id="statusChart" width="600" height="380"></canvas>
    </div>
    <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
      <h3 style="color: #800000; margin-bottom: 15px;">Status Breakdown</h3>
      <table style="width: 100%; margin: 0;">
        <tr><th style="text-align: left;">Status</th><th style="text-align: center;">Count</th><th style="text-align: right;">Percentage</th></tr>
        ${Object.entries(statusCounts).map(([status, count]) => 
          `<tr>
            <td style="text-transform: capitalize; font-weight: bold;">${status}</td>
            <td style="text-align: center;">${count}</td>
            <td style="text-align: right;">${((count / totalApplicants) * 100).toFixed(1)}%</td>
          </tr>`
        ).join('')}
        <tr style="background: #800000; color: white; font-weight: bold;">
          <td>TOTAL</td>
          <td style="text-align: center;">${totalApplicants}</td>
          <td style="text-align: right;">100%</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Page 3: Top Programs -->
  <div class="section">
    <h2>Top 10 Programs</h2>
    <div class="chart-container">
      <canvas id="programChart" width="650" height="480"></canvas>
    </div>
    <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
      <h3 style="color: #856404; margin-bottom: 15px;">📊 Program Insights</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; font-size: 12px;">
        <div style="text-align: center; padding: 15px; background: white; border-radius: 5px;">
          <div style="font-size: 24px; font-weight: bold; color: #800000;">${programs.length}</div>
          <div style="color: #666; margin-top: 5px;">Total Programs</div>
        </div>
        <div style="text-align: center; padding: 15px; background: white; border-radius: 5px;">
          <div style="font-size: 24px; font-weight: bold; color: #800000;">${programs[0]?.count || 0}</div>
          <div style="color: #666; margin-top: 5px;">Most Popular</div>
        </div>
        <div style="text-align: center; padding: 15px; background: white; border-radius: 5px;">
          <div style="font-size: 24px; font-weight: bold; color: #800000;">${(totalApplicants / programs.length).toFixed(1)}</div>
          <div style="color: #666; margin-top: 5px;">Avg per Program</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Page 4: Income & Gender -->
  <div class="section">
    <h2>Income & Gender Distribution</h2>
    <div class="chart-row">
      <div class="chart-box">
        <h3 style="color: #666; margin-bottom: 10px;">Income Distribution</h3>
        <canvas id="incomeChart" width="320" height="320"></canvas>
      </div>
      <div class="chart-box">
        <h3 style="color: #666; margin-bottom: 10px;">Gender Distribution</h3>
        <canvas id="genderChart" width="320" height="320"></canvas>
      </div>
    </div>
    <div style="margin-top: 30px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="padding: 20px; background: #d4edda; border-radius: 5px; border-left: 4px solid #28a745;">
          <h3 style="color: #155724; margin-bottom: 15px;">💰 Income Breakdown</h3>
          <table style="width: 100%; margin: 0; font-size: 11px;">
            <tr><th>Bracket</th><th style="text-align: center;">Count</th><th style="text-align: right;">%</th></tr>
            ${Object.entries(incomeCounts).map(([income, count]) => 
              `<tr>
                <td>${income}</td>
                <td style="text-align: center;">${count}</td>
                <td style="text-align: right;">${((count / totalApplicants) * 100).toFixed(1)}%</td>
              </tr>`
            ).join('')}
          </table>
        </div>
        <div style="padding: 20px; background: #f8d7da; border-radius: 5px; border-left: 4px solid #dc3545;">
          <h3 style="color: #721c24; margin-bottom: 15px;">👥 Gender Breakdown</h3>
          <table style="width: 100%; margin: 0; font-size: 11px;">
            <tr><th>Gender</th><th style="text-align: center;">Count</th><th style="text-align: right;">%</th></tr>
            ${Object.entries(genderCounts).map(([gender, count]) => 
              `<tr>
                <td style="text-transform: capitalize;">${gender}</td>
                <td style="text-align: center;">${count}</td>
                <td style="text-align: right;">${((count / totalApplicants) * 100).toFixed(1)}%</td>
              </tr>`
            ).join('')}
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Page 5: GPA Distribution -->
  <div class="section">
    <h2>GPA Distribution</h2>
    <div class="chart-container">
      <canvas id="gpaChart" width="650" height="400"></canvas>
    </div>
    <div style="margin-top: 30px; padding: 20px; background: #e8f5e9; border-radius: 5px; border-left: 4px solid #4caf50;">
      <h3 style="color: #2e7d32; margin-bottom: 15px;">📊 GPA Breakdown</h3>
      <table style="width: 100%; margin: 0; font-size: 11px;">
        <tr><th>GPA Range</th><th style="text-align: center;">Applicant Count</th><th style="text-align: right;">%</th></tr>
        ${gpaDistribution.map(bucket => 
          `<tr>
            <td>${bucket.range}</td>
            <td style="text-align: center;">${bucket.count}</td>
            <td style="text-align: right;">${gpaCount > 0 ? ((bucket.count / gpaCount) * 100).toFixed(1) : 0}%</td>
          </tr>`
        ).join('')}
        <tr style="background: #4caf50; color: white; font-weight: bold;">
          <td>TOTAL</td>
          <td style="text-align: center;">${gpaCount}</td>
          <td style="text-align: right;">100%</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Page 6: Data Tables -->
  <div class="section">
    <h2>Detailed Data Tables</h2>
    
    <h3 style="color: #666; margin-top: 20px;">Application Status</h3>
    <table>
      <tr><th>Status</th><th>Count</th></tr>
      ${Object.entries(statusCounts).map(([status, count]) => 
        `<tr><td>${status}</td><td>${count}</td></tr>`
      ).join('')}
    </table>

    <h3 style="color: #666; margin-top: 30px;">Top 20 Programs</h3>
    <table>
      <tr><th>Program</th><th>Count</th></tr>
      ${programs.slice(0, 20).map(p => 
        `<tr><td>${p.program}</td><td>${p.count}</td></tr>`
      ).join('')}
    </table>
  </div>

  <script>
    // Status Chart (Doughnut)
    new Chart(document.getElementById('statusChart'), {
      type: 'doughnut',
      data: {
        labels: ${JSON.stringify(statusLabels)},
        datasets: [{
          data: ${JSON.stringify(statusData)},
          backgroundColor: ${JSON.stringify(statusColors)},
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { font: { size: 14 }, padding: 15 } },
          title: { display: false }
        }
      }
    });

    // Program Chart (Horizontal Bar)
    new Chart(document.getElementById('programChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(programLabels)},
        datasets: [{
          label: 'Number of Applicants',
          data: ${JSON.stringify(programData)},
          backgroundColor: '#800000',
          borderColor: '#600000',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          x: { beginAtZero: true, ticks: { font: { size: 12 } } },
          y: { ticks: { font: { size: 11 } } }
        }
      }
    });

    // Income Chart (Pie)
    new Chart(document.getElementById('incomeChart'), {
      type: 'pie',
      data: {
        labels: ${JSON.stringify(incomeLabels)},
        datasets: [{
          data: ${JSON.stringify(incomeData)},
          backgroundColor: ${JSON.stringify(incomeColors)},
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 10 } }
        }
      }
    });

    // Gender Chart (Pie)
    new Chart(document.getElementById('genderChart'), {
      type: 'pie',
      data: {
        labels: ${JSON.stringify(genderLabels)},
        datasets: [{
          data: ${JSON.stringify(genderData)},
          backgroundColor: ${JSON.stringify(genderColors)},
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 10 } }
        }
      }
    });

    // GPA Distribution Chart (Bar)
    new Chart(document.getElementById('gpaChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(gpaLabels)},
        datasets: [{
          label: 'Number of Applicants',
          data: ${JSON.stringify(gpaData)},
          backgroundColor: ${JSON.stringify(gpaColors)},
          borderWidth: 1,
          borderColor: '#2e7d32'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          x: { 
            ticks: { font: { size: 12 } },
            title: { display: true, text: 'GPA Range', font: { size: 14, weight: 'bold' } }
          },
          y: { 
            beginAtZero: true,
            ticks: { font: { size: 12 }, stepSize: 1 },
            title: { display: true, text: 'Applicant Count', font: { size: 14, weight: 'bold' } }
          }
        }
      }
    });
  </script>
</body>
</html>
        `;

        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Wait for Chart.js to render all charts
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        await browser.close();

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
