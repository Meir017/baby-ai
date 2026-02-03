const fs = require('fs');
const path = require('path');

/**
 * Export structured data to various formats (CSV, HTML, etc.)
 */

class DataExporter {
  constructor(dataPath) {
    this.dataPath = dataPath;
    this.entries = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }

  /**
   * Export to CSV format for spreadsheet analysis
   */
  exportToCSV(outputPath) {
    const headers = [
      'Date', 'Day of Week', 'Age (months)', 'Age (days)',
      'Breastfeeding Left (min)', 'Breastfeeding Right (min)',
      'Formula (times)', 'Formula (ml)',
      'Expressed Milk (times)', 'Expressed Milk (ml)',
      'Pumping (ml)', 'Sleep (hours)', 'Sleep (minutes)',
      'Pee (times)', 'Poop (times)'
    ];

    const rows = [headers.join(',')];

    for (const entry of this.entries) {
      const summary = entry.summary;
      const pumpingMl = this.calculateTotalPumping(entry.events);

      const row = [
        entry.date,
        entry.dayOfWeek,
        entry.age.months,
        entry.age.days,
        summary.breastfeeding?.left || 0,
        summary.breastfeeding?.right || 0,
        summary.formula?.times || 0,
        summary.formula?.totalMl || 0,
        summary.expressedBreastMilk?.times || 0,
        summary.expressedBreastMilk?.totalMl || 0,
        pumpingMl,
        summary.sleep?.hours || 0,
        summary.sleep?.minutes || 0,
        summary.pee || 0,
        summary.poop || 0
      ];

      rows.push(row.map(v => `"${v}"`).join(','));
    }

    fs.writeFileSync(outputPath, rows.join('\n'));
    console.log(`Exported to CSV: ${outputPath}`);
  }

  /**
   * Export to HTML format for viewing
   */
  exportToHTML(outputPath) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baby Log Data</title>
  <style>
    * { font-family: Arial, sans-serif; }
    body { margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #4CAF50; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f0f0f0; }
    .summary-box { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .event-list { font-size: 12px; background: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Baby Log Data - יובלי מיכאל</h1>
    <div class="summary-box">
      <h2>Dataset Overview</h2>
      <p>Total Days Tracked: ${this.entries.length}</p>
      <p>Date Range: ${this.entries[0]?.date} to ${this.entries[this.entries.length - 1]?.date}</p>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Day</th>
          <th>Age</th>
          <th>BF Left (min)</th>
          <th>BF Right (min)</th>
          <th>Formula</th>
          <th>EBM</th>
          <th>Sleep</th>
          <th>Pee/Poop</th>
        </tr>
      </thead>
      <tbody>`;

    for (const entry of this.entries) {
      const summary = entry.summary;
      const bfLeft = summary.breastfeeding?.left || 0;
      const bfRight = summary.breastfeeding?.right || 0;
      const formulaStr = summary.formula ? 
        `${summary.formula.times}x ${summary.formula.totalMl}ml` : '-';
      const ebmStr = summary.expressedBreastMilk ? 
        `${summary.expressedBreastMilk.times}x ${summary.expressedBreastMilk.totalMl}ml` : '-';
      const sleepStr = summary.sleep ? 
        `${summary.sleep.hours}h ${summary.sleep.minutes}m` : '-';
      const peePoopStr = `${summary.pee || 0}/${summary.poop || 0}`;
      const age = `${entry.age.months}m ${entry.age.days}d`;

      html += `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.dayOfWeek}</td>
          <td>${age}</td>
          <td>${bfLeft}</td>
          <td>${bfRight}</td>
          <td>${formulaStr}</td>
          <td>${ebmStr}</td>
          <td>${sleepStr}</td>
          <td>${peePoopStr}</td>
        </tr>`;
    }

    html += `
      </tbody>
    </table>
  </div>
</body>
</html>`;

    fs.writeFileSync(outputPath, html);
    console.log(`Exported to HTML: ${outputPath}`);
  }

  /**
   * Export to Markdown format
   */
  exportToMarkdown(outputPath) {
    let md = `# Baby Log Data - יובלי מיכאל\n\n`;
    md += `**Dataset Overview**\n`;
    md += `- Total Days: ${this.entries.length}\n`;
    md += `- Range: ${this.entries[0]?.date} to ${this.entries[this.entries.length - 1]?.date}\n\n`;

    md += `## Daily Summary\n\n`;
    md += `| Date | Day | Age | BF L/R | Formula | EBM | Sleep | Pee/Poop |\n`;
    md += `|------|-----|-----|--------|---------|-----|-------|----------|\n`;

    for (const entry of this.entries) {
      const summary = entry.summary;
      const bfStr = summary.breastfeeding ? 
        `${summary.breastfeeding.left}/${summary.breastfeeding.right}m` : '-';
      const formulaStr = summary.formula ? 
        `${summary.formula.times}x ${summary.formula.totalMl}ml` : '-';
      const ebmStr = summary.expressedBreastMilk ? 
        `${summary.expressedBreastMilk.times}x ${summary.expressedBreastMilk.totalMl}ml` : '-';
      const sleepStr = summary.sleep ? 
        `${summary.sleep.hours}h${summary.sleep.minutes}m` : '-';
      const peePoopStr = `${summary.pee || 0}/${summary.poop || 0}`;
      const age = `${entry.age.months}m${entry.age.days}d`;

      md += `| ${entry.date} | ${entry.dayOfWeek} | ${age} | ${bfStr} | ${formulaStr} | ${ebmStr} | ${sleepStr} | ${peePoopStr} |\n`;
    }

    fs.writeFileSync(outputPath, md);
    console.log(`Exported to Markdown: ${outputPath}`);
  }

  /**
   * Calculate total pumping volume from events
   */
  calculateTotalPumping(events) {
    let total = 0;
    for (const event of events) {
      if (event.type === 'pumping') {
        total += event.amount || 0;
      }
    }
    return total;
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

  const exporter = new DataExporter(dataPath);

  // Export in all formats
  exporter.exportToCSV(path.join(dataDir, 'baby-log-data.csv'));
  exporter.exportToHTML(path.join(dataDir, 'baby-log-data.html'));
  exporter.exportToMarkdown(path.join(dataDir, 'baby-log-data.md'));

  console.log('\nAll exports completed successfully!');
}

main();
