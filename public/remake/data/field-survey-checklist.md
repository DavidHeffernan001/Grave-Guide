# Sligo Town Cemetery Mapping Checklist

Status: draft trial plan.

## Goal

Create a verified cemetery map that can safely guide a visitor from the Cemetery Road / Pearse Road entrance to a selected grave.

## What To Capture On Site

1. Walk the full cemetery boundary and capture a GPS trace.
2. Mark every public entrance and gate.
3. Walk every usable path and capture a GPS trace for each path centre line.
4. Mark path junctions, steps, ramps, locked gates, steep areas, and inaccessible paths.
5. Mark the visible edges of Old Section, Middle Section, and New Section.
6. Capture at least 10 control-point graves with:
   - grave reference
   - photo
   - GPS point
   - section
   - row or nearby row marker if present
7. Check whether phone GPS accuracy is acceptable inside the cemetery. If it drifts more than 3-5 metres, use section/row guidance as the primary instruction and GPS only as a rough marker.

## Council Data Needed

Ask the council for a CSV or spreadsheet with these fields:

- cemetery name
- section
- row
- plot or grave reference
- burial surname
- burial forenames
- date of death or burial date
- grave owner if public/legal to use
- plot coordinates if already digitised
- notes about multiple burials in one grave

## App Data Model

Each grave should resolve to:

- one searchable person record
- one grave record
- one map coordinate or section/row fallback
- one nearest path node
- one visitor route from nearest entrance or current location

## Safety Rule

Do not ship turn-by-turn navigation until the path layer, entrance points, and a sample of grave coordinates have been checked on site.
