const fs = require('fs');
const path = require('path');

/**
 * Parse PiyoLog baby tracking data from raw text files
 * and convert to structured JSON format
 */

class PiyoLogParser {
  constructor() {
    this.monthMap = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
      'Jul': '07', 'Aug': '08', 'Sept': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
  }

  /**
   * Parse a single raw data file
   */
  parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const entries = [];
    let currentEntry = null;
    let currentDay = null;
    let currentEvents = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and header
      if (!line || line === '----------') continue;

      // Check for month header
      if (line.match(/\[PiyoLog\]/)) continue;

      // Check for day header (e.g., "Thu, 17 Jul 2025")
      const dayMatch = line.match(/^(\w+),\s+(\d+)\s+(\w+)\s+(\d+)$/);
      if (dayMatch) {
        // Save previous day if exists
        if (currentDay) {
          entries.push({
            date: this.formatDate(currentDay),
            dayOfWeek: currentDay.dayOfWeek,
            age: currentDay.age,
            events: currentEvents,
            summary: this.extractDaySummary(lines, i)
          });
        }

        currentDay = {
          dayOfWeek: dayMatch[1],
          day: dayMatch[2],
          month: dayMatch[3],
          year: dayMatch[4],
          age: this.extractAgeFromNextLine(lines, i)
        };
        currentEvents = [];
        continue;
      }

      // Check for daily summary lines
      if (line.startsWith('Total Breastfeeding time')) continue;
      if (line.startsWith('Had formula')) continue;
      if (line.startsWith('Total sleep')) continue;
      if (line.startsWith('Pee ')) continue;
      if (line.startsWith('Poop ')) continue;

      // Parse event lines (time-based entries)
      const eventMatch = line.match(/^(\d{2}:\d{2})\s+(.+)$/);
      if (eventMatch && currentDay) {
        const [, time, description] = eventMatch;
        const event = this.parseEvent(time, description);
        if (event) {
          currentEvents.push(event);
        }
      }
    }

    // Don't forget the last entry
    if (currentDay) {
      entries.push({
        date: this.formatDate(currentDay),
        dayOfWeek: currentDay.dayOfWeek,
        age: currentDay.age,
        events: currentEvents,
        summary: this.extractDaySummary(lines, lines.length)
      });
    }

    return entries;
  }

  /**
   * Format date object to ISO string
   */
  formatDate(dayObj) {
    const month = this.monthMap[dayObj.month];
    return `${dayObj.year}-${month}-${dayObj.day.padStart(2, '0')}`;
  }

  /**
   * Extract age from the next line after day header
   */
  extractAgeFromNextLine(lines, currentIndex) {
    for (let i = currentIndex + 1; i < Math.min(currentIndex + 3, lines.length); i++) {
      const match = lines[i].match(/\((\d+)m\s+(\d+)d\s+old\)/);
      if (match) {
        return {
          months: parseInt(match[1]),
          days: parseInt(match[2])
        };
      }
    }
    return { months: 0, days: 0 };
  }

  /**
   * Parse individual event line
   */
  parseEvent(time, description) {
    // Remove trailing numbers and notes (often in Hebrew)
    let cleanDesc = description.trim();

    // Breastfeeding - improved regex to handle various notations
    const bfMatch = cleanDesc.match(/Breastfeeding\s+(?:L\s+(\d+)m?|(\d+)m?)\s*(?:\/|▶|◀)?\s*(?:R\s+(\d+)m?|(\d+)m?)?/i) ||
                    cleanDesc.match(/Breastfeeding\s+([LR])\s+(\d+)m?\s*(?:\/|▶|◀)?\s*([LR])?\s*(\d+)m?/i) ||
                    cleanDesc.match(/Breastfeeding\s+([LR])\s+(\d+)/i);
    
    if (bfMatch) {
      // Handle different regex match patterns
      let left = 0, right = 0;
      
      if (cleanDesc.match(/^Breastfeeding\s+([LR])\s+(\d+)m?\s*(?:\/|▶|◀)?\s*([LR])?\s*(\d+)m?/)) {
        const match = cleanDesc.match(/^Breastfeeding\s+([LR])\s+(\d+)m?\s*(?:\/|▶|◀)?\s*([LR])?\s*(\d+)m?/);
        if (match) {
          const side1 = match[1];
          const time1 = parseInt(match[2]);
          const side2 = match[3];
          const time2 = match[4] ? parseInt(match[4]) : 0;
          
          if (side1 === 'L') {
            left = time1;
            if (side2 === 'R') right = time2;
            else if (!side2) right = 0;
          } else {
            right = time1;
            if (side2 === 'L') left = time2;
            else if (!side2) left = 0;
          }
        }
      } else if (cleanDesc.match(/^Breastfeeding\s+([LR])\s+(\d+)$/)) {
        const match = cleanDesc.match(/^Breastfeeding\s+([LR])\s+(\d+)$/);
        if (match[1] === 'L') left = parseInt(match[2]);
        else right = parseInt(match[2]);
      }
      
      return {
        time,
        type: 'breastfeeding',
        left,
        right
      };
    }

    // Formula
    const formulaMatch = cleanDesc.match(/Formula\s+(\d+)ml/i);
    if (formulaMatch) {
      return {
        time,
        type: 'formula',
        amount: parseInt(formulaMatch[1])
      };
    }

    // Expressed Breast Milk
    const ebmMatch = cleanDesc.match(/Expressed Breast Milk\s+(\d+)ml/i);
    if (ebmMatch) {
      return {
        time,
        type: 'expressed_breast_milk',
        amount: parseInt(ebmMatch[1])
      };
    }

    // Pumping
    const pumpMatch = cleanDesc.match(/Pumping\s+(\d+)ml/i);
    if (pumpMatch) {
      return {
        time,
        type: 'pumping',
        amount: parseInt(pumpMatch[1])
      };
    }

    // Sleep (with duration)
    const sleepMatch = cleanDesc.match(/Sleep\s*\((.+?)\)|\bSleep\b/i);
    if (sleepMatch) {
      return {
        time,
        type: 'sleep',
        duration: sleepMatch[1] ? this.parseDuration(sleepMatch[1]) : null
      };
    }

    // Wake-up (with duration slept)
    const wakeMatch = cleanDesc.match(/Wake-up\s*\((.+?)\)/i);
    if (wakeMatch) {
      return {
        time,
        type: 'wake_up',
        sleptDuration: this.parseDuration(wakeMatch[1])
      };
    }

    // Pee
    if (cleanDesc.match(/^Pee\b/i)) {
      return { time, type: 'pee' };
    }

    // Poop
    if (cleanDesc.match(/^Poop/i)) {
      return { time, type: 'poop' };
    }

    // Diaper change (if explicitly mentioned)
    if (cleanDesc.match(/Diaper\s+change/i) || cleanDesc.match(/Diaper/i)) {
      return { time, type: 'diaper_change' };
    }

    // Bath/Baths
    if (cleanDesc.match(/Baths?\b/i)) {
      return { time, type: 'bath' };
    }

    // Walks / Outdoor / טיול בחוץ
    const walkMatch = cleanDesc.match(/Walks?\s*\((.+?)\)|טיול בחוץ|Walks?\b/i);
    if (walkMatch) {
      return {
        time,
        type: 'walk',
        duration: walkMatch[1] ? this.parseDuration(walkMatch[1]) : null
      };
    }

    // Physiotherapy / Movement class / Massage / פיזיו
    if (cleanDesc.match(/פיזיו|physio|movement\s+class|חוג תנועה|עיסוי|massage/i)) {
      const activity = cleanDesc.match(/\(([^)]+)\)/) ? cleanDesc.match(/\(([^)]+)\)/)[1] : 'physiotherapy';
      return {
        time,
        type: 'physiotherapy',
        activity: activity
      };
    }

    // Temperature
    const tempMatch = cleanDesc.match(/Body Temp\s+([\d.]+)°?C/i);
    if (tempMatch) {
      return {
        time,
        type: 'body_temp',
        celsius: parseFloat(tempMatch[1])
      };
    }

    // Weight
    const weightMatch = cleanDesc.match(/Weight\s+([\d.]+)\s*kg/i);
    if (weightMatch) {
      return {
        time,
        type: 'weight',
        kg: parseFloat(weightMatch[1])
      };
    }

    // Height
    const heightMatch = cleanDesc.match(/Height\s+([\d.]+)\s*cm/i);
    if (heightMatch) {
      return {
        time,
        type: 'height',
        cm: parseFloat(heightMatch[1])
      };
    }

    // Head Size
    const headMatch = cleanDesc.match(/Head\s+Size\s+([\d.]+)\s*cm/i);
    if (headMatch) {
      return {
        time,
        type: 'head_size',
        cm: parseFloat(headMatch[1])
      };
    }

    // Vaccine
    const vaccineMatch = cleanDesc.match(/Vaccine\s+(.+)$|Vaccine\b/i);
    if (vaccineMatch) {
      return {
        time,
        type: 'vaccine',
        name: vaccineMatch[1] ? vaccineMatch[1].trim() : 'Vaccine'
      };
    }

    // Medicine
    const medicineMatch = cleanDesc.match(/Medicine\s+(.+)$|Medicine\b/i);
    if (medicineMatch) {
      return {
        time,
        type: 'medicine',
        name: medicineMatch[1] ? medicineMatch[1].trim() : 'Medicine'
      };
    }

    // If we can't parse it, log it for debugging
    if (cleanDesc && !cleanDesc.match(/^[א-ת]/) && cleanDesc.length > 0) {
      // Only log non-Hebrew, non-empty unparsed events
      if (!cleanDesc.match(/Breastfeeding|Formula|Expressed|Pumping|Sleep|Wake|Pee|Poop|Bath|Walk|טיול|Physio|Temp|Weight|Height|Head|Vaccine|Medicine/i)) {
        // console.log(`Unparsed event: [${time}] ${description}`);
      }
    }

    return null;
  }

  /**
   * Parse duration strings like "9h15m" or "0h50m"
   */
  parseDuration(durationStr) {
    const hours = durationStr.match(/(\d+)h/);
    const minutes = durationStr.match(/(\d+)m/);
    return {
      hours: hours ? parseInt(hours[1]) : 0,
      minutes: minutes ? parseInt(minutes[1]) : 0
    };
  }

  /**
   * Extract daily summary from the section following events
   */
  extractDaySummary(lines, currentIndex) {
    const summary = {};
    for (let i = currentIndex; i < Math.min(currentIndex + 10, lines.length); i++) {
      const line = lines[i].trim();
      
      // Breastfeeding time
      const bfMatch = line.match(/Total Breastfeeding time\s+L\s+(\d+)m\s*\/\s*R\s+(\d+)m/);
      if (bfMatch) {
        summary.breastfeeding = {
          left: parseInt(bfMatch[1]),
          right: parseInt(bfMatch[2])
        };
      }

      // Formula
      const formulaMatch = line.match(/Had formula\s+(\d+)times\s+(\d+)ml/);
      if (formulaMatch) {
        summary.formula = {
          times: parseInt(formulaMatch[1]),
          totalMl: parseInt(formulaMatch[2])
        };
      }

      // Sleep
      const sleepMatch = line.match(/Total sleep\s+(\d+)h(\d+)m/);
      if (sleepMatch) {
        summary.sleep = {
          hours: parseInt(sleepMatch[1]),
          minutes: parseInt(sleepMatch[2])
        };
      }

      // Expressed breast milk
      const ebmMatch = line.match(/Expressed breast milk\s+(\d+)times?\s+(\d+)ml/);
      if (ebmMatch) {
        summary.expressedBreastMilk = {
          times: parseInt(ebmMatch[1]),
          totalMl: parseInt(ebmMatch[2])
        };
      }

      // Pee
      const peeMatch = line.match(/Pee\s+(\d+)times/);
      if (peeMatch) {
        summary.pee = parseInt(peeMatch[1]);
      }

      // Poop
      const poopMatch = line.match(/Poop\s+(\d+)times/);
      if (poopMatch) {
        summary.poop = parseInt(poopMatch[1]);
      }
    }
    return summary;
  }
}

/**
 * Main execution
 */
function main() {
  const rawDataDir = path.join(__dirname, '..', 'raw-data');
  const dataDir = path.join(__dirname, '..', 'data');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const parser = new PiyoLogParser();
  const allEntries = [];

  // Read all raw data files
  const files = fs.readdirSync(rawDataDir)
    .filter(f => f.endsWith('.txt'))
    .sort();

  console.log(`Found ${files.length} raw data files. Parsing...`);

  for (const file of files) {
    const filePath = path.join(rawDataDir, file);
    console.log(`Parsing ${file}...`);
    const entries = parser.parseFile(filePath);
    allEntries.push(...entries);
  }

  // Sort by date
  allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Save all entries to a single JSON file
  const outputPath = path.join(dataDir, 'all-entries.json');
  fs.writeFileSync(outputPath, JSON.stringify(allEntries, null, 2));
  console.log(`\nParsed ${allEntries.length} daily entries`);
  console.log(`Saved to ${outputPath}`);

  // Also save monthly summaries
  const monthlySummaries = {};
  for (const entry of allEntries) {
    const month = entry.date.substring(0, 7); // YYYY-MM
    if (!monthlySummaries[month]) {
      monthlySummaries[month] = [];
    }
    monthlySummaries[month].push(entry);
  }

  const summaryPath = path.join(dataDir, 'monthly-summaries.json');
  fs.writeFileSync(summaryPath, JSON.stringify(monthlySummaries, null, 2));
  console.log(`Saved monthly summaries to ${summaryPath}`);
}

main();
