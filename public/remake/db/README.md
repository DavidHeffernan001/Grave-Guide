# GraveGuide Database Draft

This folder is the first real database plan for the cemetery navigation app.
It is not connected to the prototype yet.

## Files

- `001_initial_schema.sql` creates the relational Postgres schema.
- `002_seed_sligo_town_cemetery.sql` seeds the current Sligo Town Cemetery trial data.

## Main idea

The important split is:

- A cemetery has entrances.
- A cemetery has blocks.
- A block has strips.
- A strip has rows.
- A row has plots.
- A plot can contain zero, one, or many burials.
- Calibration belongs to blocks/plots, not people.

That means the admin can map and calibrate a cemetery before resident records are imported.

## Why this shape

The prototype started with percentage positions because we were visually calibrating over a map.
The real database keeps those calibration values for now, but leaves room for proper latitude and
longitude later.

Blocks store their visual calibration:

- `anchor_x_percent`
- `anchor_y_percent`
- `width_px`
- `height_px`
- `rotation_degrees`
- `cutout_*`
- optional `polygon_points`

Plots store their row/plot identity and optional calibrated position inside the block.

Burials are separate from plots so shared family graves work naturally. Ten people in one plot is
just ten burial records pointing at the same `plot_id`.

## Future connection plan

1. Keep the current JSON prototype working.
2. Create this schema in Supabase/Postgres.
3. Import Sligo trial data.
4. Build read-only API endpoints for visitor search and map loading.
5. Move admin saves from browser/local JSON to database writes.
6. Add admin users, roles, and audit history.
