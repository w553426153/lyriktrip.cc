import Fastify from 'fastify';
import { createPool, parseInclude, parsePageParams } from './db.js';

const PORT = Number(process.env.API_PORT || 3000);

const app = Fastify({
  logger: true,
  trustProxy: true
});

const pool = createPool();

function jsonReply(reply, status, body, extraHeaders = {}) {
  return reply
    .code(status)
    .headers({ 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders })
    .send(body);
}

function getAllowedOrigins() {
  return String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function assertOriginAllowed(request, reply) {
  // Prefer Origin; fall back to Referer for some same-origin requests.
  let origin = request.headers?.origin || '';
  if (!origin) {
    const referer = request.headers?.referer || '';
    try {
      if (referer) origin = new URL(referer).origin;
    } catch {
      // ignore
    }
  }

  const allowed = getAllowedOrigins();
  if (allowed.length === 0) {
    return { ok: false, response: jsonReply(reply, 500, { ok: false, error: 'Server misconfigured: ALLOWED_ORIGINS is not set.' }) };
  }
  if (!origin || !allowed.includes(origin)) {
    return { ok: false, response: jsonReply(reply, 403, { ok: false, error: 'Forbidden origin.' }) };
  }
  return { ok: true, origin };
}

app.get('/healthz', async () => {
  return { ok: true };
});

app.options('/api/feishu', async (request, reply) => {
  const check = assertOriginAllowed(request, reply);
  if (!check.ok) return check.response;
  reply.code(204).headers(corsHeaders(check.origin)).send();
});

app.post('/api/feishu', async (request, reply) => {
  const check = assertOriginAllowed(request, reply);
  if (!check.ok) return check.response;

  const webhook = String(process.env.FEISHU_WEBHOOK_URL || '').trim();
  if (!webhook) {
    return jsonReply(reply, 500, { ok: false, error: 'Server misconfigured: FEISHU_WEBHOOK_URL is not set.' }, corsHeaders(check.origin));
  }

  const contentType = String(request.headers?.['content-type'] || '');

  // Fastify usually parses JSON bodies into an object, but depending on proxy/content-type
  // it can still arrive as a string/buffer. Be defensive so we don't drop fields silently.
  let body = request.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  } else if (body && typeof body === 'object') {
    // If it's a Buffer-like object, attempt to parse it as JSON.
    // (We avoid importing node types; runtime check only.)
    const ctor = body.constructor && typeof body.constructor === 'function' ? body.constructor.name : '';
    if (ctor === 'Buffer' && typeof body.toString === 'function') {
      try {
        body = JSON.parse(body.toString('utf8'));
      } catch {
        body = {};
      }
    }
    // Some setups may pass a Uint8Array (or similar) instead of a Buffer.
    if (ctor === 'Uint8Array') {
      try {
        body = JSON.parse(Buffer.from(body).toString('utf8'));
      } catch {
        body = {};
      }
    }
  }
  if (!body || typeof body !== 'object') body = {};

  const keys = body && typeof body === 'object' ? Object.keys(body).slice(0, 30) : [];

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const wishlist = typeof body.wishlist === 'string' ? body.wishlist.trim() : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    request.log.warn(
      { contentType, bodyType: typeof request.body, parsedKeys: keys, emailType: typeof body.email },
      'Feishu payload invalid email'
    );
    return jsonReply(
      reply,
      400,
      {
        ok: false,
        error: 'Invalid email.',
        debug: {
          contentType,
          bodyType: typeof request.body,
          parsedKeys: keys,
          emailType: typeof body.email,
        },
      },
      corsHeaders(check.origin)
    );
  }
  if (!message) {
    request.log.warn(
      { contentType, bodyType: typeof request.body, parsedKeys: keys, messageType: typeof body.message },
      'Feishu payload missing message'
    );
    return jsonReply(
      reply,
      400,
      {
        ok: false,
        error: 'Message is required.',
        debug: {
          contentType,
          bodyType: typeof request.body,
          parsedKeys: keys,
          messageType: typeof body.message,
        },
      },
      corsHeaders(check.origin)
    );
  }
  if (message.length > 5000 || wishlist.length > 5000) {
    return jsonReply(reply, 413, { ok: false, error: 'Payload too large.' }, corsHeaders(check.origin));
  }

  const upstream = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, email, wishlist }),
  });

  if (!upstream.ok) {
    return jsonReply(
      reply,
      502,
      { ok: false, error: 'Upstream webhook failed.', status: upstream.status },
      corsHeaders(check.origin)
    );
  }

  return jsonReply(reply, 200, { ok: true }, corsHeaders(check.origin));
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

  // Aggregate recommended dishes from the restaurants table (some datasets store one dish per row).
  // We aggregate by (destinationId, name) so the "Recommended Dishes" section is complete.
  const dishesRes = await pool.query(
    `
      SELECT
        COALESCE(ARRAY_AGG(DISTINCT dish ORDER BY dish), ARRAY[]::text[]) AS dishes
      FROM (
        SELECT unnest(COALESCE(recommended_dishes, ARRAY[]::text[])) AS dish
        FROM restaurants
        WHERE destination_id = $1 AND name = $2
      ) t
    `,
    [restaurant.destinationId, restaurant.name]
  );

  restaurant.recommendedDishes = dishesRes.rows[0]?.dishes ?? restaurant.recommendedDishes ?? [];

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
