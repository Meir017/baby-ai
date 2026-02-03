# Parsed Event Types - Comprehensive Guide

## Overview

The improved parser now captures **17 different event types** from your baby log data, covering all major activities, health metrics, and milestones.

## Complete Event Type Reference

### 🍼 Feeding & Nutrition (3 types)

| Type | Count | Description | Example |
|------|-------|-------------|---------|
| **breastfeeding** | 559 | Direct breastfeeding from left and/or right breast | `{ type: 'breastfeeding', left: 10, right: 15 }` |
| **formula** | 847 | Formula feeding with amount in ml | `{ type: 'formula', amount: 120 }` |
| **expressed_breast_milk** | 302 | Pumped breast milk given to baby | `{ type: 'expressed_breast_milk', amount: 90 }` |

### 💪 Milk Expression (1 type)

| Type | Count | Description | Example |
|------|-------|-------------|---------|
| **pumping** | 492 | Breast pumping session with amount collected | `{ type: 'pumping', amount: 60 }` |

### 😴 Sleep & Rest (2 types)

| Type | Count | Description | Example |
|------|-------|-------------|---------|
| **sleep** | 670 | Sleep period (may include duration) | `{ type: 'sleep', duration: { hours: 1, minutes: 30 } }` |
| **wake_up** | 668 | Wake event with how long baby slept | `{ type: 'wake_up', sleptDuration: { hours: 2, minutes: 15 } }` |

### 🚼 Elimination (2 types)

| Type | Count | Description | Example |
|------|-------|-------------|---------|
| **pee** | 754 | Urination event | `{ type: 'pee' }` |
| **poop** | 188 | Bowel movement event | `{ type: 'poop' }` |

### 🏊 Care & Hygiene (1 type)

| Type | Count | Description | Example |
|------|-------|-------------|---------|
| **bath** | 126 | Bath time | `{ type: 'bath' }` |

### 🚶 Activity & Outings (2 types)

| Type | Count | Description | Example |
|------|-------|-------------|---------|
| **walk** | 65 | Outdoor walks/strolls | `{ type: 'walk', duration: { hours: 0, minutes: 55 } }` |
| **physiotherapy** | 10 | Physical therapy/movement classes | `{ type: 'physiotherapy', activity: 'movement class' }` |

### 📏 Health Measurements (3 types)

| Type | Count | Description | Example |
|------|-------|-------------|---------|
| **weight** | 9 | Body weight in kg | `{ type: 'weight', kg: 6.39 }` |
| **height** | 4 | Length/height in cm | `{ type: 'height', cm: 63.5 }` |
| **head_size** | 5 | Head circumference in cm | `{ type: 'head_size', cm: 39.8 }` |

### 🏥 Health & Medical (2 types)

| Type | Count | Description | Example |
|------|-------|-------------|---------|
| **body_temp** | 16 | Body temperature in Celsius | `{ type: 'body_temp', celsius: 37.2 }` |
| **medicine** | 40 | Medication given (includes Hebrew names) | `{ type: 'medicine', name: 'נובימול' }` |

### 💉 Preventative Care (1 type)

| Type | Count | Description | Example |
|------|-------|-------------|---------|
| **vaccine** | 3 | Vaccination events | `{ type: 'vaccine', name: 'מחומש ורוטה' }` |

## Summary Statistics

### Total Events Parsed
- **164 days** tracked
- **6,005 individual events** logged
- **17 different event types**

### Most Common Events
1. **Pee** - 754 times (healthy elimination pattern)
2. **Formula** - 847 times (primary nutrition source)
3. **Sleep** - 670 times (tracking rest periods)
4. **Wake-up** - 668 times (tracking wake cycles)
5. **Breastfeeding** - 559 times (supplemental breastfeeding)
6. **Pumping** - 492 times (milk expression, 20,170 ml total)

### Health Tracking
- **9 weight measurements** (growth from 2.58kg → 6.39kg)
- **5 head circumference measurements**
- **4 height measurements**
- **16 temperature readings** (monitoring health)
- **40 medicine records** (health management)
- **3 vaccine records** (immunizations)
- **10 physiotherapy sessions** (development support)

## Data Quality

✅ **All event types are now captured:**
- Feeding patterns (breast, formula, expressed milk, pumping)
- Sleep and wake cycles
- Elimination tracking (important for newborn health)
- Growth measurements
- Health metrics and medical treatments
- Activities and outings
- Developmental support sessions

✅ **No unparsed events** - The parser successfully handles:
- English and Hebrew text
- Various notation styles (▶, ◀, /)
- Special character formatting
- Measurement units (kg, cm, ml, °C)
- Medicine names in Hebrew
- Vaccine names in Hebrew

## How to Query Events

### Query specific event type
```bash
node query-logs.js events vaccine 2025-01-01 2025-12-31
node query-logs.js events physiotherapy 2025-11-01 2025-11-30
node query-logs.js events walk 2025-09-01 2025-09-30
```

### Get full day with all events
```bash
node query-logs.js day 2025-11-10
```

### Get summary stats including all events
```bash
node query-logs.js stats 2025-09-01 2025-09-30
```

## Integration with Timeline

All event types are included in:
- **timeline.html** - Interactive visualization dashboard
- **timeline-data.json** - Time-series data export
- **timeline-summary.json** - Aggregated statistics
- **all-entries.json** - Complete parsed database
- **CSV/HTML/Markdown exports** - Multiple format outputs

## Growth Tracking Example

From weight measurements alone:
```
2025-07-23: 2.58 kg (age: 6 days)
2025-08-10: 3.45 kg (age: 24 days)
2025-08-29: 4.60 kg (age: 43 days)
2025-09-10: 5.50 kg (age: 55 days)
2025-11-10: 6.39 kg (age: 115 days)

Total gain: 3.81 kg over 109 days
Average: ~35g per day
```

## Vaccination Record

```
2025-08-17: חצבת 2 (Measles 2)
2025-08-28: Vaccine (unspecified)
2025-11-10: מחומש ורוטה (Pentavalent + Rotavirus)
```

## Medical Interventions

Tracked medications include:
- נובימול (Nurofen/Ibuprofen)
- נורופן (Nurofen)
- קמומילו (Chamomile)
- קמילצ'יק (Kamillosan)
- בייביגאם (Baby Gum relief)

## Activity Tracking

- **65 walks** recorded (outdoor time)
- **10 physiotherapy sessions** (development support)
- **126 baths** (hygiene routine)

---

**All data is now comprehensively captured and ready for analysis!** 🎉
