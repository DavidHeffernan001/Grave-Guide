# Schema Notes

## Why plots and burials are separate

A grave/plot is a physical place. A burial is a person record.

This allows:

- one plot with one person
- one plot with a husband and wife
- one family plot with many people
- an empty plot that is mapped before any burial record is imported

## How calibration works

Calibration is done at two levels.

Block calibration places the whole block over the real map:

- position
- width and height
- rotation
- cut-out rectangle
- optional irregular polygon

Plot calibration refines points inside the block:

- row number
- plot number
- suggested position
- final calibrated position

The admin should be able to create a block, set strips/rows/plot counts, then press Start Cal.
The system can generate seven helpful calibration anchors from the block shape and row counts.

## Plot sizes

`plots.plot_width_units` allows single and double plots without inventing separate row systems.

Suggested meaning:

- `1` = single plot
- `2` = double plot
- `3` = triple
- `4` = four-plot family grave

The admin can later mark a plot as double/custom and the row spacing calculation can account for it.

## Routing

`route_nodes` and `route_edges` are intentionally simple for now. They will let us model paths,
junctions, entrances, and block entries without depending on OpenStreetMap path data being perfect.

## What is not included yet

Authentication and permissions are not implemented in this draft. When we connect a real backend,
we should add:

- admin users
- organization membership
- role-based access
- row-level security policies
- audit events for every admin edit
