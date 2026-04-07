const fs = require('fs');
const path = require('path');

/**
 * Generate an interactive HTML report from patterns-report.json and categorized-data.json.
 * Produces a single self-contained HTML file with embedded CSS and charts.
 */

class ReportGenerator {
  constructor(patterns, categorized) {
    this.patterns = patterns;
    this.categorized = categorized;
  }

  generate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Baby Growth Report</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
  :root { --bg: #f0f2f5; --card: #fff; --text: #1a1a2e; --muted: #6b7280; --accent: #4361ee; --accent2: #f72585; --accent3: #4cc9f0; --border: #e5e7eb; --green: #059669; --red: #dc2626; --yellow: #d97706; --purple: #7c3aed; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
  .container { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
  header { background: linear-gradient(135deg, #4361ee 0%, #7c3aed 100%); color: #fff; padding: 2rem 1.5rem; border-radius: 12px; margin-bottom: 2rem; }
  header h1 { font-size: 2rem; font-weight: 800; }
  header .subtitle { color: rgba(255,255,255,0.8); margin-top: 0.3rem; }
  .nav { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem; position: sticky; top: 0; background: var(--bg); padding: 0.8rem 0; z-index: 10; }
  .nav a { padding: 0.4rem 0.9rem; border-radius: 6px; background: var(--card); color: var(--text); text-decoration: none; font-size: 0.85rem; font-weight: 500; box-shadow: 0 1px 2px rgba(0,0,0,0.06); transition: all 0.15s; }
  .nav a:hover { background: var(--accent); color: #fff; }
  section { margin-bottom: 2.5rem; }
  h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
  h2 .icon { font-size: 1.5rem; }
  h3 { font-size: 1rem; color: var(--muted); margin: 1.2rem 0 0.6rem; font-weight: 600; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
  .card { background: var(--card); border-radius: 10px; padding: 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .card .label { font-size: 0.75rem; text-transform: uppercase; color: var(--muted); letter-spacing: 0.06em; font-weight: 600; }
  .card .value { font-size: 2rem; font-weight: 800; color: var(--accent); margin: 0.2rem 0; }
  .card .detail { font-size: 0.82rem; color: var(--muted); }
  .chart-wrap { background: var(--card); border-radius: 10px; padding: 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); margin-bottom: 1.5rem; }
  .chart-wrap h3 { margin-top: 0; }
  .chart-wrap canvas { max-height: 300px; }
  table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); margin-bottom: 1.5rem; font-size: 0.88rem; }
  th, td { padding: 0.55rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
  th { background: var(--accent); color: #fff; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.03em; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8f9ff; }
  .tag { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
  .tag-high { background: #fee2e2; color: var(--red); }
  .tag-low { background: #d1fae5; color: var(--green); }
  .tag-pos { background: #dbeafe; color: #2563eb; }
  .tag-neg { background: #fef3c7; color: #92400e; }
  .tag-neutral { background: #f3f4f6; color: var(--muted); }
  .milestone-list { list-style: none; }
  .milestone-list li { padding: 0.6rem 0; border-bottom: 1px solid var(--border); display: flex; gap: 0.8rem; align-items: center; }
  .milestone-list li:last-child { border-bottom: none; }
  .milestone-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
  .milestone-date { font-size: 0.8rem; color: var(--muted); min-width: 85px; font-variant-numeric: tabular-nums; }
  .milestone-age { font-size: 0.75rem; color: var(--purple); min-width: 60px; font-weight: 600; }
  .corr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .corr-card { background: var(--card); border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border-left: 4px solid var(--accent); }
  .corr-card .corr-label { font-size: 0.8rem; color: var(--muted); margin-bottom: 0.3rem; }
  .corr-card .corr-value { font-size: 1.6rem; font-weight: 800; }
  .corr-card .corr-desc { font-size: 0.78rem; margin-top: 0.3rem; }
  .change-card { display: flex; align-items: center; gap: 0.8rem; }
  .change-arrow { font-size: 1.5rem; }
  .change-up { color: var(--green); }
  .change-down { color: var(--red); }
  .change-neutral { color: var(--muted); }
  .collapsible { cursor: pointer; user-select: none; }
  .collapsible::after { content: ' ▸'; font-size: 0.9em; }
  .collapsible.open::after { content: ' ▾'; }
  .collapse-content { display: none; }
  .collapse-content.open { display: block; }
  footer { text-align: center; color: var(--muted); font-size: 0.78rem; margin: 3rem 0 1rem; padding: 1rem; border-top: 1px solid var(--border); }
  @media (max-width: 600px) { .grid { grid-template-columns: 1fr 1fr; } .grid-2 { grid-template-columns: 1fr; } .nav { gap: 0.3rem; } }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>Baby Growth Report</h1>
    <p class="subtitle">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &middot; ${this.categorized.days.length} days tracked &middot; ${this.categorized.months.length} months of data</p>
  </header>

  <div class="nav">
    <a href="#overview">Overview</a>
    <a href="#period">Period Comparison</a>
    <a href="#feeding">Feeding</a>
    <a href="#sleep">Sleep</a>
    <a href="#diapers">Diapers</a>
    <a href="#growth">Growth</a>
    <a href="#schedule">Schedule</a>
    <a href="#correlations">Correlations</a>
    <a href="#milestones">Milestones</a>
    <a href="#anomalies">Anomalies</a>
  </div>

  ${this.renderOverviewSection()}
  ${this.renderPeriodComparison()}
  ${this.renderFeedingSection()}
  ${this.renderSleepSection()}
  ${this.renderDiaperSection()}
  ${this.renderGrowthSection()}
  ${this.renderScheduleSection()}
  ${this.renderCorrelationsSection()}
  ${this.renderMilestonesSection()}
  ${this.renderAnomaliesSection()}

  <footer>Data sourced from PiyoLog &middot; Report auto-generated</footer>
</div>

${this.renderScripts()}
</body>
</html>`;
  }

  // ── Overview section ─────────────────────────────────────

  renderOverviewSection() {
    const p = this.patterns;
    const lastMonth = this.categorized.months[this.categorized.months.length - 1];
    const growth = p.growthAnalysis.summary;
    const sched = p.schedulePatterns;

    return `
  <section id="overview">
    <h2><span class="icon">📊</span> Overview</h2>
    <div class="grid">
      <div class="card">
        <div class="label">Days Tracked</div>
        <div class="value">${this.categorized.days.length}</div>
        <div class="detail">${this.categorized.months.length} months of data</div>
      </div>
      <div class="card">
        <div class="label">Current Daily Formula</div>
        <div class="value">${lastMonth ? lastMonth.feeding.avgFormulaMl + 'ml' : 'N/A'}</div>
        <div class="detail">${lastMonth ? lastMonth.feeding.avgSessionCount + ' sessions/day' : ''}</div>
      </div>
      <div class="card">
        <div class="label">Current Daily Sleep</div>
        <div class="value">${lastMonth ? this.fmtMin(lastMonth.sleep.avgTotalMinutes) : 'N/A'}</div>
        <div class="detail">${lastMonth ? this.fmtMin(lastMonth.sleep.avgNapMinutes) + ' naps + ' + this.fmtMin(lastMonth.sleep.avgNightMinutes) + ' night' : ''}</div>
      </div>
      <div class="card">
        <div class="label">Weight Gain</div>
        <div class="value">${growth ? growth.totalGainKg + 'kg' : 'N/A'}</div>
        <div class="detail">${growth ? growth.avgDailyGainG + 'g/day &middot; ' + growth.totalDays + ' days' : ''}</div>
      </div>
      <div class="card">
        <div class="label">Daily Rhythm</div>
        <div class="value" style="font-size:1.4rem">${sched.typicalWakeTime || '?'} &rarr; ${sched.typicalBedTime || '?'}</div>
        <div class="detail">Median wake &rarr; bed</div>
      </div>
    </div>
  </section>`;
  }

  // ── Period Comparison ───────────────────────────────────

  renderPeriodComparison() {
    const pc = this.patterns.periodComparison;
    if (!pc) return '';

    const renderChange = (val, unit, invert) => {
      if (val === null) return '<span class="tag tag-neutral">N/A</span>';
      const isGood = invert ? val < 0 : val > 0;
      const cls = val === 0 ? 'change-neutral' : (isGood ? 'change-up' : 'change-down');
      const arrow = val > 0 ? '↑' : val < 0 ? '↓' : '→';
      return `<span class="${cls}"><span class="change-arrow">${arrow}</span> ${Math.abs(val)}%</span>`;
    };

    return `
  <section id="period">
    <h2><span class="icon">📈</span> Period Comparison</h2>
    <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem">Comparing first half (${pc.early.dateRange.from} to ${pc.early.dateRange.to}) vs second half (${pc.recent.dateRange.from} to ${pc.recent.dateRange.to})</p>
    <table>
      <tr><th>Metric</th><th>Early Period</th><th>Recent Period</th><th>Change</th></tr>
      <tr><td>Formula (ml/day)</td><td>${pc.early.avgFormulaMl}ml</td><td>${pc.recent.avgFormulaMl}ml</td><td>${renderChange(pc.changes.formulaMl, 'ml')}</td></tr>
      <tr><td>Breastfeeding (min/day)</td><td>${pc.early.avgBfMinutes}m</td><td>${pc.recent.avgBfMinutes}m</td><td>${renderChange(pc.changes.bfMinutes, 'm')}</td></tr>
      <tr><td>Feed Sessions</td><td>${pc.early.avgSessions}</td><td>${pc.recent.avgSessions}</td><td>${renderChange(pc.changes.sessions, '')}</td></tr>
      <tr><td>Total Sleep</td><td>${this.fmtMin(pc.early.avgSleepMin)}</td><td>${this.fmtMin(pc.recent.avgSleepMin)}</td><td>${renderChange(pc.changes.sleepMin, '')}</td></tr>
      <tr><td>Longest Stretch</td><td>${this.fmtMin(pc.early.avgLongestStretch)}</td><td>${this.fmtMin(pc.recent.avgLongestStretch)}</td><td>${renderChange(pc.changes.longestStretch, '')}</td></tr>
      <tr><td>Pee Count</td><td>${pc.early.avgPee}</td><td>${pc.recent.avgPee}</td><td>${renderChange(pc.changes.pee, '')}</td></tr>
    </table>
  </section>`;
  }

  // ── Feeding section ─────────────────────────────────────

  renderFeedingSection() {
    const ft = this.patterns.feedingTrends;
    const ms = ft.milestones;
    const milestoneNote = [
      ms.firstFormula ? `First formula: ${ms.firstFormula}` : null,
      ms.firstSolidFood ? `First solids: ${ms.firstSolidFood}` : null,
      ms.lastBreastfeeding ? `Last BF: ${ms.lastBreastfeeding}` : null
    ].filter(Boolean).join(' &middot; ');

    const rows = ft.monthly.map(m =>
      `<tr><td>${m.month}</td><td>${m.avgFormulaMl}ml</td><td>${m.avgBfMinutes}m</td><td>${m.avgTotalMilkMl}ml</td><td>${m.avgSessionCount}</td></tr>`
    ).join('');

    return `
  <section id="feeding">
    <h2><span class="icon">🍼</span> Feeding</h2>
    ${milestoneNote ? `<p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem">${milestoneNote}</p>` : ''}

    <div class="grid-2">
      <div class="chart-wrap"><h3>Monthly Feeding Overview</h3><canvas id="chartFeedingMonthly"></canvas></div>
      <div class="chart-wrap"><h3>Weekly Formula Trend</h3><canvas id="chartFormulaWeekly"></canvas></div>
    </div>
    <div class="grid-2">
      <div class="chart-wrap"><h3>Feeding Interval Trend (minutes between feeds)</h3><canvas id="chartFeedInterval"></canvas></div>
      <div class="chart-wrap"><h3>Feed Sessions per Day</h3><canvas id="chartFeedSessions"></canvas></div>
    </div>

    <h3 class="collapsible" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">Monthly Breakdown</h3>
    <div class="collapse-content">
      <table>
        <tr><th>Month</th><th>Avg Formula</th><th>Avg BF</th><th>Total Milk</th><th>Sessions</th></tr>
        ${rows}
      </table>
    </div>

    <div class="chart-wrap"><h3>Formula vs Sleep (daily scatter)</h3><canvas id="chartFormulaVsSleep"></canvas></div>
  </section>`;
  }

  // ── Sleep section ───────────────────────────────────────

  renderSleepSection() {
    const st = this.patterns.sleepTrends;
    const rows = st.monthly.map(m =>
      `<tr><td>${m.month}</td><td>${this.fmtMin(m.avgTotalMin)}</td><td>${this.fmtMin(m.avgNapMin)}</td><td>${this.fmtMin(m.avgNightMin)}</td><td>${this.fmtMin(m.avgLongestStretch)}</td></tr>`
    ).join('');

    const regText = st.regressions.length > 0
      ? `<div class="card" style="border-left:4px solid var(--red);margin-bottom:1.5rem"><h3 style="margin-top:0;color:var(--red)">Possible Sleep Regressions</h3><ul style="padding-left:1.2rem">${st.regressions.map(r => `<li>Week of ${r.weekStart} (${r.age.months}m${r.age.days}d) — longest stretch dropped <strong>${r.dropPercent}%</strong></li>`).join('')}</ul></div>`
      : '';

    return `
  <section id="sleep">
    <h2><span class="icon">😴</span> Sleep</h2>
    ${regText}

    <div class="grid-2">
      <div class="chart-wrap"><h3>Monthly Sleep (stacked nap + night)</h3><canvas id="chartSleepMonthly"></canvas></div>
      <div class="chart-wrap"><h3>Weekly Longest Sleep Stretch</h3><canvas id="chartLongestStretch"></canvas></div>
    </div>
    <div class="grid-2">
      <div class="chart-wrap"><h3>Nap Count Trend (weekly)</h3><canvas id="chartNapCount"></canvas></div>
      <div class="chart-wrap"><h3>Daily Sleep Distribution</h3><canvas id="chartSleepDaily"></canvas></div>
    </div>

    <h3 class="collapsible" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">Monthly Breakdown</h3>
    <div class="collapse-content">
      <table>
        <tr><th>Month</th><th>Total</th><th>Naps</th><th>Night</th><th>Longest</th></tr>
        ${rows}
      </table>
    </div>
  </section>`;
  }

  // ── Diapers section ─────────────────────────────────────

  renderDiaperSection() {
    const dt = this.patterns.diaperTrends;
    if (!dt || dt.length === 0) return '';

    return `
  <section id="diapers">
    <h2><span class="icon">🧷</span> Diapers</h2>
    <div class="grid-2">
      <div class="chart-wrap"><h3>Weekly Pee &amp; Poop Averages</h3><canvas id="chartDiapers"></canvas></div>
      <div class="chart-wrap"><h3>Day-of-Week Diaper Patterns</h3><canvas id="chartDOWDiapers"></canvas></div>
    </div>
  </section>`;
  }

  // ── Growth section ──────────────────────────────────────

  renderGrowthSection() {
    const g = this.patterns.growthAnalysis;
    if (!g.weights || g.weights.length < 2) return `<section id="growth"><h2><span class="icon">📏</span> Growth</h2><p>Not enough weight data.</p></section>`;

    const rows = g.weights.map(w =>
      `<tr><td>${w.date}</td><td>${w.kg}kg</td><td>${w.dailyGainG != null ? w.dailyGainG + 'g/day' : '—'}</td></tr>`
    ).join('');

    return `
  <section id="growth">
    <h2><span class="icon">📏</span> Growth</h2>
    <div class="grid">
      <div class="card"><div class="label">Birth Weight</div><div class="value">${g.summary.firstWeight.kg}kg</div><div class="detail">${g.summary.firstWeight.date}</div></div>
      <div class="card"><div class="label">Latest Weight</div><div class="value">${g.summary.latestWeight.kg}kg</div><div class="detail">${g.summary.latestWeight.date}</div></div>
      <div class="card"><div class="label">Total Gain</div><div class="value">${g.summary.totalGainKg}kg</div><div class="detail">${g.summary.avgDailyGainG}g/day avg</div></div>
    </div>
    <div class="grid-2">
      <div class="chart-wrap"><h3>Weight Over Time</h3><canvas id="chartWeight"></canvas></div>
      <div class="chart-wrap"><h3>Daily Weight Gain Rate</h3><canvas id="chartWeightGain"></canvas></div>
    </div>
    <h3 class="collapsible" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">All Measurements</h3>
    <div class="collapse-content">
      <table><tr><th>Date</th><th>Weight</th><th>Daily Gain</th></tr>${rows}</table>
    </div>
  </section>`;
  }

  // ── Schedule section ────────────────────────────────────

  renderScheduleSection() {
    const s = this.patterns.schedulePatterns;
    const dow = this.patterns.dayOfWeekPatterns;

    const dowRows = dow ? dow.map(d =>
      `<tr><td>${d.day}</td><td>${d.avgFormulaMl}ml</td><td>${this.fmtMin(d.avgSleepMin)}</td><td>${d.avgPee}</td><td>${d.avgSessions}</td><td>${d.count}</td></tr>`
    ).join('') : '';

    return `
  <section id="schedule">
    <h2><span class="icon">🕐</span> Schedule &amp; Day-of-Week</h2>
    <div class="grid">
      <div class="card"><div class="label">First Feed</div><div class="value">${s.typicalFirstFeed || '?'}</div><div class="detail">Median</div></div>
      <div class="card"><div class="label">Last Feed</div><div class="value">${s.typicalLastFeed || '?'}</div><div class="detail">Median</div></div>
      <div class="card"><div class="label">Wake Time</div><div class="value">${s.typicalWakeTime || '?'}</div><div class="detail">Median</div></div>
      <div class="card"><div class="label">Bedtime</div><div class="value">${s.typicalBedTime || '?'}</div><div class="detail">Median</div></div>
    </div>
    <div class="grid-2">
      <div class="chart-wrap"><h3>Day-of-Week: Formula &amp; Sleep</h3><canvas id="chartDOW"></canvas></div>
      ${dowRows ? `<div>
        <table>
          <tr><th>Day</th><th>Formula</th><th>Sleep</th><th>Pee</th><th>Sessions</th><th>Days</th></tr>
          ${dowRows}
        </table>
      </div>` : ''}
    </div>
  </section>`;
  }

  // ── Correlations section ────────────────────────────────

  renderCorrelationsSection() {
    const c = this.patterns.correlations;
    const labels = {
      formulaVsSleep: 'Formula → Total Sleep',
      totalMilkVsSleep: 'Total Milk → Total Sleep',
      feedingSessionsVsPee: 'Feed Sessions → Pee Count',
      formulaVsLongestStretch: 'Formula → Longest Sleep Stretch'
    };

    const cards = Object.entries(c).map(([key, val]) => {
      if (!val) return '';
      const color = Math.abs(val.r) >= 0.6 ? 'var(--accent)' : Math.abs(val.r) >= 0.4 ? 'var(--purple)' : 'var(--muted)';
      const tagClass = val.r > 0 ? 'tag-pos' : 'tag-neg';
      return `<div class="corr-card" style="border-left-color:${color}">
        <div class="corr-label">${labels[key] || key}</div>
        <div class="corr-value" style="color:${color}">${val.r > 0 ? '+' : ''}${val.r}</div>
        <div class="corr-desc"><span class="tag ${tagClass}">${val.strength} ${val.direction}</span> &middot; n=${val.n}</div>
      </div>`;
    }).join('');

    return `
  <section id="correlations">
    <h2><span class="icon">🔗</span> Correlations</h2>
    <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem">Pearson correlation coefficients between daily metrics. Values closer to ±1 indicate stronger linear relationships.</p>
    <div class="corr-grid">${cards}</div>
    <div class="chart-wrap"><h3>Total Milk vs Total Sleep (scatter)</h3><canvas id="chartScatterMilkSleep"></canvas></div>
  </section>`;
  }

  // ── Milestones section ──────────────────────────────────

  renderMilestonesSection() {
    const items = this.patterns.milestones.map(m => {
      const age = m.age ? `${m.age.months}m${m.age.days}d` : '';
      return `<li><span class="milestone-dot"></span><span class="milestone-date">${m.date}</span><span class="milestone-age">${age}</span><span>${this.escapeHtml(m.label)}</span></li>`;
    }).join('');

    return `
  <section id="milestones">
    <h2><span class="icon">⭐</span> Milestones</h2>
    <div class="card"><ul class="milestone-list">${items}</ul></div>
  </section>`;
  }

  // ── Anomalies section ───────────────────────────────────

  renderAnomaliesSection() {
    const anomalies = this.patterns.anomalies;
    if (anomalies.length === 0) return '';

    // Group by date for better readability
    const byDate = {};
    for (const a of anomalies) {
      if (!byDate[a.date]) byDate[a.date] = [];
      byDate[a.date].push(a);
    }

    const rows = Object.entries(byDate).map(([date, items]) => {
      const metrics = items.map(a => {
        const tagClass = a.direction === 'high' ? 'tag-high' : 'tag-low';
        return `<span class="tag ${tagClass}">${this.escapeHtml(a.metric)}: ${a.value}${a.zScore != null ? ' (z=' + a.zScore + ')' : ''}</span>`;
      }).join(' ');
      return `<tr><td style="white-space:nowrap">${date}</td><td>${metrics}</td></tr>`;
    }).join('');

    return `
  <section id="anomalies">
    <h2><span class="icon">⚠️</span> Anomalies</h2>
    <p style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem">Days where a metric was &gt;2 standard deviations from the mean. ${Object.keys(byDate).length} unusual days detected.</p>
    <div class="chart-wrap"><h3>Anomaly Timeline</h3><canvas id="chartAnomalyTimeline"></canvas></div>
    <h3 class="collapsible" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">Full Anomaly Details (${anomalies.length} flags across ${Object.keys(byDate).length} days)</h3>
    <div class="collapse-content">
      <table>
        <tr><th>Date</th><th>Flagged Metrics</th></tr>
        ${rows}
      </table>
    </div>
  </section>`;
  }

  // ── All Chart Scripts ───────────────────────────────────

  renderScripts() {
    const p = this.patterns;
    const ft = p.feedingTrends;
    const st = p.sleepTrends;
    const g = p.growthAnalysis;
    const dow = p.dayOfWeekPatterns || [];
    const dt = p.diaperTrends || [];
    const daily = p.dailyDetails || [];
    const anomalies = p.anomalies || [];

    return `
<script>
const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } } }, interaction: { intersect: false, mode: 'index' } };
const lineOpts = { ...baseOpts, elements: { point: { radius: 1.5, hoverRadius: 4 }, line: { tension: 0.3, borderWidth: 2 } } };

// ── Feeding Monthly ───────────────────────────────────
new Chart(document.getElementById('chartFeedingMonthly'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(ft.monthly.map(m => m.month))},
    datasets: [
      { label: 'Formula (ml)', data: ${JSON.stringify(ft.monthly.map(m => m.avgFormulaMl))}, backgroundColor: '#4361ee' },
      { label: 'Total Milk (ml)', data: ${JSON.stringify(ft.monthly.map(m => m.avgTotalMilkMl))}, backgroundColor: '#4cc9f0' },
      { label: 'BF (min)', data: ${JSON.stringify(ft.monthly.map(m => m.avgBfMinutes))}, backgroundColor: '#f72585', yAxisID: 'y1' }
    ]
  },
  options: { ...baseOpts, scales: { y: { title: { display: true, text: 'ml' } }, y1: { position: 'right', title: { display: true, text: 'min' }, grid: { drawOnChartArea: false } } } }
});

// ── Weekly Formula Trend ──────────────────────────────
new Chart(document.getElementById('chartFormulaWeekly'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(ft.formulaTrend.map(f => f.weekStart))},
    datasets: [{ label: 'Avg Formula (ml)', data: ${JSON.stringify(ft.formulaTrend.map(f => f.avgFormulaMl))}, borderColor: '#4361ee', backgroundColor: 'rgba(67,97,238,0.08)', fill: true }]
  },
  options: { ...lineOpts, scales: { y: { title: { display: true, text: 'ml' } }, x: { ticks: { maxTicksLimit: 12 } } } }
});

// ── Feeding Interval Trend ────────────────────────────
new Chart(document.getElementById('chartFeedInterval'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(ft.intervalTrend.map(i => i.weekStart))},
    datasets: [{ label: 'Avg Interval (min)', data: ${JSON.stringify(ft.intervalTrend.map(i => i.avgIntervalMin))}, borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.08)', fill: true }]
  },
  options: { ...lineOpts, scales: { y: { title: { display: true, text: 'minutes' } }, x: { ticks: { maxTicksLimit: 12 } } } }
});

// ── Feed Sessions (daily as a line) ───────────────────
new Chart(document.getElementById('chartFeedSessions'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(daily.map(d => d.date))},
    datasets: [{ label: 'Sessions', data: ${JSON.stringify(daily.map(d => d.sessions))}, borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.06)', fill: true, pointRadius: 0.5 }]
  },
  options: { ...lineOpts, scales: { y: { title: { display: true, text: 'sessions' } }, x: { ticks: { maxTicksLimit: 10 } } } }
});

// ── Formula vs Sleep scatter ──────────────────────────
new Chart(document.getElementById('chartFormulaVsSleep'), {
  type: 'scatter',
  data: {
    datasets: [{
      label: 'Formula ml vs Sleep min',
      data: ${JSON.stringify(daily.filter(d => d.formulaMl > 0 && d.sleepMin > 0).map(d => ({ x: d.formulaMl, y: d.sleepMin })))},
      backgroundColor: 'rgba(67,97,238,0.35)', borderColor: '#4361ee', pointRadius: 3
    }]
  },
  options: { ...baseOpts, scales: { x: { title: { display: true, text: 'Formula (ml)' } }, y: { title: { display: true, text: 'Sleep (min)' } } } }
});

// ── Sleep Monthly (stacked) ──────────────────────────
new Chart(document.getElementById('chartSleepMonthly'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(st.monthly.map(m => m.month))},
    datasets: [
      { label: 'Night (hrs)', data: ${JSON.stringify(st.monthly.map(m => Math.round(m.avgNightMin / 60 * 10) / 10))}, backgroundColor: '#3a0ca3' },
      { label: 'Naps (hrs)', data: ${JSON.stringify(st.monthly.map(m => Math.round(m.avgNapMin / 60 * 10) / 10))}, backgroundColor: '#b5179e' }
    ]
  },
  options: { ...baseOpts, scales: { y: { stacked: true, title: { display: true, text: 'hours' } }, x: { stacked: true } } }
});

// ── Longest Stretch (weekly) ─────────────────────────
new Chart(document.getElementById('chartLongestStretch'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(st.weeklyNaps.map(w => w.weekStart))},
    datasets: [{ label: 'Longest Stretch (min)', data: ${JSON.stringify(st.weeklyNaps.map(w => w.avgLongestStretch))}, borderColor: '#3a0ca3', backgroundColor: 'rgba(58,12,163,0.08)', fill: true }]
  },
  options: { ...lineOpts, scales: { y: { title: { display: true, text: 'minutes' } }, x: { ticks: { maxTicksLimit: 12 } } } }
});

// ── Nap Count (weekly) ────────────────────────────────
new Chart(document.getElementById('chartNapCount'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(st.weeklyNaps.map(w => w.weekStart))},
    datasets: [{ label: 'Avg Naps/Day', data: ${JSON.stringify(st.weeklyNaps.map(w => w.avgNapCount))}, borderColor: '#b5179e', backgroundColor: 'rgba(181,23,158,0.08)', fill: true }]
  },
  options: { ...lineOpts, scales: { y: { title: { display: true, text: 'naps' } }, x: { ticks: { maxTicksLimit: 12 } } } }
});

// ── Daily Sleep line ──────────────────────────────────
new Chart(document.getElementById('chartSleepDaily'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(daily.map(d => d.date))},
    datasets: [{ label: 'Total Sleep (min)', data: ${JSON.stringify(daily.map(d => d.sleepMin))}, borderColor: '#6d28d9', backgroundColor: 'rgba(109,40,217,0.06)', fill: true, pointRadius: 0.5 }]
  },
  options: { ...lineOpts, scales: { y: { title: { display: true, text: 'minutes' } }, x: { ticks: { maxTicksLimit: 10 } } } }
});

// ── Diapers (weekly) ──────────────────────────────────
${dt.length > 0 ? `
new Chart(document.getElementById('chartDiapers'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(dt.map(d => d.weekStart))},
    datasets: [
      { label: 'Pee/day', data: ${JSON.stringify(dt.map(d => d.avgPee))}, borderColor: '#0891b2', backgroundColor: 'rgba(8,145,178,0.08)', fill: true },
      { label: 'Poop/day', data: ${JSON.stringify(dt.map(d => d.avgPoop))}, borderColor: '#a16207', backgroundColor: 'rgba(161,98,7,0.08)', fill: true }
    ]
  },
  options: { ...lineOpts, scales: { y: { title: { display: true, text: 'count' } }, x: { ticks: { maxTicksLimit: 12 } } } }
});` : ''}

// ── Day-of-Week Diapers ───────────────────────────────
${dow.length > 0 ? `
new Chart(document.getElementById('chartDOWDiapers'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(dow.map(d => d.day))},
    datasets: [
      { label: 'Avg Pee', data: ${JSON.stringify(dow.map(d => d.avgPee))}, backgroundColor: '#0891b2' },
      { label: 'Avg Sessions', data: ${JSON.stringify(dow.map(d => d.avgSessions))}, backgroundColor: '#059669' }
    ]
  },
  options: baseOpts
});` : ''}

// ── Weight ────────────────────────────────────────────
${g.weights && g.weights.length >= 2 ? `
new Chart(document.getElementById('chartWeight'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(g.weights.map(w => w.date))},
    datasets: [{ label: 'Weight (kg)', data: ${JSON.stringify(g.weights.map(w => w.kg))}, borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.1)', fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#059669' }]
  },
  options: { ...lineOpts, scales: { y: { title: { display: true, text: 'kg' } } }, elements: { point: { radius: 4 } } }
});

new Chart(document.getElementById('chartWeightGain'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(g.weights.filter(w => w.dailyGainG != null).map(w => w.date))},
    datasets: [{
      label: 'g/day',
      data: ${JSON.stringify(g.weights.filter(w => w.dailyGainG != null).map(w => w.dailyGainG))},
      backgroundColor: ${JSON.stringify(g.weights.filter(w => w.dailyGainG != null).map(w => w.dailyGainG >= 0 ? '#059669' : '#dc2626'))}
    }]
  },
  options: { ...baseOpts, scales: { y: { title: { display: true, text: 'g/day' } } } }
});` : ''}

// ── Day-of-Week chart ─────────────────────────────────
${dow.length > 0 ? `
new Chart(document.getElementById('chartDOW'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(dow.map(d => d.day))},
    datasets: [
      { label: 'Avg Formula (ml)', data: ${JSON.stringify(dow.map(d => d.avgFormulaMl))}, backgroundColor: '#4361ee', yAxisID: 'y' },
      { label: 'Avg Sleep (hrs)', data: ${JSON.stringify(dow.map(d => Math.round(d.avgSleepMin / 60 * 10) / 10))}, backgroundColor: '#7c3aed', yAxisID: 'y1' }
    ]
  },
  options: { ...baseOpts, scales: { y: { title: { display: true, text: 'ml' } }, y1: { position: 'right', title: { display: true, text: 'hours' }, grid: { drawOnChartArea: false } } } }
});` : ''}

// ── Milk vs Sleep scatter ─────────────────────────────
new Chart(document.getElementById('chartScatterMilkSleep'), {
  type: 'scatter',
  data: {
    datasets: [{
      label: 'Total Milk (ml) vs Sleep (min)',
      data: ${JSON.stringify(daily.filter(d => d.totalMilkMl > 0 && d.sleepMin > 0).map(d => ({ x: d.totalMilkMl, y: d.sleepMin })))},
      backgroundColor: 'rgba(124,58,237,0.3)', borderColor: '#7c3aed', pointRadius: 3
    }]
  },
  options: { ...baseOpts, scales: { x: { title: { display: true, text: 'Total Milk (ml)' } }, y: { title: { display: true, text: 'Total Sleep (min)' } } } }
});

// ── Anomaly Timeline ──────────────────────────────────
${anomalies.length > 0 ? (() => {
    // Group anomalies by date and count per day
    const anomByDate = {};
    for (const a of anomalies) {
      if (!anomByDate[a.date]) anomByDate[a.date] = { high: 0, low: 0 };
      if (a.direction === 'high') anomByDate[a.date].high++;
      else anomByDate[a.date].low++;
    }
    const dates = Object.keys(anomByDate).sort();
    return `
new Chart(document.getElementById('chartAnomalyTimeline'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(dates)},
    datasets: [
      { label: 'High flags', data: ${JSON.stringify(dates.map(d => anomByDate[d].high))}, backgroundColor: '#dc2626' },
      { label: 'Low flags', data: ${JSON.stringify(dates.map(d => anomByDate[d].low))}, backgroundColor: '#0891b2' }
    ]
  },
  options: { ...baseOpts, scales: { y: { stacked: true, title: { display: true, text: 'flags' }, ticks: { stepSize: 1 } }, x: { stacked: true, ticks: { maxTicksLimit: 15 } } } }
});`;
  })() : ''}

</script>`;
  }

  // ── Helpers ─────────────────────────────────────────────

  fmtMin(min) {
    if (min == null) return '—';
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`;
  }

  escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

// ── Main ────────────────────────────────────────────────────

function main() {
  const dataDir = path.join(__dirname, '..', 'data');

  const patterns = JSON.parse(fs.readFileSync(path.join(dataDir, 'patterns-report.json'), 'utf-8'));
  const categorized = JSON.parse(fs.readFileSync(path.join(dataDir, 'categorized-data.json'), 'utf-8'));

  console.log('Generating report...');
  const generator = new ReportGenerator(patterns, categorized);
  const html = generator.generate();

  const outputPath = path.join(dataDir, 'baby-report.html');
  fs.writeFileSync(outputPath, html);
  console.log(`Report saved to ${outputPath}`);
}

main();
