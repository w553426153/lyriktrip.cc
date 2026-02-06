import Fastify from 'fastify';
import { createPool, parseInclude, parsePageParams } from './db.js';

const PORT = Number(process.env.API_PORT || 3000);

const app = Fastify({
  logger: true,
  trustProxy: true
});

const pool = createPool();

app.get('/healthz', async () => {
  return { ok: true };
});

app.get('/api/v1/destinations', async (request, reply) => {
  const { page, pageSize, offset } = parsePageParams(request.query);
  const q = typeof request.query?.q === 'string' ? request.query.q.trim() : '';

  const where = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    where.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*)::int AS count FROM destinations ${whereSql}`;
  const listSql = `
    SELECT
      id,
      name,
      description,
      long_description AS "longDescription",
      cover_image_url AS image,
      tour_count AS "tourCount"
    FROM destinations
    ${whereSql}
    ORDER BY name ASC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const listParams = params.concat([pageSize, offset]);

  const [countRes, listRes] = await Promise.all([
    pool.query(countSql, params),
    pool.query(listSql, listParams)
  ]);

  reply.send({
    page,
    pageSize,
    total: countRes.rows[0]?.count ?? 0,
    items: listRes.rows
  });
});

app.get('/api/v1/destinations/:id', async (request, reply) => {
  const id = String(request.params?.id || '').trim();
  if (!id) return reply.code(400).send({ ok: false, error: 'id is required' });

  const allowed = new Set(['attractions', 'foods', 'restaurants', 'hotels']);
  const include = parseInclude(request.query, allowed, ['attractions', 'foods', 'restaurants', 'hotels']);

  const destRes = await pool.query(
    `
      SELECT
        id,
        name,
        description,
        long_description AS "longDescription",
        cover_image_url AS image,
        tour_count AS "tourCount"
      FROM destinations
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  const destination = destRes.rows[0];
  if (!destination) return reply.code(404).send({ ok: false, error: 'Destination not found' });

  const tasks = [];

  if (include.has('attractions')) {
    tasks.push(
      pool
        .query(
          `
          SELECT
            id,
            name,
            image_url AS image,
            COALESCE(tags, ARRAY[]::text[]) AS tags,
            reason,
            rating,
            top_review AS "topReview",
            name_zh AS "nameZh",
            name_en AS "nameEn",
            region,
            address,
            category,
            nearby_transport AS "nearbyTransport",
            opening_hours AS "openingHours",
            ticket_price AS "ticketPrice",
            ticket_purchase AS "ticketPurchase",
            suggested_duration AS "suggestedDuration",
            best_visit_date AS "bestVisitDate",
            introduction,
            COALESCE(suitable_for, ARRAY[]::text[]) AS "suitableFor",
            COALESCE(selling_points, ARRAY[]::text[]) AS "sellingPoints",
            COALESCE(photos, ARRAY[]::text[]) AS photos
          FROM attractions
          WHERE destination_id = $1
          ORDER BY rating DESC NULLS LAST, name ASC
        `,
          [id]
        )
        .then((r) => ({ key: 'attractions', rows: r.rows }))
    );
  }

  if (include.has('foods')) {
    tasks.push(
      pool
        .query(
          `
          SELECT
            f.id,
            f.name,
            f.image_url AS image,
            COALESCE(f.tags, ARRAY[]::text[]) AS tags,
            f.price_range AS "priceRange",
            f.reviews,
            f.reason,
            f.top_review AS "topReview",
            f.restaurant_name AS "restaurantName",
            f.restaurant_address AS "restaurantAddress",
            rest.id AS "restaurantId"
          FROM foods f
          LEFT JOIN LATERAL (
            SELECT r.id
            FROM restaurants r
            WHERE r.destination_id = f.destination_id
              AND r.name = f.restaurant_name
            ORDER BY
              (r.address IS NOT DISTINCT FROM f.restaurant_address) DESC,
              (r.phone IS NOT DISTINCT FROM f.phone) DESC
            LIMIT 1
          ) rest ON TRUE
          WHERE f.destination_id = $1
          ORDER BY f.reviews DESC NULLS LAST, f.name ASC
        `,
          [id]
        )
        .then((r) => ({ key: 'famousFoods', rows: r.rows }))
    );
  }

  if (include.has('restaurants')) {
    tasks.push(
      pool
        .query(
          `
          SELECT
            id,
            name,
            address,
            lat,
            lng,
            price_range AS "priceRange",
            rating,
            tags,
            image_url AS image
          FROM restaurants
          WHERE destination_id = $1
          ORDER BY rating DESC NULLS LAST, name ASC
        `,
          [id]
        )
        .then((r) => ({ key: 'restaurants', rows: r.rows }))
    );
  }

  if (include.has('hotels')) {
    tasks.push(
      pool
        .query(
          `
          SELECT
            id,
            name,
            address,
            lat,
            lng,
            star_level AS "starLevel",
            price_range AS "priceRange",
            rating,
            amenities,
            tags,
            image_url AS image
          FROM hotels
          WHERE destination_id = $1
          ORDER BY rating DESC NULLS LAST, name ASC
        `,
          [id]
        )
        .then((r) => ({ key: 'hotels', rows: r.rows }))
    );
  }

  const included = await Promise.all(tasks);
  for (const item of included) {
    destination[item.key] = item.rows;
  }

  reply.send(destination);
});

app.get('/api/v1/restaurants/:id', async (request, reply) => {
  const id = String(request.params?.id || '').trim();
  if (!id) return reply.code(400).send({ ok: false, error: 'id is required' });

  const restRes = await pool.query(
    `
      SELECT
        id,
        destination_id AS "destinationId",
        name,
        photo_url AS "photoUrl",
        cuisine_type AS "cuisineType",
        COALESCE(recommended_dishes, ARRAY[]::text[]) AS "recommendedDishes",
        address,
        lat,
        lng,
        nearby_transport AS "nearbyTransport",
        phone,
        opening_hours AS "openingHours",
        must_eat_index AS "mustEatIndex",
        avg_cost AS "avgCost",
        queue_status AS "queueStatus",
        COALESCE(nearby_attractions, ARRAY[]::text[]) AS "nearbyAttractions",
        price_range AS "priceRange",
        rating,
        COALESCE(tags, ARRAY[]::text[]) AS tags,
        image_url AS image
      FROM restaurants
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  const restaurant = restRes.rows[0];
  if (!restaurant) return reply.code(404).send({ ok: false, error: 'Restaurant not found' });

  reply.send(restaurant);
});

// Optional: split-list endpoints (handy for pagination/filtering)
app.get('/api/v1/attractions', async (request, reply) => {
  const destinationId = typeof request.query?.destinationId === 'string' ? request.query.destinationId.trim() : '';
  if (!destinationId) return reply.code(400).send({ ok: false, error: 'destinationId is required' });

  const { page, pageSize, offset } = parsePageParams(request.query);

  const listRes = await pool.query(
    `
      SELECT
        id,
        name,
        image_url AS image,
        COALESCE(tags, ARRAY[]::text[]) AS tags,
        reason,
        rating,
        top_review AS "topReview"
      FROM attractions
      WHERE destination_id = $1
      ORDER BY rating DESC NULLS LAST, name ASC
      LIMIT $2 OFFSET $3
    `,
    [destinationId, pageSize, offset]
  );

  reply.send({ page, pageSize, items: listRes.rows });
});

app.get('/api/v1/foods', async (request, reply) => {
  const destinationId = typeof request.query?.destinationId === 'string' ? request.query.destinationId.trim() : '';
  if (!destinationId) return reply.code(400).send({ ok: false, error: 'destinationId is required' });

  const { page, pageSize, offset } = parsePageParams(request.query);

  const listRes = await pool.query(
    `
      SELECT
        id,
        name,
        image_url AS image,
        COALESCE(tags, ARRAY[]::text[]) AS tags,
        price_range AS "priceRange",
        reviews,
        reason,
        top_review AS "topReview"
      FROM foods
      WHERE destination_id = $1
      ORDER BY reviews DESC NULLS LAST, name ASC
      LIMIT $2 OFFSET $3
    `,
    [destinationId, pageSize, offset]
  );

  reply.send({ page, pageSize, items: listRes.rows });
});

app.addHook('onClose', async () => {
  await pool.end();
});

app
  .listen({ port: PORT, host: '0.0.0.0' })
  .catch((err) => {
    app.log.error(err, 'Failed to start server');
    process.exit(1);
  });
