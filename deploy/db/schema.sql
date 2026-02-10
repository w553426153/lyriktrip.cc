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

-- Routes / itinerary planning tables
-- NOTE: this schema file is only applied on first init of the postgres data volume.
-- If you already have a volume, run a migration manually or recreate the volume.

CREATE TABLE IF NOT EXISTS routes (
  id              TEXT PRIMARY KEY,
  route_name      TEXT NOT NULL,
  route_alias     TEXT,
  price           NUMERIC(10,2),
  price_unit      TEXT,
  recommendation  TEXT,
  introduction    TEXT,
  highlights      TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  cover_images    TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  route_overview  TEXT,
  service_content TEXT,
  total_days      INT NOT NULL DEFAULT 1,
  status          SMALLINT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_total_days ON routes(total_days);

CREATE TABLE IF NOT EXISTS route_days (
  id          TEXT PRIMARY KEY,
  route_id    TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  day_number  INT NOT NULL,
  day_title   TEXT,
  day_subtitle TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (route_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_route_days_route_id ON route_days(route_id);

CREATE TABLE IF NOT EXISTS route_nodes (
  id               TEXT PRIMARY KEY,
  day_id           TEXT NOT NULL REFERENCES route_days(id) ON DELETE CASCADE,
  node_order       INT NOT NULL,
  node_type        TEXT NOT NULL CHECK (node_type IN ('transport', 'attraction', 'restaurant')),
  start_time       TIME,
  duration_minutes INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (day_id, node_order)
);

CREATE INDEX IF NOT EXISTS idx_route_nodes_day_id ON route_nodes(day_id);
CREATE INDEX IF NOT EXISTS idx_route_nodes_type ON route_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_route_nodes_order ON route_nodes(day_id, node_order);

CREATE TABLE IF NOT EXISTS transport_nodes (
  node_id          TEXT PRIMARY KEY REFERENCES route_nodes(id) ON DELETE CASCADE,
  from_location    TEXT,
  to_location      TEXT,
  transport_method TEXT,
  route_detail     TEXT,
  cost             NUMERIC(10,2),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_nodes_method ON transport_nodes(transport_method);

CREATE TABLE IF NOT EXISTS attraction_nodes (
  node_id            TEXT PRIMARY KEY REFERENCES route_nodes(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  address            TEXT,
  opening_hours      TEXT,
  ticket_price       TEXT,
  suggested_duration TEXT,
  description        TEXT,
  highlights         JSONB,
  images             TEXT[],
  best_season        TEXT,
  lat                NUMERIC(10,8),
  lng                NUMERIC(11,8),
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attraction_nodes_name ON attraction_nodes(name);
CREATE INDEX IF NOT EXISTS idx_attraction_nodes_location ON attraction_nodes(lat, lng);

CREATE TABLE IF NOT EXISTS restaurant_nodes (
  node_id            TEXT PRIMARY KEY REFERENCES route_nodes(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  address            TEXT,
  avg_cost           NUMERIC(10,2),
  must_eat_rating    INT,
  queue_status       TEXT,
  phone              TEXT,
  business_hours     TEXT,
  background         TEXT,
  recommended_dishes JSONB,
  images             TEXT[],
  lat                NUMERIC(10,8),
  lng                NUMERIC(11,8),
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_nodes_name ON restaurant_nodes(name);
CREATE INDEX IF NOT EXISTS idx_restaurant_nodes_avg_cost ON restaurant_nodes(avg_cost);
CREATE INDEX IF NOT EXISTS idx_restaurant_nodes_rating ON restaurant_nodes(must_eat_rating);
