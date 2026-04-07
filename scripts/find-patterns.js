const fs = require('fs');
const path = require('path');

/**
 * Analyze categorized baby data to find patterns, trends, correlations, and anomalies.
 * Reads categorized-data.json, outputs patterns-report.json.
 */

class PatternFinder {
  constructor(data) {
    this.days = data.days;
    this.weeks = data.weeks;
    this.months = data.months;
    this.growth = data.growth;
  }

  run() {
    return {
      feedingTrends: this.analyzeFeedingTrends(),
      sleepTrends: this.analyzeSleepTrends(),
      milestones: this.detectMilestones(),
      correlations: this.findCorrelations(),
      anomalies: this.detectAnomalies(),
      growthAnalysis: this.analyzeGrowth(),
      schedulePatterns: this.analyzeSchedulePatterns(),
      dayOfWeekPatterns: this.analyzeDayOfWeek(),
      feedingComposition: this.analyzeFeedingComposition(),
      diaperTrends: this.analyzeDiaperTrends(),
      periodComparison: this.comparePeriods(),
      dailyDetails: this.buildDailyDetails()
    };
  }

  // ── Feeding trends ──────────────────────────────────────

  analyzeFeedingTrends() {
    const monthly = this.months.map(m => ({
      month: m.month,
      avgFormulaMl: m.feeding.avgFormulaMl,
      avgBfMinutes: m.feeding.avgBfMinutes,
      avgTotalMilkMl: m.feeding.avgTotalMilkMl,
      avgSessionCount: m.feeding.avgSessionCount
    }));

    // Detect formula introduction / BF wean-off
    const firstFormula = this.days.find(d => d.feeding.totalFormulaMl > 0);
    const lastBf = [...this.days].reverse().find(d => d.feeding.totalBfMinutes > 0);
    const firstMeal = this.days.find(d => d.events.some(e => e.type === 'meal'));

    // Weekly feeding interval trend (are feeds spacing out?)
    const intervalTrend = this.weeks
      .filter(w => w.feeding.avgInterval != null)
      .map(w => ({ weekStart: w.weekStart, avgIntervalMin: w.feeding.avgInterval }));

    // Formula amount trend per week
    const formulaTrend = this.weeks.map(w => ({
      weekStart: w.weekStart,
      avgFormulaMl: w.feeding.avgFormulaMl
    }));

    return {
      monthly,
      intervalTrend,
      formulaTrend,
      milestones: {
        firstFormula: firstFormula ? firstFormula.date : null,
        lastBreastfeeding: lastBf ? lastBf.date : null,
        firstSolidFood: firstMeal ? firstMeal.date : null
      }
    };
  }

  // ── Sleep trends ────────────────────────────────────────

  analyzeSleepTrends() {
    const monthly = this.months.map(m => ({
      month: m.month,
      avgTotalMin: m.sleep.avgTotalMinutes,
      avgNapMin: m.sleep.avgNapMinutes,
      avgNightMin: m.sleep.avgNightMinutes,
      avgLongestStretch: m.sleep.avgLongestStretch
    }));

    // Nap consolidation: track nap count over time
    const weeklyNaps = this.weeks.map(w => ({
      weekStart: w.weekStart,
      avgNapCount: w.sleep.avgNapCount,
      avgLongestStretch: w.sleep.avgLongestStretch
    }));

    // Detect potential sleep regressions (sudden increase in wake-ups / drop in longest stretch)
    const regressions = [];
    for (let i = 2; i < this.weeks.length; i++) {
      const prev2 = this.weeks[i - 2].sleep.avgLongestStretch;
      const prev1 = this.weeks[i - 1].sleep.avgLongestStretch;
      const curr = this.weeks[i].sleep.avgLongestStretch;
      const baseline = (prev2 + prev1) / 2;
      if (baseline > 0 && curr < baseline * 0.7) {
        regressions.push({
          weekStart: this.weeks[i].weekStart,
          age: this.weeks[i].age,
          dropPercent: Math.round((1 - curr / baseline) * 100)
        });
      }
    }

    return { monthly, weeklyNaps, regressions };
  }

  // ── Milestones timeline ─────────────────────────────────

  detectMilestones() {
    const milestones = [];

    // First occurrences
    const firstOf = (type) => this.days.find(d => d.events.some(e => e.type === type));
    const typeLabels = {
      formula: 'First formula',
      meal: 'First solid food',
      bath: 'First bath',
      walk: 'First walk',
      vaccine: 'First vaccine',
      medicine: 'First medicine'
    };
    for (const [type, label] of Object.entries(typeLabels)) {
      const day = firstOf(type);
      if (day) {
        milestones.push({ date: day.date, age: day.age, label });
      }
    }

    // First night stretch > 6h
    const firstLongNight = this.days.find(d =>
      d.sleep.sessions.some(s => s.category === 'night' && s.durationMinutes >= 360)
    );
    if (firstLongNight) {
      milestones.push({ date: firstLongNight.date, age: firstLongNight.age, label: 'First 6+ hour night stretch' });
    }

    // First day with > 500ml formula
    const first500 = this.days.find(d => d.feeding.totalFormulaMl >= 500);
    if (first500) {
      milestones.push({ date: first500.date, age: first500.age, label: 'First day with 500ml+ formula' });
    }

    // Weight milestones (every kg boundary)
    if (this.growth.weights.length > 0) {
      const seenKg = new Set();
      for (const w of this.growth.weights) {
        const kg = Math.floor(w.kg);
        if (kg >= 3 && !seenKg.has(kg)) {
          seenKg.add(kg);
          milestones.push({ date: w.date, age: undefined, label: `Reached ${kg}kg` });
        }
      }
    }

    // Vaccines
    for (const day of this.days) {
      for (const e of day.events) {
        if (e.type === 'vaccine') {
          milestones.push({ date: day.date, age: day.age, label: `Vaccine: ${e.name}` });
        }
      }
    }

    milestones.sort((a, b) => a.date.localeCompare(b.date));
    return milestones;
  }

  // ── Correlations ────────────────────────────────────────

  findCorrelations() {
    const results = {};

    // Formula ml vs total sleep
    results.formulaVsSleep = this.pearson(
      this.days.map(d => d.feeding.totalFormulaMl),
      this.days.map(d => d.sleep.totalSleepMinutes)
    );

    // Total milk vs sleep
    results.totalMilkVsSleep = this.pearson(
      this.days.map(d => d.feeding.totalMilkMl),
      this.days.map(d => d.sleep.totalSleepMinutes)
    );

    // Feeding sessions vs pee count
    results.feedingSessionsVsPee = this.pearson(
      this.days.map(d => d.feeding.sessionCount),
      this.days.map(d => d.diapers.peeCount)
    );

    // Longest sleep stretch vs formula
    results.formulaVsLongestStretch = this.pearson(
      this.days.map(d => d.feeding.totalFormulaMl),
      this.days.map(d => d.sleep.longestStretchMinutes)
    );

    // Label correlations
    for (const [key, val] of Object.entries(results)) {
      if (val === null) continue;
      const abs = Math.abs(val.r);
      val.strength = abs < 0.2 ? 'negligible' : abs < 0.4 ? 'weak' : abs < 0.6 ? 'moderate' : abs < 0.8 ? 'strong' : 'very strong';
      val.direction = val.r > 0 ? 'positive' : 'negative';
    }

    return results;
  }

  pearson(xs, ys) {
    const n = xs.length;
    if (n < 5) return null;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
      const a = xs[i] - mx;
      const b = ys[i] - my;
      num += a * b;
      dx += a * a;
      dy += b * b;
    }
    const denom = Math.sqrt(dx * dy);
    if (denom === 0) return null;
    return { r: Math.round((num / denom) * 1000) / 1000, n };
  }

  // ── Anomalies ───────────────────────────────────────────

  detectAnomalies() {
    const anomalies = [];

    // Use non-Shabbat days for baseline stats (Saturdays often have incomplete data)
    const nonShabbatDays = this.days.filter(d => d.dayOfWeek !== 'Sat');

    const allMetrics = this.days.map(d => ({
      date: d.date,
      dayOfWeek: d.dayOfWeek,
      formulaMl: d.feeding.totalFormulaMl,
      sleepMin: d.sleep.totalSleepMinutes,
      pee: d.diapers.peeCount,
      poop: d.diapers.poopCount,
      feedSessions: d.feeding.sessionCount
    }));

    // Compute baselines from non-Shabbat days only
    const baselineMetrics = allMetrics.filter(m => m.dayOfWeek !== 'Sat');

    const fields = ['formulaMl', 'sleepMin', 'pee', 'feedSessions'];
    const fieldLabels = {
      formulaMl: 'Formula intake',
      sleepMin: 'Total sleep',
      pee: 'Pee count',
      feedSessions: 'Feeding sessions'
    };

    for (const field of fields) {
      const baseValues = baselineMetrics.map(m => m[field]);
      const mean = baseValues.reduce((a, b) => a + b, 0) / baseValues.length;
      const std = Math.sqrt(baseValues.reduce((s, v) => s + (v - mean) ** 2, 0) / baseValues.length);

      if (std === 0) continue;

      for (let i = 0; i < allMetrics.length; i++) {
        const z = (allMetrics[i][field] - mean) / std;
        // For Shabbat days, only flag unusually high values (low is expected due to incomplete logging)
        if (Math.abs(z) > 2) {
          if (allMetrics[i].dayOfWeek === 'Sat' && z < 0) continue;
          anomalies.push({
            date: allMetrics[i].date,
            metric: fieldLabels[field],
            value: allMetrics[i][field],
            mean: Math.round(mean * 10) / 10,
            zScore: Math.round(z * 100) / 100,
            direction: z > 0 ? 'high' : 'low'
          });
        }
      }
    }

    // Zero pee days (potential dehydration concern) — skip Shabbat
    const zeroPeeDays = nonShabbatDays.filter(d => d.diapers.peeCount === 0);
    for (const d of zeroPeeDays) {
      anomalies.push({
        date: d.date,
        metric: 'Zero pee day',
        value: 0,
        mean: null,
        zScore: null,
        direction: 'low'
      });
    }

    anomalies.sort((a, b) => a.date.localeCompare(b.date));
    return anomalies;
  }

  // ── Growth analysis ─────────────────────────────────────

  analyzeGrowth() {
    const weights = this.growth.weights;
    if (weights.length < 2) return { weights, summary: null };

    const first = weights[0];
    const last = weights[weights.length - 1];
    const totalDays = (new Date(last.date) - new Date(first.date)) / 86400000;
    const totalGainKg = last.kg - first.kg;

    return {
      weights,
      summary: {
        firstWeight: { date: first.date, kg: first.kg },
        latestWeight: { date: last.date, kg: last.kg },
        totalGainKg: Math.round(totalGainKg * 1000) / 1000,
        totalDays: Math.round(totalDays),
        avgDailyGainG: totalDays > 0 ? Math.round((totalGainKg * 1000) / totalDays * 10) / 10 : null
      }
    };
  }

  // ── Schedule patterns ───────────────────────────────────

  analyzeSchedulePatterns() {
    // Find most common first/last feed times, wake time, bedtime
    const firstFeeds = [];
    const lastFeeds = [];
    const wakeTimes = [];
    const bedTimes = [];

    for (const day of this.days) {
      if (day.feeding.sessions.length > 0) {
        firstFeeds.push(day.feeding.sessions[0].startTime);
        lastFeeds.push(day.feeding.sessions[day.feeding.sessions.length - 1].startTime);
      }

      // First wake-up of the day (after 4am)
      const morningWake = day.events.find(e => e.type === 'wake_up' && this.timeToMinutes(e.time) >= 240);
      if (morningWake) wakeTimes.push(morningWake.time);

      // Last sleep event of the day (bedtime)
      const sleeps = day.events.filter(e => e.type === 'sleep');
      if (sleeps.length > 0) bedTimes.push(sleeps[sleeps.length - 1].time);
    }

    return {
      typicalFirstFeed: this.medianTime(firstFeeds),
      typicalLastFeed: this.medianTime(lastFeeds),
      typicalWakeTime: this.medianTime(wakeTimes),
      typicalBedTime: this.medianTime(bedTimes),
      sampleSize: this.days.length
    };
  }

  // ── Day-of-week patterns ─────────────────────────────────

  analyzeDayOfWeek() {
    const byDay = {};
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const d of dayOrder) byDay[d] = { formulaMl: [], sleepMin: [], pee: [], sessions: [] };

    for (const day of this.days) {
      const dow = day.dayOfWeek;
      if (!byDay[dow]) continue;
      byDay[dow].formulaMl.push(day.feeding.totalFormulaMl);
      byDay[dow].sleepMin.push(day.sleep.totalSleepMinutes);
      byDay[dow].pee.push(day.diapers.peeCount);
      byDay[dow].sessions.push(day.feeding.sessionCount);
    }

    return dayOrder.map(dow => ({
      day: dow,
      avgFormulaMl: this.avg(byDay[dow].formulaMl),
      avgSleepMin: this.avg(byDay[dow].sleepMin),
      avgPee: this.avg(byDay[dow].pee),
      avgSessions: this.avg(byDay[dow].sessions),
      count: byDay[dow].formulaMl.length
    }));
  }

  // ── Feeding composition over time ───────────────────────

  analyzeFeedingComposition() {
    return this.weeks.map(w => {
      const totalMin = w.feeding.avgBfMinutes;
      const totalMl = w.feeding.avgFormulaMl;
      // Approximate BF ml contribution: ~1ml per minute of breastfeeding is a rough estimate
      const estBfMl = totalMin * 1;
      const total = estBfMl + totalMl;
      return {
        weekStart: w.weekStart,
        bfMinutes: totalMin,
        formulaMl: totalMl,
        bfPercent: total > 0 ? Math.round(estBfMl / total * 100) : 0,
        formulaPercent: total > 0 ? Math.round(totalMl / total * 100) : 0
      };
    });
  }

  // ── Diaper trends ──────────────────────────────────────

  analyzeDiaperTrends() {
    return this.weeks.map(w => ({
      weekStart: w.weekStart,
      avgPee: w.diapers.avgPee,
      avgPoop: w.diapers.avgPoop
    }));
  }

  // ── Period comparison (first half vs second half) ───────

  comparePeriods() {
    if (this.days.length < 14) return null;

    const mid = Math.floor(this.days.length / 2);
    const first = this.days.slice(0, mid);
    const second = this.days.slice(mid);

    const summarize = (days) => ({
      dateRange: { from: days[0].date, to: days[days.length - 1].date },
      dayCount: days.length,
      avgFormulaMl: this.avg(days.map(d => d.feeding.totalFormulaMl)),
      avgBfMinutes: this.avg(days.map(d => d.feeding.totalBfMinutes)),
      avgSessions: this.avg(days.map(d => d.feeding.sessionCount)),
      avgSleepMin: this.avg(days.map(d => d.sleep.totalSleepMinutes)),
      avgNapMin: this.avg(days.map(d => d.sleep.totalNapMinutes)),
      avgNightMin: this.avg(days.map(d => d.sleep.totalNightMinutes)),
      avgLongestStretch: this.avg(days.map(d => d.sleep.longestStretchMinutes)),
      avgPee: this.avg(days.map(d => d.diapers.peeCount)),
      avgPoop: this.avg(days.map(d => d.diapers.poopCount))
    });

    const p1 = summarize(first);
    const p2 = summarize(second);

    // Compute % change
    const pctChange = (a, b) => a === 0 ? null : Math.round((b - a) / a * 100);

    return {
      early: p1,
      recent: p2,
      changes: {
        formulaMl: pctChange(p1.avgFormulaMl, p2.avgFormulaMl),
        bfMinutes: pctChange(p1.avgBfMinutes, p2.avgBfMinutes),
        sessions: pctChange(p1.avgSessions, p2.avgSessions),
        sleepMin: pctChange(p1.avgSleepMin, p2.avgSleepMin),
        longestStretch: pctChange(p1.avgLongestStretch, p2.avgLongestStretch),
        pee: pctChange(p1.avgPee, p2.avgPee)
      }
    };
  }

  // ── Daily details for scatter plots ─────────────────────

  buildDailyDetails() {
    return this.days.map(d => ({
      date: d.date,
      formulaMl: d.feeding.totalFormulaMl,
      totalMilkMl: d.feeding.totalMilkMl,
      bfMinutes: d.feeding.totalBfMinutes,
      sleepMin: d.sleep.totalSleepMinutes,
      longestStretch: d.sleep.longestStretchMinutes,
      napCount: d.sleep.napCount,
      pee: d.diapers.peeCount,
      poop: d.diapers.poopCount,
      sessions: d.feeding.sessionCount,
      avgInterval: d.feeding.avgInterval
    }));
  }

  // ── Helpers ─────────────────────────────────────────────

  avg(values) {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10;
  }

  timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  medianTime(times) {
    if (times.length === 0) return null;
    const mins = times.map(t => this.timeToMinutes(t)).sort((a, b) => a - b);
    const mid = mins[Math.floor(mins.length / 2)];
    return `${String(Math.floor(mid / 60)).padStart(2, '0')}:${String(mid % 60).padStart(2, '0')}`;
  }
}

// ── Main ────────────────────────────────────────────────────

function main() {
  const dataDir = path.join(__dirname, '..', 'data');
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, 'categorized-data.json'), 'utf-8'));

  console.log('Finding patterns...');
  const finder = new PatternFinder(data);
  const patterns = finder.run();

  const outputPath = path.join(dataDir, 'patterns-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(patterns, null, 2));

  console.log(`  ${patterns.milestones.length} milestones detected`);
  console.log(`  ${patterns.anomalies.length} anomalies flagged`);
  console.log(`  ${Object.keys(patterns.correlations).length} correlations computed`);
  console.log(`Saved to ${outputPath}`);
}

main();
