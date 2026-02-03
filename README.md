# baby-ai

This repository contains scripts and a short demo video showing baby progress AI outputs.

## Overview

The `scripts` folder contains various helper scripts used in this project. This README shows how to run those scripts and includes an embedded demo video (baby-progress-ai.mp4) to illustrate the output.

## Prerequisites

- Git installed and configured with push access to the repo
- PowerShell (Windows) or a POSIX shell for running scripts
- Python 3 installed if using Python scripts
- Node.js installed if using Node scripts

## Running scripts

General patterns:

- PowerShell scripts (.ps1):

```powershell
# from the repository root
powershell -ExecutionPolicy Bypass -File .\scripts\your-script.ps1
```

- Python scripts (.py):

```bash
python scripts/your_script.py
```

- Node scripts (npm/node):

```bash
node scripts/yourScript.js
# or if package.json exposes a script
npm run <script-name>
```

Replace `your-script` with the actual filename located in the `scripts` directory.

## Examples

- To list available files in the scripts directory (PowerShell):

```powershell
Get-ChildItem -Path .\scripts -Recurse
```

- To run a Python preprocessing script (example):

```bash
python scripts\preprocess_data.py --input data\raw --output data\processed
```

Adjust flags according to the script's specific CLI options.

## Demo video

The demo video `baby-progress-ai.mp4` is included in the repository. It is embedded below for easy preview on supported platforms (e.g., GitHub renders the HTML5 video element in README files):

<video controls width="640" height="360">
  <source src="./baby-progress-ai.mp4" type="video/mp4">
  Your browser does not support the video tag. You can also download the file directly: [baby-progress-ai.mp4](./baby-progress-ai.mp4)
</video>


## Troubleshooting

- If a script fails with permission errors on Windows, run PowerShell as Administrator or adjust the execution policy for the session.
- If Python modules are missing, create a virtual environment and install dependencies required by the script.

## Contributing

If you add or change scripts, please update this README with examples of usage for the new scripts.

---

*README generated to demonstrate script usage and embed the included demo video.*
