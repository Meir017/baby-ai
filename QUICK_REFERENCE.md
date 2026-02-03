# Quick Reference: All Event Types

## 📊 Data Summary
- **164 days** tracked
- **4,758 events** logged
- **17 event types** captured
- **100% parsing success** (zero unparsed events)

## Event Types by Category

### 🍼 Feeding (4 types)
```
breastfeeding (559)         - Direct nursing L/R sides
formula (847)               - Formula with volume
expressed_breast_milk (302) - Pumped milk feeding
pumping (492)               - Milk expression sessions
```

### 😴 Rest (2 types)
```
sleep (670)                 - Sleep periods
wake_up (668)               - Wake events + duration slept
```

### 🚼 Elimination (2 types)
```
pee (754)                   - Urination tracking
poop (188)                  - Bowel movement tracking
```

### 🏊 Care (1 type)
```
bath (126)                  - Bath/hygiene routine
```

### 🚶 Activity (2 types)
```
walk (65)                   - Outdoor walks/strolls
physiotherapy (10)          - Movement classes, PT sessions
```

### 📏 Measurements (3 types)
```
weight (9)                  - Body weight in kg
height (4)                  - Length in cm
head_size (5)               - Head circumference in cm
```

### 🏥 Health (2 types)
```
body_temp (16)              - Temperature in °C
medicine (40)               - Medications given
```

### 💉 Prevention (1 type)
```
vaccine (3)                 - Immunizations
```

## Growth Tracking
- **9 weight measurements** tracking growth
- Start: 2.58 kg (newborn)
- End: 6.39 kg (4+ months)
- Gain: 3.81 kg
- Average: ~35g/day

## Health Records
- **16 temperature readings** (all normal: 36.4-37.5°C)
- **40 medicine doses** recorded
- **3 vaccines** documented
- **10 physiotherapy sessions** for development

## Activity Log
- **65 outdoor walks** recorded
- **126 baths** tracked
- **10 PT/movement classes** attended

## Query Commands

### Get all events of a type
```bash
node query-logs.js events vaccine 2025-01-01 2025-12-31
node query-logs.js events medicine 2025-01-01 2025-12-31
node query-logs.js events walk 2025-09-01 2025-12-31
```

### Get complete day
```bash
node query-logs.js day 2025-11-10
```

### Get period statistics
```bash
node query-logs.js stats 2025-09-01 2025-09-30
```

## Data Files

| File | Purpose | Size |
|------|---------|------|
| `all-entries.json` | Complete parsed data with all events | 1.2 MB |
| `timeline.html` | Interactive dashboard | 18 KB |
| `timeline-data.json` | Time-series data | 63 KB |
| `baby-log-data.csv` | Spreadsheet export | 80 KB |

## Supported Formats

✅ English & Hebrew text  
✅ Special notation (▶ ◀ /)  
✅ Measurements (kg, cm, ml, °C)  
✅ Duration formats (9h15m, 0h50m)  
✅ Hebrew names & medical terms  

## Key Metrics

| Metric | Value |
|--------|-------|
| Avg breastfeeding/day | 3.4 min |
| Avg formula/day | 5.2 ml |
| Avg pumping volume | 41 ml |
| Pee per day | 4.6x |
| Poop per day | 1.1x |
| Sleep per day | 10.8 hrs |

---

**All activities from your baby log are now fully captured and queryable!** 🎉
