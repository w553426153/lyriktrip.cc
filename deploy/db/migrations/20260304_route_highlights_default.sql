-- Route itinerary highlights now support object payloads like:
-- [{ "title": "...", "content": "...", "image": "https://..." }]
-- Make sure old rows with NULL are normalized to empty arrays.

ALTER TABLE attraction_nodes
  ALTER COLUMN highlights SET DEFAULT '[]'::jsonb;

UPDATE attraction_nodes
SET highlights = '[]'::jsonb
WHERE highlights IS NULL;

