const fs = require('fs');
const path = require('path');

/**
 * Categorize and enrich parsed baby log data with computed fields:
 * - Feeding intervals & total daily intake
 * - Sleep classification (nap vs. night) & longest stretches
 * - Weekly and monthly aggregates
 * - Growth velocity
 */

class DataCategorizer {
  constructor(entries) {
    this.entries = entries;
  }

  run() {
    const enrichedDays = this.entries.map(day => this.enrichDay(day));
    const weeks = this.buildWeeklyAggregates(enrichedDays);
    const months = this.buildMonthlyAggregates(enrichedDays);
    const growth = this.buildGrowthTimeline(enrichedDays);

    return { days: enrichedDays, weeks, months, growth };
  }

  enrichDay(day) {
    const feedingSessions = this.categorizeFeedingSessions(day);
    const sleepSessions = this.categorizeSleepSessions(day);
    const diapers = this.categorizeDiapers(day);

    return {
      date: day.date,
      dayOfWeek: day.dayOfWeek,
      age: day.age,
      feeding: feedingSessions,
      sleep: sleepSessions,
      diapers,
      events: day.events,
      summary: day.summary
    };
  }

  // ── Feeding ──────────────────────────────────────────────

  categorizeFeedingSessions(day) {
    const feedEvents = day.events.filter(e =>
      ['breastfeeding', 'formula', 'expressed_breast_milk'].includes(e.type)
    );

    const sessions = [];
    let currentSession = null;

    for (const event of feedEvents) {
      const minutes = this.timeToMinutes(event.time);

      if (currentSession && minutes - currentSession.endMin <= 15) {
        // Merge events within 15 minutes into one session
        currentSession.events.push(event);
        currentSession.endMin = minutes;
        currentSession.endTime = event.time;
      } else {
        if (currentSession) sessions.push(this.summarizeSession(currentSession));
        currentSession = {
          startTime: event.time,
          endTime: event.time,
          startMin: minutes,
          endMin: minutes,
          events: [event]
        };
      }
    }
    if (currentSession) sessions.push(this.summarizeSession(currentSession));

    // Compute intervals between sessions
    for (let i = 1; i < sessions.length; i++) {
      sessions[i].intervalFromPrevious = sessions[i].startMin - sessions[i - 1].endMin;
    }

    const totalFormulaMl = feedEvents
      .filter(e => e.type === 'formula')
      .reduce((s, e) => s + (e.amount || 0), 0);
    const totalEbmMl = feedEvents
      .filter(e => e.type === 'expressed_breast_milk')
      .reduce((s, e) => s + (e.amount || 0), 0);
    const totalBfMinutes = feedEvents
      .filter(e => e.type === 'breastfeeding')
      .reduce((s, e) => s + (e.left || 0) + (e.right || 0), 0);

    return {
      sessions,
      sessionCount: sessions.length,
      totalFormulaMl,
      totalEbmMl,
      totalBfMinutes,
      totalMilkMl: totalFormulaMl + totalEbmMl,
      avgInterval: sessions.length > 1
        ? Math.round(sessions.slice(1).reduce((s, se) => s + (se.intervalFromPrevious || 0), 0) / (sessions.length - 1))
        : null
    };
  }

  summarizeSession(session) {
    const types = [...new Set(session.events.map(e => e.type))];
    const formulaMl = session.events
      .filter(e => e.type === 'formula')
      .reduce((s, e) => s + (e.amount || 0), 0);
    const ebmMl = session.events
      .filter(e => e.type === 'expressed_breast_milk')
      .reduce((s, e) => s + (e.amount || 0), 0);
    const bfMinutes = session.events
      .filter(e => e.type === 'breastfeeding')
      .reduce((s, e) => s + (e.left || 0) + (e.right || 0), 0);

    return {
      startTime: session.startTime,
      endTime: session.endTime,
      startMin: session.startMin,
      endMin: session.endMin,
      types,
      formulaMl,
      ebmMl,
      bfMinutes,
      intervalFromPrevious: null
    };
  }

  // ── Sleep ────────────────────────────────────────────────

  categorizeSleepSessions(day) {
    const sleepEvents = day.events.filter(e => e.type === 'sleep' || e.type === 'wake_up');
    const sessions = [];

    for (let i = 0; i < sleepEvents.length; i++) {
      const event = sleepEvents[i];
      if (event.type === 'wake_up' && event.sleptDuration) {
        const durationMin = (event.sleptDuration.hours || 0) * 60 + (event.sleptDuration.minutes || 0);
        const wakeMin = this.timeToMinutes(event.time);
        const sleepStartMin = wakeMin - durationMin;

        // Night sleep: started before 22:00 prev day or woke after 05:00 and slept > 4h
        const isNight = durationMin >= 240 || sleepStartMin < 0 || (wakeMin <= 420 && durationMin >= 120);

        sessions.push({
          wakeTime: event.time,
          durationMinutes: durationMin,
          category: isNight ? 'night' : 'nap'
        });
      }
    }

    const naps = sessions.filter(s => s.category === 'nap');
    const nightSleeps = sessions.filter(s => s.category === 'night');
    const totalNapMin = naps.reduce((s, n) => s + n.durationMinutes, 0);
    const totalNightMin = nightSleeps.reduce((s, n) => s + n.durationMinutes, 0);
    const longestStretch = sessions.length > 0
      ? Math.max(...sessions.map(s => s.durationMinutes))
      : 0;

    return {
      sessions,
      napCount: naps.length,
      totalNapMinutes: totalNapMin,
      totalNightMinutes: totalNightMin,
      totalSleepMinutes: totalNapMin + totalNightMin,
      longestStretchMinutes: longestStretch
    };
  }

  // ── Diapers ──────────────────────────────────────────────

  categorizeDiapers(day) {
    const pees = day.events.filter(e => e.type === 'pee');
    const poops = day.events.filter(e => e.type === 'poop');

    // Find concurrent pee+poop (same timestamp)
    const concurrent = pees.filter(p => poops.some(pp => pp.time === p.time)).length;

    return {
      peeCount: pees.length,
      poopCount: poops.length,
      concurrentCount: concurrent
    };
  }

  // ── Weekly aggregates ────────────────────────────────────

  buildWeeklyAggregates(days) {
    const weeks = {};
    for (const day of days) {
      const d = new Date(day.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay()); // Sunday start
      const weekKey = weekStart.toISOString().slice(0, 10);

      if (!weeks[weekKey]) {
        weeks[weekKey] = { weekStart: weekKey, days: [] };
      }
      weeks[weekKey].days.push(day);
    }

    return Object.values(weeks).map(w => {
      const n = w.days.length;
      return {
        weekStart: w.weekStart,
        dayCount: n,
        age: w.days[0].age,
        feeding: {
          avgFormulaMl: Math.round(w.days.reduce((s, d) => s + d.feeding.totalFormulaMl, 0) / n),
          avgBfMinutes: Math.round(w.days.reduce((s, d) => s + d.feeding.totalBfMinutes, 0) / n),
          avgSessionCount: +(w.days.reduce((s, d) => s + d.feeding.sessionCount, 0) / n).toFixed(1),
          avgInterval: this.avgNonNull(w.days.map(d => d.feeding.avgInterval))
        },
        sleep: {
          avgTotalMinutes: Math.round(w.days.reduce((s, d) => s + d.sleep.totalSleepMinutes, 0) / n),
          avgNapCount: +(w.days.reduce((s, d) => s + d.sleep.napCount, 0) / n).toFixed(1),
          avgNapMinutes: Math.round(w.days.reduce((s, d) => s + d.sleep.totalNapMinutes, 0) / n),
          avgNightMinutes: Math.round(w.days.reduce((s, d) => s + d.sleep.totalNightMinutes, 0) / n),
          avgLongestStretch: Math.round(w.days.reduce((s, d) => s + d.sleep.longestStretchMinutes, 0) / n)
        },
        diapers: {
          avgPee: +(w.days.reduce((s, d) => s + d.diapers.peeCount, 0) / n).toFixed(1),
          avgPoop: +(w.days.reduce((s, d) => s + d.diapers.poopCount, 0) / n).toFixed(1)
        }
      };
    });
  }

  // ── Monthly aggregates ───────────────────────────────────

  buildMonthlyAggregates(days) {
    const months = {};
    for (const day of days) {
      const monthKey = day.date.slice(0, 7);
      if (!months[monthKey]) months[monthKey] = { month: monthKey, days: [] };
      months[monthKey].days.push(day);
    }

    return Object.values(months).map(m => {
      const n = m.days.length;
      return {
        month: m.month,
        dayCount: n,
        ageRange: { from: m.days[0].age, to: m.days[n - 1].age },
        feeding: {
          avgFormulaMl: Math.round(m.days.reduce((s, d) => s + d.feeding.totalFormulaMl, 0) / n),
          avgBfMinutes: Math.round(m.days.reduce((s, d) => s + d.feeding.totalBfMinutes, 0) / n),
          avgTotalMilkMl: Math.round(m.days.reduce((s, d) => s + d.feeding.totalMilkMl, 0) / n),
          avgSessionCount: +(m.days.reduce((s, d) => s + d.feeding.sessionCount, 0) / n).toFixed(1)
        },
        sleep: {
          avgTotalMinutes: Math.round(m.days.reduce((s, d) => s + d.sleep.totalSleepMinutes, 0) / n),
          avgNapMinutes: Math.round(m.days.reduce((s, d) => s + d.sleep.totalNapMinutes, 0) / n),
          avgNightMinutes: Math.round(m.days.reduce((s, d) => s + d.sleep.totalNightMinutes, 0) / n),
          avgLongestStretch: Math.round(m.days.reduce((s, d) => s + d.sleep.longestStretchMinutes, 0) / n)
        },
        diapers: {
          avgPee: +(m.days.reduce((s, d) => s + d.diapers.peeCount, 0) / n).toFixed(1),
          avgPoop: +(m.days.reduce((s, d) => s + d.diapers.poopCount, 0) / n).toFixed(1)
        }
      };
    });
  }

  // ── Growth ───────────────────────────────────────────────

  buildGrowthTimeline(days) {
    const measurements = [];
    for (const day of days) {
      for (const e of day.events) {
        if (['weight', 'height', 'head_size'].includes(e.type)) {
          measurements.push({ date: day.date, age: day.age, ...e });
        }
      }
    }

    // Compute velocity between consecutive weight measurements
    const weights = measurements.filter(m => m.type === 'weight').sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 1; i < weights.length; i++) {
      const daysDiff = (new Date(weights[i].date) - new Date(weights[i - 1].date)) / 86400000;
      if (daysDiff > 0) {
        weights[i].dailyGainG = Math.round(((weights[i].kg - weights[i - 1].kg) * 1000) / daysDiff * 10) / 10;
      }
    }

    return { measurements, weights };
  }

  // ── Helpers ──────────────────────────────────────────────

  timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  avgNonNull(values) {
    const valid = values.filter(v => v != null);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((s, v) => s + v, 0) / valid.length);
  }
}

// ── Main ────────────────────────────────────────────────────

function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const entries = JSON.parse(fs.readFileSync(path.join(dataDir, 'all-entries.json'), 'utf-8'));

  console.log(`Categorizing ${entries.length} days of data...`);
  const categorizer = new DataCategorizer(entries);
  const result = categorizer.run();

  const outputPath = path.join(dataDir, 'categorized-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log(`  ${result.weeks.length} weeks`);
  console.log(`  ${result.months.length} months`);
  console.log(`  ${result.growth.measurements.length} growth measurements`);
  console.log(`Saved to ${outputPath}`);
}

main();
