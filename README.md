# baby-ai

Tools to parse, analyze and visualize PiyoLog baby-tracking exports.

This repo contains a small Node.js toolkit (in ./scripts) that converts raw PiyoLog text files (raw-data/*.txt) into structured JSON (data/all-entries.json), exports CSV/HTML/MD views, and generates an interactive timeline (data/timeline.html).

Quick start

Prerequisites:
- Node.js (14+)
- (Windows) PowerShell recommended

Commands (from repository root):

- Optional: install script dependencies
  cd scripts && npm install

- Parse raw logs into JSON
  node ./scripts/parse-logs.js
  # or from scripts/: npm run parse

- Export and generate timeline
  node ./scripts/export-data.js
  node ./scripts/generate-timeline.js
  # or run all: cd scripts && npm run process

What you get
- data/all-entries.json — parsed daily entries
- data/timeline.html — interactive dashboard (open in browser)
- data/baby-log-data.csv / .html / .md — exported tables
- [VIDEO_PLACEHOLDER] Upload the demo video as a repository attachment and name it baby-progress-ai.mp4 if you want scripts or docs to reference it

More details
- For per-script options and examples see: ./scripts/README.md
- Parsing rules and event definitions: PARSED_EVENTS_REFERENCE.md and TIMELINE_GUIDE.md

Troubleshooting
- Ensure raw-data/*.txt exist before parsing.
- If Node scripts fail: cd scripts && npm install, then rerun.
- On Windows, if PowerShell blocks scripts, run: Set-ExecutionPolicy -Scope Process Bypass

Contributing
- Add/update scripts under ./scripts and document usage in ./scripts/README.md. Update PARSED_EVENTS_REFERENCE.md when changing parsing logic.

License: MIT
