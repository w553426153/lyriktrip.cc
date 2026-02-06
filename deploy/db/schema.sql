-- LyrikTrip schema (read-only app)
-- This file runs ONLY on first init of the postgres data volume.

CREATE TABLE IF NOT EXISTS destinations (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL,
  long_description  TEXT,
  cover_image_url   TEXT,
  tour_count        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attractions (
  id                 TEXT PRIMARY KEY,
  destination_id     TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  name_zh            TEXT,
  name_en            TEXT,
  province           TEXT,
  city               TEXT,
  district           TEXT,
  region             TEXT,
  address            TEXT,
  lat                NUMERIC(9,6),
  lng                NUMERIC(9,6),
  category           TEXT,
  nearby_transport   TEXT,
  opening_hours      TEXT,
  ticket_price       TEXT,
  ticket_purchase    TEXT,
  suggested_duration TEXT,
  best_visit_date    TEXT,
  introduction       TEXT,
  suitable_for       TEXT[],
  selling_points     TEXT[],
  tags               TEXT[],
  photos             TEXT[],
  image_url          TEXT,
  rating             NUMERIC(2,1),
  reason             TEXT,
  top_review         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attractions_destination_id ON attractions(destination_id);
CREATE INDEX IF NOT EXISTS idx_attractions_destination_rating ON attractions(destination_id, rating DESC);

CREATE TABLE IF NOT EXISTS foods (
  id             TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  restaurant_name    TEXT,
  restaurant_address TEXT,
  phone              TEXT,
  lat                NUMERIC(9,6),
  lng                NUMERIC(9,6),
  nearby_transport   TEXT,
  opening_hours      TEXT,
  must_eat_index     NUMERIC(3,1),
  avg_cost           TEXT,
  queue_status       TEXT,
  nearby_attractions TEXT[],
  price_range    TEXT,
  reviews        INT,
  reason         TEXT,
  top_review     TEXT,
  tags           TEXT[],
  image_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_destination_id ON foods(destination_id);

CREATE TABLE IF NOT EXISTS restaurants (
  id             TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  photo_url      TEXT,
  cuisine_type   TEXT,
  recommended_dishes TEXT[],
  address        TEXT,
  lat            NUMERIC(9,6),
  lng            NUMERIC(9,6),
  nearby_transport TEXT,
  phone            TEXT,
  opening_hours    TEXT,
  must_eat_index   NUMERIC(3,1),
  avg_cost         TEXT,
  queue_status     TEXT,
  nearby_attractions TEXT[],
  price_range    TEXT,
  rating         NUMERIC(2,1),
  tags           TEXT[],
  image_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_destination_id ON restaurants(destination_id);

CREATE TABLE IF NOT EXISTS hotels (
  id             TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  address        TEXT,
  lat            NUMERIC(9,6),
  lng            NUMERIC(9,6),
  star_level     INT,
  price_range    TEXT,
  rating         NUMERIC(2,1),
  amenities      JSONB,
  tags           TEXT[],
  image_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotels_destination_id ON hotels(destination_id);
