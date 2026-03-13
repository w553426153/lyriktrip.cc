# Data File Instructions (for PostgreSQL Import)

This project primarily uses "read-only display" without a management backend; therefore, it is recommended to use CSV/JSON files for offline import.

## File List (Supports CSV or JSON)

Priority is given to reading files with the same name in `.csv` format; if not found, it falls back to `.json`.

- `data/destinations.csv` / `data/destinations.json`: Destination list
- `data/attractions.csv` / `data/attractions.json`: Attractions list (each includes destinationId)
- `data/foods.csv` / `data/foods.json`: Food list (each includes destinationId)
- `data/restaurants.csv` / `data/restaurants.json`: Restaurant list (each includes destinationId)
- `data/hotels.csv` / `data/hotels.json`: Hotel list (each includes destinationId)
- `data/routes/*.md`: Route itineraries (Markdown). The filename (without extension) becomes `routes.id`, used for `/api/v1/routes/:id`
  - If `ROUTES_DIR` / `ROUTES_DATA_DIR` is set, it will be used.
  - Otherwise the seed prefers `data/routes`, then falls back to `data_translated/routes` if present.

### Route Markdown (Sightseeing Highlights Images)

In the "Sightseeing Highlights" section, an optional image URL line can be added under each highlight title; during seeding, it will be written into the `image` field of `attraction_nodes.highlights`:

- `Image: https://example.com/spot.jpg`
- `![Image caption](https://example.com/spot.jpg)`

If no image is provided, the seed will attempt to automatically match and fill in the image from the `attractions` data by attraction name.

## CSV Conventions (Default Rules)

- Encoding: UTF-8 (may include BOM)
- First row: Header (header), field names are case-sensitive
- Delimiter: Comma (`,`), supports double-quote escaping
- Array fields: Connected by `|`, e.g., `tags`: `Palace cuisine|World-famous`
- Empty string represents NULL
- `amenities` (for hotels): If needed, it is recommended to place a JSON string inside the cell

## You Currently Have 3 CSV Tables

If you currently only have these three tables, you can still import and run the site:
- `data/attractions.csv` (Attractions table)
- `data/restaurants.csv` (Restaurants table)
- `data/foods.csv` (Foods table)

`destinations` will be automatically generated during import from the "City" field in the attractions table; restaurants and foods will preferentially match to the corresponding destination via "Nearby Attraction".

## Import Method

Execute in the `deploy/` directory (run the import script inside the container):

`docker compose --env-file .env run --rm api node scripts/seed.js`

Note: `deploy/db/schema.sql` will only be executed when the **pgdata volume is first created**. If you modify the schema, you must manually migrate or delete the volume to reinitialize (data will be lost).
