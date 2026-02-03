const fs = require('fs');
const path = require('path');

/**
 * Query and analyze structured baby log data
 */

class BabyLogAnalyzer {
  constructor(dataPath) {
    this.dataPath = dataPath;
    this.entries = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }

  /**
   * Get entries for a specific date range
   */
  getEntriesByDateRange(startDate, endDate) {
    return this.entries.filter(e => 
      e.date >= startDate && e.date <= endDate
    );
  }

  /**
   * Get summary statistics for a date range
   */
  getSummaryStats(startDate, endDate) {
    const entries = this.getEntriesByDateRange(startDate, endDate);
    
    const stats = {
      totalDays: entries.length,
      totalBreastfeedingMinutes: { left: 0, right: 0 },
      totalFormula: { times: 0, ml: 0 },
      totalExpressionMilk: { times: 0, ml: 0 },
      totalSleep: { hours: 0, minutes: 0 },
      totalPee: 0,
      totalPoop: 0,
      averageBreastfeedingPerDay: { left: 0, right: 0 },
      averageSleepPerDay: { hours: 0, minutes: 0 },
      averagePeePerDay: 0,
      averagePoopPerDay: 0
    };

    for (const entry of entries) {
      const summary = entry.summary;
      
      if (summary.breastfeeding) {
        stats.totalBreastfeedingMinutes.left += summary.breastfeeding.left;
        stats.totalBreastfeedingMinutes.right += summary.breastfeeding.right;
      }
      
      if (summary.formula) {
        stats.totalFormula.times += summary.formula.times;
        stats.totalFormula.ml += summary.formula.totalMl;
      }
      
      if (summary.expressedBreastMilk) {
        stats.totalExpressionMilk.times += summary.expressedBreastMilk.times;
        stats.totalExpressionMilk.ml += summary.expressedBreastMilk.totalMl;
      }
      
      if (summary.sleep) {
        stats.totalSleep.hours += summary.sleep.hours;
        stats.totalSleep.minutes += summary.sleep.minutes;
      }
      
      stats.totalPee += summary.pee || 0;
      stats.totalPoop += summary.poop || 0;
    }

    // Convert minutes to hours if needed
    if (stats.totalSleep.minutes >= 60) {
      const extraHours = Math.floor(stats.totalSleep.minutes / 60);
      stats.totalSleep.hours += extraHours;
      stats.totalSleep.minutes %= 60;
    }

    // Calculate averages
    if (entries.length > 0) {
      stats.averageBreastfeedingPerDay.left = 
        (stats.totalBreastfeedingMinutes.left / entries.length).toFixed(1);
      stats.averageBreastfeedingPerDay.right = 
        (stats.totalBreastfeedingMinutes.right / entries.length).toFixed(1);
      
      stats.averageSleepPerDay.hours = 
        Math.floor(stats.totalSleep.hours / entries.length);
      stats.averageSleepPerDay.minutes = 
        Math.round((stats.totalSleep.minutes + 
                   (stats.totalSleep.hours % entries.length) * 60) / entries.length);
      
      stats.averagePeePerDay = (stats.totalPee / entries.length).toFixed(1);
      stats.averagePoopPerDay = (stats.totalPoop / entries.length).toFixed(1);
    }

    return stats;
  }

  /**
   * Get feeding pattern for a specific day
   */
  getFeedingPattern(date) {
    const entry = this.entries.find(e => e.date === date);
    if (!entry) return null;

    const feeding = [];
    for (const event of entry.events) {
      if (['breastfeeding', 'formula', 'expressed_breast_milk', 'pumping'].includes(event.type)) {
        feeding.push(event);
      }
    }
    return feeding;
  }

  /**
   * Get sleep schedule for a specific day
   */
  getSleepSchedule(date) {
    const entry = this.entries.find(e => e.date === date);
    if (!entry) return null;

    const sleepEvents = entry.events.filter(e => 
      ['sleep', 'wake_up'].includes(e.type)
    );
    return sleepEvents;
  }

  /**
   * Get all events of a specific type within a date range
   */
  getEventsByType(type, startDate, endDate) {
    const entries = this.getEntriesByDateRange(startDate, endDate);
    const events = [];
    
    for (const entry of entries) {
      for (const event of entry.events) {
        if (event.type === type) {
          events.push({ date: entry.date, ...event });
        }
      }
    }
    
    return events;
  }

  /**
   * Export daily detailed report to JSON
   */
  exportDayReport(date) {
    const entry = this.entries.find(e => e.date === date);
    if (!entry) return null;

    return {
      date: entry.date,
      dayOfWeek: entry.dayOfWeek,
      age: entry.age,
      timeline: entry.events,
      summary: entry.summary
    };
  }
}

/**
 * Command-line interface
 */
function main() {
  const dataPath = path.join(__dirname, '..', 'data', 'all-entries.json');

  if (!fs.existsSync(dataPath)) {
    console.error('Data file not found. Run parse-logs.js first.');
    process.exit(1);
  }

  const analyzer = new BabyLogAnalyzer(dataPath);
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  switch (command) {
    case 'stats':
      // Usage: node query-logs.js stats 2025-09-01 2025-09-30
      const stats = analyzer.getSummaryStats(arg1 || '2025-01-01', arg2 || '2025-12-31');
      console.log(JSON.stringify(stats, null, 2));
      break;

    case 'feeding':
      // Usage: node query-logs.js feeding 2025-09-01
      const feeding = analyzer.getFeedingPattern(arg1);
      console.log(JSON.stringify(feeding, null, 2));
      break;

    case 'sleep':
      // Usage: node query-logs.js sleep 2025-09-01
      const sleep = analyzer.getSleepSchedule(arg1);
      console.log(JSON.stringify(sleep, null, 2));
      break;

    case 'day':
      // Usage: node query-logs.js day 2025-09-01
      const dayReport = analyzer.exportDayReport(arg1);
      console.log(JSON.stringify(dayReport, null, 2));
      break;

    case 'events':
      // Usage: node query-logs.js events <type> 2025-09-01 2025-09-30
      const events = analyzer.getEventsByType(arg1, arg2, process.argv[5] || '2025-12-31');
      console.log(JSON.stringify(events, null, 2));
      break;

    default:
      console.log(`Baby Log Data Analyzer
      
Usage:
  node query-logs.js stats [startDate] [endDate]     - Get summary statistics
  node query-logs.js feeding <date>                   - Get feeding pattern for a day
  node query-logs.js sleep <date>                     - Get sleep schedule for a day
  node query-logs.js day <date>                       - Get full day report
  node query-logs.js events <type> [startDate] [endDate] - Get all events of a type

Event types: breastfeeding, formula, expressed_breast_milk, pumping, 
             sleep, wake_up, pee, poop, bath, walk, body_temp, weight, medicine

Date format: YYYY-MM-DD
      `);
  }
}

main();
