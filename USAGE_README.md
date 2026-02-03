# baby-ai — Scripts Usage Guide

This README demonstrates how to use the scripts in the scripts/ folder, explains outputs in data/, and embeds the included demo video `baby-progress-ai.mp4` to show example outputs.

## Quick overview

- Repository root: D:\Repos\Meir017\baby-ai
- Scripts live in: ./scripts
- Processed/exported outputs live in: ./data
- Demo video: ./baby-progress-ai.mp4 (embedded below)

## Prerequisites

- Node.js (14+) installed (used by scripts/*.js)
- Git configured with push access
- PowerShell (Windows) or any terminal to run Node

## Installation

From the repository root run (optional if you want to install local dependencies):

```powershell
cd scripts
npm install
cd ..
```

Note: scripts/package.json exists and may contain helper devDependencies used by project scripts.

## Scripts and usage

All scripts are Node.js scripts located in ./scripts. Run them with `node` from the repository root.

- Parse raw logs into structured JSON

```powershell
node .\scripts\parse-logs.js  # reads raw-data/*.txt and writes parsed output to ./data (all-entries.json etc.)
```

- Query parsed logs (events, day, stats)

```powershell
node .\scripts\query-logs.js events <eventType> <fromDate> <toDate>
# Example: node .\scripts\query-logs.js events vaccine 2025-01-01 2025-12-31

node .\scripts\query-logs.js day <YYYY-MM-DD>
# Example: node .\scripts\query-logs.js day 2025-11-10

node .\scripts\query-logs.js stats <fromDate> <toDate>
# Example: node .\scripts\query-logs.js stats 2025-09-01 2025-09-30
```

- Generate timeline HTML visualization

```powershell
node .\scripts\generate-timeline.js  # produces ./data/timeline.html, timeline-data.json, timeline-summary.json
# Open ./data\timeline.html in a browser to view the interactive timeline
```

- Export data into CSV/HTML/other formats

```powershell
node .\scripts\export-data.js  # reads parsed JSON and writes CSV and other exports into ./data
```

- Diaper / elimination analysis

```powershell
node .\scripts\diaper-analysis.js  # runs analysis on elimination events and writes summary to ./data
```

- Other helper scripts

Inspect ./scripts/package.json and ./scripts/README.md for any additional script-specific flags or options.

## Outputs and where to look

- ./data\all-entries.json — full parsed event list
- ./data\timeline-data.json — time-series used by the visualization
- ./data\timeline-summary.json — aggregated stats used in dashboards
- ./data\baby-log-data.csv / baby-log-data.html — exports for spreadsheet or quick view

## Demo video (embedded)

The short demo video included in this repository demonstrates the timeline and analysis output. GitHub and many Markdown renderers allow embedding HTML5 video tags in READMEs; if embedding is not supported by the viewer, the link below can be used to download or play the file.

<video controls width="640" height="360">
  <source src="./baby-progress-ai.mp4" type="video/mp4">
  Your browser does not support the video tag. Download the demo: [baby-progress-ai.mp4](./baby-progress-ai.mp4)
</video>

## Troubleshooting

- If node scripts fail because of missing modules: `cd scripts && npm install`.
- If PowerShell blocks script execution on Windows, run PowerShell as Administrator and/or use `Set-ExecutionPolicy -Scope Process Bypass` for the session.

## Contributing and extending

- Add new scripts to ./scripts and document usage here.
- When changing parsing or event definitions, update PARSED_EVENTS_REFERENCE.md and TIMELINE_GUIDE.md.

---

This README was generated to provide clear, actionable instructions for running the repository scripts and to demonstrate the output with the included demo video.
