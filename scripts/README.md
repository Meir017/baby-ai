# Baby Log Data Processing Scripts

Scripts to parse, analyze, and export PiyoLog baby tracking data from raw text files into structured, queryable formats.

## Overview

This toolkit converts raw PiyoLog baby tracking logs into structured JSON data and provides tools for analysis and export to various formats (CSV, HTML, Markdown).

### Data Pipeline

```
Raw Text Files → Parse → Structured JSON → Query/Analyze → Export (CSV/HTML/MD)
  (raw-data/)                             (data/)          
```

## Scripts

### 1. `parse-logs.js` - Data Parser

**Purpose:** Convert raw PiyoLog text files into structured JSON format

**Usage:**
```bash
npm run parse
# or
node parse-logs.js
```

**Output Files:**
- `data/all-entries.json` - Complete daily entries with all events and summaries
- `data/monthly-summaries.json` - Entries grouped by month

**Data Structure:**

Each entry contains:
- `date` - ISO date (YYYY-MM-DD)
- `dayOfWeek` - Day name
- `age` - Months and days old
- `events` - Array of timestamped events
- `summary` - Aggregated daily statistics

#### Event Types Parsed:

- **breastfeeding** - Time on left/right breast (minutes)
- **formula** - Formula amount (ml)
- **expressed_breast_milk** - Pumped milk (ml)
- **pumping** - Pumping session (ml)
- **sleep** - Sleep with optional duration
- **wake_up** - Wake event with sleep duration
- **pee** - Bathroom activity
- **poop** - Bowel movement
- **bath** - Bath time
- **walk** - Outdoor activities
- **body_temp** - Temperature reading
- **weight** - Weight measurement
- **medicine** - Medication given

#### Summary Fields:

Each day includes summary totals:
- `breastfeeding` - {left, right} minutes
- `formula` - {times fed, total ml}
- `expressedBreastMilk` - {times pumped, total ml}
- `sleep` - {hours, minutes}
- `pee` - Number of times
- `poop` - Number of times

### 2. `query-logs.js` - Data Analyzer

**Purpose:** Query and analyze the structured data

**Usage:**
```bash
# Summary statistics for a date range
node query-logs.js stats 2025-09-01 2025-09-30

# Get feeding pattern for a specific day
node query-logs.js feeding 2025-09-15

# Get sleep schedule for a day
node query-logs.js sleep 2025-09-15

# Get complete report for a day
node query-logs.js day 2025-09-15

# Get all events of a specific type in date range
node query-logs.js events breastfeeding 2025-09-01 2025-09-30
```

**Available Queries:**

| Command | Arguments | Description |
|---------|-----------|-------------|
| `stats` | `[startDate] [endDate]` | Get summary statistics |
| `feeding` | `<date>` | Get feeding pattern for a day |
| `sleep` | `<date>` | Get sleep schedule for a day |
| `day` | `<date>` | Get complete day report |
| `events` | `<type> [startDate] [endDate]` | Get all events of type |

**Date Format:** YYYY-MM-DD

**Event Types:** breastfeeding, formula, expressed_breast_milk, pumping, sleep, wake_up, pee, poop, bath, walk, body_temp, weight, medicine

### 3. `export-data.js` - Data Exporter

**Purpose:** Export structured data to various formats

**Usage:**
```bash
npm run export
# or
node export-data.js
```

**Output Files:**

- `data/baby-log-data.csv` - Spreadsheet-friendly format
- `data/baby-log-data.html` - Interactive HTML table
- `data/baby-log-data.md` - Markdown table format

### 4. `generate-timeline.js` - Timeline Visualizer

**Purpose:** Generate interactive visualizations and trend analysis

**Usage:**
```bash
npm run timeline
# or
node generate-timeline.js
```

**Output Files:**

- `data/timeline.html` - **Interactive dashboard with charts** ⭐
  - Feeding trends (breastfeeding, formula, expressed milk)
  - Breastfeeding comparison (left vs right)
  - Sleep duration trends
  - Elimination patterns (pee/poop counts)
  - Weight progress tracking
  - Body temperature timeline
  
- `data/timeline-data.json` - Time series data for each day
- `data/timeline-summary.json` - Comprehensive statistics and summaries

**Features:**
- 📊 Multiple chart types (line, area, bar, scatter)
- 📈 Visual trend analysis
- 🎨 Responsive design with dark mode
- 📱 Mobile-friendly interface
- 🔢 Summary statistics cards at the top

## Usage Examples

### Full Data Processing Pipeline

```bash
cd scripts

# 1. Parse all raw data files
npm run parse

# 2. Export to multiple formats
npm run export

# 3. Generate interactive timeline
npm run timeline

# Or do all in one command
npm run export && npm run timeline
```

**Then open `data/timeline.html` in your browser to view the interactive dashboard!**

### Analyze September Data

```bash
node query-logs.js stats 2025-09-01 2025-09-30
```

**Output:**
```json
{
  "totalDays": 13,
  "totalBreastfeedingMinutes": { "left": 423, "right": 478 },
  "totalFormula": { "times": 73, "ml": 4890 },
  "totalExpressionMilk": { "times": 31, "ml": 2110 },
  "totalSleep": { "hours": 164, "minutes": 35 },
  "averageBreastfeedingPerDay": { "left": "32.5", "right": "36.8" },
  "averageSleepPerDay": { "hours": 12, "minutes": 38 },
  ...
}
```

### Check Daily Feeding Pattern

```bash
node query-logs.js feeding 2025-09-15
```

**Output:**
```json
[
  { "time": "05:20", "type": "breastfeeding", "left": 10, "right": 20 },
  { "time": "06:00", "type": "formula", "amount": 80 },
  { "time": "09:30", "type": "pumping", "amount": 60 },
  ...
]
```

### Generate Day Report

```bash
node query-logs.js day 2025-09-15
```

Returns complete data for a single day including timeline and summary.

### Export to Spreadsheet

```bash
node export-data.js
```

Creates:
- `baby-log-data.csv` - Open in Excel/Google Sheets
- `baby-log-data.html` - View in browser
- `baby-log-data.md` - Markdown table format

## Data Quality Notes

### Parsing Handles:
- ✅ Multiple date formats and month names
- ✅ Hebrew text and special characters
- ✅ Duration formats (e.g., "9h15m", "0h50m")
- ✅ Breastfeeding notation (L/R sides, minutes)
- ✅ Volume measurements (ml)
- ✅ Medical readings (temperature, weight)
- ✅ Daily summary statistics

### Known Limitations:
- Some Hebrew-only entries are logged but not fully parsed
- Comments and notes are stripped from entries
- Volume amounts in parentheses are parsed from main value

## File Structure

```
baby-ai/
├── raw-data/              # Raw PiyoLog text files
│   ├── 2025-07.txt
│   ├── 2025-08.txt
│   └── ...
├── data/                  # Processed structured data
│   ├── all-entries.json                # Complete parsed entries
│   ├── monthly-summaries.json          # Data grouped by month
│   ├── baby-log-data.csv               # Spreadsheet format
│   ├── baby-log-data.html              # Data table view
│   ├── baby-log-data.md                # Markdown table
│   ├── timeline.html                   # Interactive dashboard ⭐
│   ├── timeline-data.json              # Time series data
│   └── timeline-summary.json           # Statistics & summaries
└── scripts/               # Processing scripts
    ├── parse-logs.js
    ├── query-logs.js
    ├── export-data.js
    ├── generate-timeline.js
    ├── package.json
    └── README.md
```

## Tips for Analysis

### Monthly Comparisons
```bash
# Get stats for each month
node query-logs.js stats 2025-07-01 2025-07-31
node query-logs.js stats 2025-08-01 2025-08-31
```

### Track Feeding Trends
```bash
# Export to CSV and use spreadsheet software for charting
node export-data.js
# Open baby-log-data.csv in Excel/Google Sheets
```

### Sleep Pattern Analysis
```bash
# Examine multiple days
node query-logs.js sleep 2025-09-10
node query-logs.js sleep 2025-09-11
node query-logs.js sleep 2025-09-12
```

## Requirements

- Node.js (v12 or higher)
- No external dependencies required (uses only Node.js built-in modules)

## License

MIT
