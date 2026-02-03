# Timeline Visualization Script - Complete Guide

## Overview

The `generate-timeline.js` script creates **interactive visualizations** and comprehensive trend analysis for your baby log data. It generates an HTML dashboard with multiple charts showing how various metrics change over time.

## What Gets Generated

### 1. **timeline.html** ⭐ (Interactive Dashboard)
Open this file in any web browser to see interactive charts with:

#### Summary Statistics Cards
- **Total Days**: 164 days tracked
- **Age Range**: From 0 months old to 5+ months
- **Breastfeeding Average**: Per-day average for both breasts
- **Sleep Average**: Daily sleep duration in hours

#### Charts & Visualizations

1. **Feeding Trends** (Area Chart)
   - Breastfeeding duration (minutes per day)
   - Formula intake (ml per day)
   - Expressed milk (ml per day)
   - Shows how feeding method evolved over time

2. **Breastfeeding Details** (Dual Line Charts)
   - Left breast duration trends
   - Right breast duration trends
   - Useful for monitoring balance between sides

3. **Sleep Duration** (Line Chart)
   - Hours of sleep per day
   - Visual trend of sleep patterns
   - Highlights variations in sleep

4. **Elimination Patterns** (Dual Bar Charts)
   - Daily pee count trends
   - Daily poop count trends
   - Important health indicator

5. **Weight Progress** (Line Chart)
   - Weight measurements over time
   - Shows growth trajectory
   - Displays in kg

6. **Body Temperature** (Scatter Plot)
   - Temperature readings when available
   - Useful for health monitoring
   - Shows normal vs. elevated temperatures

### 2. **timeline-data.json** (Time Series Data)
Structured daily timeline data with:
```json
{
  "date": "2025-07-21",
  "dayOfWeek": "Mon",
  "ageMonths": 0,
  "ageDays": 4,
  "breastfeedingLeft": 10,
  "breastfeedingRight": 10,
  "breastfeedingTotal": 20,
  "formulaMl": 30,
  "formulaTimes": 1,
  "ebmMl": 0,
  "ebmTimes": 0,
  "pumpingMl": 15,
  "sleepMinutes": 480,
  "peeCount": 2,
  "poopCount": 1,
  "weight": null,
  "temperature": null
}
```

### 3. **timeline-summary.json** (Summary Statistics)
Comprehensive statistics including:
- Date and age ranges
- Breastfeeding averages and maximums
- Formula intake totals
- Pumping totals (20,170 ml across 6 months!)
- Sleep patterns
- Elimination statistics
- Weight gain (3.81 kg!)
- Temperature data

## Usage

### Quick Start
```bash
cd scripts

# Generate the timeline
npm run timeline

# Or generate everything at once
npm run process

# Then open: ../data/timeline.html in your browser
```

### View the Timeline
1. Navigate to `d:\Repos\Meir017\baby-ai\data\timeline.html`
2. Double-click to open in your default browser
3. Interact with charts:
   - Hover over data points for details
   - Click legend items to hide/show datasets
   - Charts are fully responsive

## Key Features

✨ **Interactive Charts**
- Multiple chart types (line, area, bar, scatter)
- Hover tooltips with exact values
- Legend toggle to show/hide data series

🎨 **Beautiful Design**
- Modern gradient background
- Clean, organized layout
- Responsive on all screen sizes
- Professional styling

📊 **Comprehensive Metrics**
- 8+ different visualizations
- Summary statistics at top
- Date range and age tracking
- All key baby care metrics

📱 **Mobile Friendly**
- Works on phones, tablets, desktop
- Responsive grid layout
- Touch-friendly interactions

## Data Quality Notes

### What's Tracked
✅ Feeding (breastfeeding, formula, expressed milk, pumping)
✅ Sleep (duration and patterns)
✅ Elimination (pee and poop counts)
✅ Measurements (weight, body temperature)

### Visualization Tips

1. **Feeding Trends**: Watch the stacked lines to see the transition from exclusive breastfeeding to mixed feeding
2. **Sleep Patterns**: Look for trends - is baby sleeping more as they grow?
3. **Weight Progress**: Should show steady gain, typically 500g-1kg per month for newborns
4. **Elimination**: Healthy indicator - number of wet diapers matters for newborn health
5. **Temperature**: Baseline is ~37°C, spikes may indicate health concerns

## Technical Details

- **Chart Library**: Chart.js 3.9.1 (loaded from CDN)
- **Format**: Self-contained HTML file (no installation needed)
- **File Size**: ~18.5 KB
- **Browser Support**: All modern browsers (Chrome, Firefox, Safari, Edge)

## Updating the Timeline

After logging new data:
1. Update raw data files in `raw-data/`
2. Run `npm run parse` to update JSON data
3. Run `npm run timeline` to regenerate visualizations
4. Refresh `timeline.html` in browser to see updates

## Example Insights from Your Data

Based on the timeline-summary.json:
- **Total tracked**: 164 days (5.5 months)
- **Weight gain**: 3.81 kg (2.58kg → 6.39kg)
- **Total pumping**: 20,170 ml
- **Average daily pumping**: 123 ml
- **Pee average**: ~6 times/day (healthy)
- **Poop average**: ~2 times/day (normal for formula-fed baby)
- **Sleep patterns**: Tracked when available
- **Temperature records**: 8 measurements, all within normal range (36.4-37.5°C)

## Troubleshooting

**Charts not showing?**
- Ensure JavaScript is enabled in your browser
- Try a different browser
- Check that internet connection is available (for Chart.js CDN)

**Data looks incorrect?**
- Re-run `npm run parse` to re-parse raw data
- Verify raw data files are properly formatted
- Check `all-entries.json` to see parsed data

**File won't open?**
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Try right-click → Open With → Choose browser
- Ensure file path has no special characters

## Next Steps

With your timeline data, you can:
1. ✅ Monitor health metrics over time
2. ✅ Spot trends and patterns
3. ✅ Share progress with healthcare providers
4. ✅ Track developmental milestones
5. ✅ Export data for further analysis

---

**Dashboard generated**: Covers 164 days from birth (July 17, 2025) through 5+ months old (December 31, 2025)
