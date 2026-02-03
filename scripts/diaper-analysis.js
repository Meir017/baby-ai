const fs = require('fs');
const path = require('path');

/**
 * Analyze diaper changes to determine what percentage include both pee and poop
 */

// Load the data
const dataPath = path.join(__dirname, '../data/all-entries.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Helper function to convert time string to minutes since midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return -1;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Analyze diaper changes
let totalDiaperChanges = 0;
let bothPeeAndPoop = 0;
let onlyPee = 0;
let onlyPoop = 0;
const diaperChangeInstances = [];

for (const entry of data) {
  if (!entry.events || entry.events.length === 0) continue;

  // Group events by time to identify diaper changes
  // A diaper change is a "pee" and/or "poop" event
  // If they occur at the same time, it's one change with both
  const eventsByTime = {};

  for (const event of entry.events) {
    if (event.type === 'pee' || event.type === 'poop') {
      const time = event.time || '00:00';
      if (!eventsByTime[time]) {
        eventsByTime[time] = [];
      }
      eventsByTime[time].push(event.type);
    }
  }

  // Process grouped events
  for (const time in eventsByTime) {
    const types = eventsByTime[time];
    const hasPee = types.includes('pee');
    const hasPoop = types.includes('poop');

    totalDiaperChanges++;

    if (hasPee && hasPoop) {
      bothPeeAndPoop++;
      diaperChangeInstances.push({
        date: entry.date,
        time: time,
        type: 'both'
      });
    } else if (hasPee) {
      onlyPee++;
    } else if (hasPoop) {
      onlyPoop++;
    }
  }
}

// Calculate percentages
const percentage = totalDiaperChanges > 0 
  ? ((bothPeeAndPoop / totalDiaperChanges) * 100).toFixed(2)
  : 0;

// Output results
console.log('=== DIAPER CHANGE ANALYSIS ===\n');
console.log(`Total diaper changes: ${totalDiaperChanges}`);
console.log(`Both pee and poop: ${bothPeeAndPoop} (${percentage}%)`);
console.log(`Only pee: ${onlyPee}`);
console.log(`Only poop: ${onlyPoop}`);
console.log('\n=== BREAKDOWN ===');
console.log(`\nOut of ${totalDiaperChanges} total diaper changes:`);
console.log(`  - ${((onlyPee / totalDiaperChanges) * 100).toFixed(2)}% were only pee`);
console.log(`  - ${((onlyPoop / totalDiaperChanges) * 100).toFixed(2)}% were only poop`);
console.log(`  - ${percentage}% were both pee and poop`);

if (diaperChangeInstances.length > 0 && diaperChangeInstances.length <= 50) {
  console.log('\n=== INSTANCES OF BOTH PEE AND POOP ===');
  diaperChangeInstances.forEach(instance => {
    console.log(`${instance.date} at ${instance.time}`);
  });
}
