const fs = require('fs');
const path = require('path');

/**
 * Generate timeline visualizations and trend analysis
 * Creates an interactive HTML dashboard with charts
 */

class TimelineGenerator {
  constructor(dataPath) {
    this.dataPath = dataPath;
    this.entries = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }

  /**
   * Aggregate daily data for charting
   */
  getTimelineData() {
    const timeline = [];

    for (const entry of this.entries) {
      // Extract data directly from events
      let bfLeft = 0, bfRight = 0, formulaMl = 0, formulaTimes = 0;
      let ebmMl = 0, ebmTimes = 0, pumpingMl = 0;
      let sleepMinutes = 0, peeCount = 0, poopCount = 0;
      let weight = null, temperature = null;

      for (const event of entry.events) {
        switch(event.type) {
          case 'breastfeeding':
            if (event.left) bfLeft += event.left;
            if (event.right) bfRight += event.right;
            break;
          case 'formula':
            formulaMl += event.amount || 0;
            formulaTimes++;
            break;
          case 'expressed_breast_milk':
            ebmMl += event.amount || 0;
            ebmTimes++;
            break;
          case 'pumping':
            pumpingMl += event.amount || 0;
            break;
          case 'sleep':
            if (event.duration) {
              sleepMinutes += (event.duration.hours || 0) * 60 + (event.duration.minutes || 0);
            }
            break;
          case 'wake_up':
            // Sleep duration is stored in wake_up event as sleptDuration
            if (event.sleptDuration) {
              sleepMinutes += (event.sleptDuration.hours || 0) * 60 + (event.sleptDuration.minutes || 0);
            }
            break;
          case 'pee':
            peeCount++;
            break;
          case 'poop':
            poopCount++;
            break;
          case 'weight':
            weight = event.kg;
            break;
          case 'body_temp':
            temperature = event.celsius;
            break;
        }
      }

      const totalBF = bfLeft + bfRight;

      timeline.push({
        date: entry.date,
        dayOfWeek: entry.dayOfWeek,
        ageMonths: entry.age.months,
        ageDays: entry.age.days,
        breastfeedingLeft: bfLeft,
        breastfeedingRight: bfRight,
        breastfeedingTotal: totalBF,
        formulaMl: formulaMl,
        formulaTimes: formulaTimes,
        ebmMl: ebmMl,
        ebmTimes: ebmTimes,
        pumpingMl: pumpingMl,
        sleepMinutes: sleepMinutes,
        peeCount: peeCount,
        poopCount: poopCount,
        weight: weight,
        temperature: temperature
      });
    }

    return timeline;
  }

  /**
   * Generate HTML dashboard with charts
   */
  generateHTML(outputPath) {
    const timeline = this.getTimelineData();
    const dates = timeline.map(d => d.date);
    const ageLabels = timeline.map(d => `${d.ageMonths}m ${d.ageDays}d`);

    // Prepare chart data
    const bfLeftData = timeline.map(d => d.breastfeedingLeft);
    const bfRightData = timeline.map(d => d.breastfeedingRight);
    const formulaData = timeline.map(d => d.formulaMl);
    const ebmData = timeline.map(d => d.ebmMl);
    const sleepData = timeline.map(d => (d.sleepMinutes / 60).toFixed(1));
    const peeData = timeline.map(d => d.peeCount);
    const poopData = timeline.map(d => d.poopCount);

    // Filter weight and temp data (sparse)
    const weightDates = timeline.filter(d => d.weight).map(d => d.date);
    const weightValues = timeline.filter(d => d.weight).map(d => d.weight);
    const tempDates = timeline.filter(d => d.temperature).map(d => d.date);
    const tempValues = timeline.filter(d => d.temperature).map(d => d.temperature);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baby Log Timeline - יובלי מיכאל</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      padding: 30px;
    }
    
    h1 {
      color: #333;
      margin-bottom: 10px;
      text-align: center;
    }
    
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 40px;
    }
    
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-card .label {
      font-size: 12px;
      opacity: 0.9;
      text-transform: uppercase;
    }
    
    .stat-card .value {
      font-size: 28px;
      font-weight: bold;
      margin-top: 5px;
    }
    
    .chart-section {
      margin-bottom: 40px;
    }
    
    .chart-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    
    .chart-container {
      position: relative;
      height: 400px;
      margin-bottom: 20px;
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
    }
    
    .chart-container-small {
      position: relative;
      height: 300px;
      margin-bottom: 20px;
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
    }
    
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    @media (max-width: 1024px) {
      .two-column {
        grid-template-columns: 1fr;
      }
    }
    
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Baby Log Timeline - יובלי מיכאל</h1>
    <div class="subtitle">
      Data from ${dates[0]} to ${dates[dates.length - 1]} • ${this.entries.length} days tracked
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Total Days</div>
        <div class="value">${this.entries.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Age Range</div>
        <div class="value">${timeline[0].ageMonths}m - ${timeline[timeline.length - 1].ageMonths}m</div>
      </div>
      <div class="stat-card">
        <div class="label">Avg Breastfeeding</div>
        <div class="value">${(bfLeftData.reduce((a, b) => a + b, 0) / bfLeftData.length).toFixed(1)}m</div>
      </div>
      <div class="stat-card">
        <div class="label">Avg Sleep</div>
        <div class="value">${(sleepData.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / sleepData.length).toFixed(1)}h</div>
      </div>
    </div>
    
    <!-- Feeding Timeline -->
    <div class="chart-section">
      <div class="chart-title">🍼 Feeding Trends</div>
      <div class="chart-container">
        <canvas id="feedingChart"></canvas>
      </div>
    </div>
    
    <!-- Breastfeeding Details -->
    <div class="chart-section">
      <div class="chart-title">👶 Breastfeeding Duration (Left vs Right)</div>
      <div class="two-column">
        <div class="chart-container-small">
          <canvas id="bfLeftChart"></canvas>
        </div>
        <div class="chart-container-small">
          <canvas id="bfRightChart"></canvas>
        </div>
      </div>
    </div>
    
    <!-- Sleep Timeline -->
    <div class="chart-section">
      <div class="chart-title">😴 Sleep Duration</div>
      <div class="chart-container">
        <canvas id="sleepChart"></canvas>
      </div>
    </div>
    
    <!-- Elimination Timeline -->
    <div class="chart-section">
      <div class="chart-title">🚼 Elimination (Pee & Poop)</div>
      <div class="two-column">
        <div class="chart-container-small">
          <canvas id="peeChart"></canvas>
        </div>
        <div class="chart-container-small">
          <canvas id="poopChart"></canvas>
        </div>
      </div>
    </div>
    
    <!-- Weight Timeline -->
    ${weightValues.length > 0 ? `
    <div class="chart-section">
      <div class="chart-title">⚖️ Weight Progress</div>
      <div class="chart-container">
        <canvas id="weightChart"></canvas>
      </div>
    </div>
    ` : ''}
    
    <!-- Temperature Timeline -->
    ${tempValues.length > 0 ? `
    <div class="chart-section">
      <div class="chart-title">🌡️ Body Temperature</div>
      <div class="chart-container">
        <canvas id="tempChart"></canvas>
      </div>
    </div>
    ` : ''}
    
    <div class="footer">
      Generated on ${new Date().toLocaleString()}
    </div>
  </div>
  
  <script>
    const chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            maxTicksLimit: 8
          }
        }
      }
    };
    
    // Feeding Chart
    new Chart(document.getElementById('feedingChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(dates.map((d, i) => i % 7 === 0 ? d : ''))},
        datasets: [
          {
            label: 'Breastfeeding (min)',
            data: ${JSON.stringify(bfLeftData.map((v, i) => v + bfRightData[i]))},
            borderColor: '#FF6B9D',
            backgroundColor: 'rgba(255, 107, 157, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Formula (ml)',
            data: ${JSON.stringify(formulaData)},
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Expressed Milk (ml)',
            data: ${JSON.stringify(ebmData)},
            borderColor: '#FFC107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        ...chartDefaults,
        plugins: {
          ...chartDefaults.plugins,
          filler: {
            propagate: true
          }
        }
      }
    });
    
    // Breastfeeding Left Chart
    new Chart(document.getElementById('bfLeftChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(dates.map((d, i) => i % 7 === 0 ? d : ''))},
        datasets: [{
          label: 'Left Breast (min)',
          data: ${JSON.stringify(bfLeftData)},
          borderColor: '#FF6B9D',
          backgroundColor: 'rgba(255, 107, 157, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#FF6B9D'
        }]
      },
      options: chartDefaults
    });
    
    // Breastfeeding Right Chart
    new Chart(document.getElementById('bfRightChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(dates.map((d, i) => i % 7 === 0 ? d : ''))},
        datasets: [{
          label: 'Right Breast (min)',
          data: ${JSON.stringify(bfRightData)},
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#FF9800'
        }]
      },
      options: chartDefaults
    });
    
    // Sleep Chart
    new Chart(document.getElementById('sleepChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(dates.map((d, i) => i % 7 === 0 ? d : ''))},
        datasets: [{
          label: 'Sleep (hours)',
          data: ${JSON.stringify(sleepData)},
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#2196F3'
        }]
      },
      options: {
        ...chartDefaults,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toFixed(1) + 'h';
              }
            }
          }
        }
      }
    });
    
    // Pee Chart
    new Chart(document.getElementById('peeChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(dates.map((d, i) => i % 7 === 0 ? d : ''))},
        datasets: [{
          label: 'Pee Count',
          data: ${JSON.stringify(peeData)},
          backgroundColor: '#64B5F6',
          borderColor: '#2196F3',
          borderWidth: 1
        }]
      },
      options: chartDefaults
    });
    
    // Poop Chart
    new Chart(document.getElementById('poopChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(dates.map((d, i) => i % 7 === 0 ? d : ''))},
        datasets: [{
          label: 'Poop Count',
          data: ${JSON.stringify(poopData)},
          backgroundColor: '#A1887F',
          borderColor: '#795548',
          borderWidth: 1
        }]
      },
      options: chartDefaults
    });
    
    ${weightValues.length > 0 ? `
    // Weight Chart
    new Chart(document.getElementById('weightChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(weightDates)},
        datasets: [{
          label: 'Weight (kg)',
          data: ${JSON.stringify(weightValues)},
          borderColor: '#9C27B0',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#9C27B0'
        }]
      },
      options: chartDefaults
    });
    ` : ''}
    
    ${tempValues.length > 0 ? `
    // Temperature Chart
    new Chart(document.getElementById('tempChart'), {
      type: 'scatter',
      data: {
        labels: ${JSON.stringify(tempDates)},
        datasets: [{
          label: 'Temperature (°C)',
          data: ${JSON.stringify(tempValues.map((v, i) => ({ x: tempDates[i], y: v })))},
          borderColor: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.5)',
          pointRadius: 6,
          showLine: true,
          borderWidth: 2
        }]
      },
      options: {
        ...chartDefaults,
        scales: {
          y: {
            beginAtZero: false,
            min: 36,
            max: 39,
            ticks: {
              callback: function(value) {
                return value.toFixed(1) + '°C';
              }
            }
          }
        }
      }
    });
    ` : ''}
  </script>
</body>
</html>`;

    fs.writeFileSync(outputPath, html);
    console.log(`✅ Timeline generated: ${outputPath}`);
  }

  /**
   * Generate JSON timeline data for external analysis
   */
  generateJSON(outputPath) {
    const timeline = this.getTimelineData();
    fs.writeFileSync(outputPath, JSON.stringify(timeline, null, 2));
    console.log(`✅ Timeline data exported: ${outputPath}`);
  }

  /**
   * Generate summary statistics
   */
  generateSummary(outputPath) {
    const timeline = this.getTimelineData();
    
    // Calculate various metrics
    const bfData = timeline.filter(d => d.breastfeedingTotal > 0);
    const sleepData = timeline.filter(d => d.sleepMinutes > 0);
    const weightData = timeline.filter(d => d.weight);
    const tempData = timeline.filter(d => d.temperature);

    const summary = {
      totalDays: this.entries.length,
      dateRange: {
        start: timeline[0].date,
        end: timeline[timeline.length - 1].date
      },
      ageRange: {
        start: `${timeline[0].ageMonths}m ${timeline[0].ageDays}d`,
        end: `${timeline[timeline.length - 1].ageMonths}m ${timeline[timeline.length - 1].ageDays}d`
      },
      breastfeeding: {
        daysWithBF: bfData.length,
        avgLeftPerDay: (bfData.reduce((s, d) => s + d.breastfeedingLeft, 0) / this.entries.length).toFixed(1),
        avgRightPerDay: (bfData.reduce((s, d) => s + d.breastfeedingRight, 0) / this.entries.length).toFixed(1),
        maxLeftMinutes: Math.max(...bfData.map(d => d.breastfeedingLeft)),
        maxRightMinutes: Math.max(...bfData.map(d => d.breastfeedingRight))
      },
      formula: {
        daysWithFormula: timeline.filter(d => d.formulaMl > 0).length,
        avgMlPerDay: (timeline.reduce((s, d) => s + d.formulaMl, 0) / this.entries.length).toFixed(1),
        avgTimesPerDay: (timeline.reduce((s, d) => s + d.formulaTimes, 0) / this.entries.length).toFixed(1),
        totalMl: timeline.reduce((s, d) => s + d.formulaMl, 0)
      },
      expressedMilk: {
        daysWithEBM: timeline.filter(d => d.ebmMl > 0).length,
        avgMlPerDay: (timeline.reduce((s, d) => s + d.ebmMl, 0) / this.entries.length).toFixed(1),
        totalMl: timeline.reduce((s, d) => s + d.ebmMl, 0)
      },
      pumping: {
        daysWithPumping: timeline.filter(d => d.pumpingMl > 0).length,
        avgMlPerDay: (timeline.reduce((s, d) => s + d.pumpingMl, 0) / this.entries.length).toFixed(1),
        totalMl: timeline.reduce((s, d) => s + d.pumpingMl, 0)
      },
      sleep: {
        daysWithSleep: sleepData.length,
        avgMinutesPerDay: (sleepData.reduce((s, d) => s + d.sleepMinutes, 0) / sleepData.length).toFixed(0),
        avgHoursPerDay: ((sleepData.reduce((s, d) => s + d.sleepMinutes, 0) / sleepData.length) / 60).toFixed(1),
        maxMinutes: Math.max(...sleepData.map(d => d.sleepMinutes)),
        minMinutes: Math.min(...sleepData.map(d => d.sleepMinutes))
      },
      elimination: {
        avgPeePerDay: (timeline.reduce((s, d) => s + d.peeCount, 0) / this.entries.length).toFixed(1),
        avgPoopPerDay: (timeline.reduce((s, d) => s + d.poopCount, 0) / this.entries.length).toFixed(1),
        totalPee: timeline.reduce((s, d) => s + d.peeCount, 0),
        totalPoop: timeline.reduce((s, d) => s + d.poopCount, 0)
      },
      measurements: weightData.length > 0 ? {
        weight: {
          daysRecorded: weightData.length,
          startKg: weightData[0].weight,
          endKg: weightData[weightData.length - 1].weight,
          gainKg: (weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(2),
          maxKg: Math.max(...weightData.map(d => d.weight)),
          minKg: Math.min(...weightData.map(d => d.weight))
        }
      } : null,
      temperature: tempData.length > 0 ? {
        daysRecorded: tempData.length,
        avgCelsius: (tempData.reduce((s, d) => s + d.temperature, 0) / tempData.length).toFixed(1),
        maxCelsius: Math.max(...tempData.map(d => d.temperature)),
        minCelsius: Math.min(...tempData.map(d => d.temperature))
      } : null
    };

    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    console.log(`✅ Summary stats generated: ${outputPath}`);
  }
}

/**
 * Main execution
 */
function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const dataPath = path.join(dataDir, 'all-entries.json');

  if (!fs.existsSync(dataPath)) {
    console.error('Data file not found. Run parse-logs.js first.');
    process.exit(1);
  }

  const generator = new TimelineGenerator(dataPath);

  console.log('Generating timeline visualizations...\n');

  // Generate all outputs
  generator.generateHTML(path.join(dataDir, 'timeline.html'));
  generator.generateJSON(path.join(dataDir, 'timeline-data.json'));
  generator.generateSummary(path.join(dataDir, 'timeline-summary.json'));

  console.log('\n✨ All timeline files generated successfully!');
  console.log(`Open data/timeline.html in your browser to view the dashboard`);
}

main();
