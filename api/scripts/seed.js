import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import { parse as parseCsv } from 'csv-parse/sync';

const { Pool } = pg;

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function sha1Hex(input) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

function makeId(prefix, stableKey) {
  return `${prefix}_${sha1Hex(`${prefix}:${stableKey}`).slice(0, 12)}`;
}

function toNumberOrNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function splitMulti(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);
  const s = String(v).trim();
  if (!s) return null;
  const parts = s
    .split(/[\|\n\r,，;；、]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

function toTextArray(v) {
  return splitMulti(v);
}

function toJson(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v;
  const s = String(v).trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    throw new Error(`Invalid JSON value: ${s.slice(0, 120)}`);
  }
}

async function loadJson(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function loadCsv(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return parseCsv(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true
  });
}

async function loadData(dataDir, baseName) {
  const csvPath = path.join(dataDir, `${baseName}.csv`);
  const jsonPath = path.join(dataDir, `${baseName}.json`);

  try {
    await access(csvPath);
    return await loadCsv(csvPath);
  } catch {
    // ignore
  }

  return await loadJson(jsonPath);
}

async function loadDataOptional(dataDir, baseName) {
  const csvPath = path.join(dataDir, `${baseName}.csv`);
  const jsonPath = path.join(dataDir, `${baseName}.json`);
  try {
    await access(csvPath);
    return await loadCsv(csvPath);
  } catch {
    // ignore
  }
  try {
    await access(jsonPath);
    return await loadJson(jsonPath);
  } catch {
    // ignore
  }
  return [];
}

async function upsertDestination(pool, d) {
  await pool.query(
    `
    INSERT INTO destinations (id, name, description, long_description, cover_image_url, tour_count)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      long_description = EXCLUDED.long_description,
      cover_image_url = EXCLUDED.cover_image_url,
      tour_count = EXCLUDED.tour_count,
      updated_at = NOW()
  `,
    [d.id, d.name, d.description || '', d.longDescription || null, d.image || null, Number(d.tourCount || 0)]
  );
}

async function upsertAttraction(pool, a) {
  await pool.query(
    `
    INSERT INTO attractions (
      id, destination_id, name, name_zh, name_en, province, city, district, region, address, lat, lng, category, nearby_transport,
      opening_hours, ticket_price, ticket_purchase, suggested_duration, best_visit_date,
      introduction, suitable_for, selling_points, tags, photos, image_url, rating, reason, top_review
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
      $15,$16,$17,$18,$19,
      $20,$21,$22,$23,$24,$25,$26,$27,$28
    )
    ON CONFLICT (id) DO UPDATE SET
      destination_id = EXCLUDED.destination_id,
      name = EXCLUDED.name,
      name_zh = EXCLUDED.name_zh,
      name_en = EXCLUDED.name_en,
      province = EXCLUDED.province,
      city = EXCLUDED.city,
      district = EXCLUDED.district,
      region = EXCLUDED.region,
      address = EXCLUDED.address,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      category = EXCLUDED.category,
      nearby_transport = EXCLUDED.nearby_transport,
      opening_hours = EXCLUDED.opening_hours,
      ticket_price = EXCLUDED.ticket_price,
      ticket_purchase = EXCLUDED.ticket_purchase,
      suggested_duration = EXCLUDED.suggested_duration,
      best_visit_date = EXCLUDED.best_visit_date,
      introduction = EXCLUDED.introduction,
      suitable_for = EXCLUDED.suitable_for,
      selling_points = EXCLUDED.selling_points,
      tags = EXCLUDED.tags,
      photos = EXCLUDED.photos,
      image_url = EXCLUDED.image_url,
      rating = EXCLUDED.rating,
      reason = EXCLUDED.reason,
      top_review = EXCLUDED.top_review,
      updated_at = NOW()
  `,
    [
      a.id,
      a.destinationId,
      a.name,
      a.nameZh || null,
      a.nameEn || null,
      a.province || null,
      a.city || null,
      a.district || null,
      a.region || null,
      a.address || null,
      a.lat != null ? Number(a.lat) : null,
      a.lng != null ? Number(a.lng) : null,
      a.category || null,
      a.nearbyTransport || null,
      a.openingHours || null,
      a.ticketPrice || null,
      a.ticketPurchase || null,
      a.suggestedDuration || null,
      a.bestVisitDate || null,
      a.introduction || null,
      toTextArray(a.suitableFor),
      toTextArray(a.sellingPoints),
      toTextArray(a.tags),
      toTextArray(a.photos),
      a.image || null,
      a.rating != null ? Number(a.rating) : null,
      a.reason || null,
      a.topReview || null
    ]
  );
}

async function upsertFood(pool, f) {
  await pool.query(
    `
    INSERT INTO foods (
      id, destination_id, name,
      restaurant_name, restaurant_address, phone, lat, lng, nearby_transport, opening_hours,
      must_eat_index, avg_cost, queue_status, nearby_attractions,
      price_range, reviews, reason, top_review, tags, image_url
    )
    VALUES (
      $1,$2,$3,
      $4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,
      $15,$16,$17,$18,$19,$20
    )
    ON CONFLICT (id) DO UPDATE SET
      destination_id = EXCLUDED.destination_id,
      name = EXCLUDED.name,
      restaurant_name = EXCLUDED.restaurant_name,
      restaurant_address = EXCLUDED.restaurant_address,
      phone = EXCLUDED.phone,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      nearby_transport = EXCLUDED.nearby_transport,
      opening_hours = EXCLUDED.opening_hours,
      must_eat_index = EXCLUDED.must_eat_index,
      avg_cost = EXCLUDED.avg_cost,
      queue_status = EXCLUDED.queue_status,
      nearby_attractions = EXCLUDED.nearby_attractions,
      price_range = EXCLUDED.price_range,
      reviews = EXCLUDED.reviews,
      reason = EXCLUDED.reason,
      top_review = EXCLUDED.top_review,
      tags = EXCLUDED.tags,
      image_url = EXCLUDED.image_url,
      updated_at = NOW()
  `,
    [
      f.id,
      f.destinationId,
      f.name,
      f.restaurantName || null,
      f.restaurantAddress || null,
      f.phone || null,
      f.lat != null ? Number(f.lat) : null,
      f.lng != null ? Number(f.lng) : null,
      f.nearbyTransport || null,
      f.openingHours || null,
      f.mustEatIndex != null ? Number(f.mustEatIndex) : null,
      f.avgCost || null,
      f.queueStatus || null,
      toTextArray(f.nearbyAttractions),
      f.priceRange || null,
      f.reviews != null ? Number(f.reviews) : null,
      f.reason || null,
      f.topReview || null,
      toTextArray(f.tags) || [],
      f.image || null
    ]
  );
}

async function upsertRestaurant(pool, r) {
  await pool.query(
    `
    INSERT INTO restaurants (
      id, destination_id, name, photo_url, cuisine_type, recommended_dishes,
      address, lat, lng, nearby_transport, phone, opening_hours,
      must_eat_index, avg_cost, queue_status, nearby_attractions,
      price_range, rating, tags, image_url
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,
      $7,$8,$9,$10,$11,$12,
      $13,$14,$15,$16,
      $17,$18,$19,$20
    )
    ON CONFLICT (id) DO UPDATE SET
      destination_id = EXCLUDED.destination_id,
      name = EXCLUDED.name,
      photo_url = EXCLUDED.photo_url,
      cuisine_type = EXCLUDED.cuisine_type,
      recommended_dishes = EXCLUDED.recommended_dishes,
      address = EXCLUDED.address,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      nearby_transport = EXCLUDED.nearby_transport,
      phone = EXCLUDED.phone,
      opening_hours = EXCLUDED.opening_hours,
      must_eat_index = EXCLUDED.must_eat_index,
      avg_cost = EXCLUDED.avg_cost,
      queue_status = EXCLUDED.queue_status,
      nearby_attractions = EXCLUDED.nearby_attractions,
      price_range = EXCLUDED.price_range,
      rating = EXCLUDED.rating,
      tags = EXCLUDED.tags,
      image_url = EXCLUDED.image_url,
      updated_at = NOW()
  `,
    [
      r.id,
      r.destinationId,
      r.name,
      r.photo || null,
      r.cuisineType || null,
      toTextArray(r.recommendedDishes),
      r.address || null,
      r.lat != null ? Number(r.lat) : null,
      r.lng != null ? Number(r.lng) : null,
      r.nearbyTransport || null,
      r.phone || null,
      r.openingHours || null,
      r.mustEatIndex != null ? Number(r.mustEatIndex) : null,
      r.avgCost || null,
      r.queueStatus || null,
      toTextArray(r.nearbyAttractions),
      r.priceRange || null,
      r.rating != null ? Number(r.rating) : null,
      toTextArray(r.tags) || [],
      r.image || r.photo || null
    ]
  );
}

async function upsertHotel(pool, h) {
  await pool.query(
    `
    INSERT INTO hotels (
      id, destination_id, name, address, lat, lng, star_level, price_range, rating, amenities, tags, image_url
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (id) DO UPDATE SET
      destination_id = EXCLUDED.destination_id,
      name = EXCLUDED.name,
      address = EXCLUDED.address,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      star_level = EXCLUDED.star_level,
      price_range = EXCLUDED.price_range,
      rating = EXCLUDED.rating,
      amenities = EXCLUDED.amenities,
      tags = EXCLUDED.tags,
      image_url = EXCLUDED.image_url,
      updated_at = NOW()
  `,
    [
      h.id,
      h.destinationId,
      h.name,
      h.address || null,
      h.lat != null ? Number(h.lat) : null,
      h.lng != null ? Number(h.lng) : null,
      h.starLevel != null ? Number(h.starLevel) : null,
      h.priceRange || null,
      h.rating != null ? Number(h.rating) : null,
      toJson(h.amenities),
      toTextArray(h.tags),
      h.image || null
    ]
  );
}

function normalizeAttractions(rows) {
  const out = [];
  for (const row of rows) {
    const nameZh = row['景点名称（中文）'] || '';
    const nameEn = row['景点名称（英文）'] || '';
    const province = row['省'] || '';
    const city = row['市'] || '';
    const district = row['区'] || '';
    const address = row['地址'] || '';
    const lng = row['经度'];
    const lat = row['纬度'];
    const category = row['景区分类'] || '';
    const nearbyTransport = row['附近交通'] || '';
    const openingHours = row['开放时间'] || '';
    const ticketPrice = row['门票价格'] || '';
    const ticketPurchase = row['购票方式'] || '';
    const suggestedDuration = row['建议游览时长'] || '';
    const bestVisitDate = row['最佳游览日期'] || '';
    const introduction = row['景区介绍'] || '';
    const suitableFor = row['适合人群'];
    const sellingPoints = row['景区卖点'];
    const photos = row['景点照片'];

    const stableKey = [nameZh, address, province, city, district].filter(Boolean).join('|') || nameZh || nameEn;
    const id = makeId('attr', stableKey);

    const regionParts = [province, city, district].map((x) => String(x || '').trim()).filter(Boolean);
    const region = regionParts.length ? regionParts.join(' · ') : null;

    const photosArr = splitMulti(photos);

    out.push({
      id,
      destinationKey: `${city}`,
      name: String(nameZh || nameEn || '').trim(),
      nameZh: String(nameZh || '').trim() || null,
      nameEn: String(nameEn || '').trim() || null,
      province: String(province || '').trim() || null,
      city: String(city || '').trim() || null,
      district: String(district || '').trim() || null,
      region,
      address: String(address || '').trim() || null,
      lat: toNumberOrNull(lat),
      lng: toNumberOrNull(lng),
      category: String(category || '').trim() || null,
      nearbyTransport: String(nearbyTransport || '').trim() || null,
      openingHours: String(openingHours || '').trim() || null,
      ticketPrice: String(ticketPrice || '').trim() || null,
      ticketPurchase: String(ticketPurchase || '').trim() || null,
      suggestedDuration: String(suggestedDuration || '').trim() || null,
      bestVisitDate: String(bestVisitDate || '').trim() || null,
      introduction: String(introduction || '').trim() || null,
      suitableFor: splitMulti(suitableFor),
      sellingPoints: splitMulti(sellingPoints),
      tags: [],
      photos: photosArr,
      image: (photosArr || [])[0] || null,
      rating: null,
      reason: String(introduction || '').trim() || null,
      topReview: null
    });
  }
  return out;
}

function normalizeRestaurants(rows) {
  const out = [];
  for (const row of rows) {
    const name = row['餐厅名称'] || '';
    if (!String(name).trim()) continue;
    // Accept both variants: 数据文件里可能用「餐厅图片」或「餐厅照片」。
    const photo = row['餐厅照片'] || row['餐厅图片'] || '';
    const cuisineType = row['菜品类型'] || '';
    const recommendedDishes = row['推荐菜品'];
    const address = row['餐厅地址'] || '';
    const lng = row['经度'];
    const lat = row['纬度'];
    const nearbyTransport = row['附近交通'] || '';
    const phone = row['餐厅电话'] || '';
    const openingHours = row['开放时间'] || '';
    const mustEatIndex = row['必吃指数'];
    const avgCost = row['人均消费'] || '';
    const queueStatus = row['排队情况'] || '';
    const nearbyAttractions = row['附近景点'];

    const stableKey = [name, address, phone].filter(Boolean).join('|') || name;
    const id = makeId('rest', stableKey);

    out.push({
      id,
      destinationId: null,
      name: String(name).trim(),
      photo: String(photo || '').trim() || null,
      cuisineType: String(cuisineType || '').trim() || null,
      recommendedDishes: splitMulti(recommendedDishes),
      address: String(address || '').trim() || null,
      lat: toNumberOrNull(lat),
      lng: toNumberOrNull(lng),
      nearbyTransport: String(nearbyTransport || '').trim() || null,
      phone: String(phone || '').trim() || null,
      openingHours: String(openingHours || '').trim() || null,
      mustEatIndex: toNumberOrNull(mustEatIndex),
      avgCost: String(avgCost || '').trim() || null,
      queueStatus: String(queueStatus || '').trim() || null,
      nearbyAttractions: splitMulti(nearbyAttractions),
      priceRange: String(avgCost || '').trim() || null,
      rating: toNumberOrNull(mustEatIndex),
      tags: splitMulti(cuisineType) || [],
      image: String(photo || '').trim() || null
    });
  }
  return out;
}

function normalizeFoods(rows) {
  const out = [];
  for (const row of rows) {
    const name = row['菜品名称'] || '';
    if (!String(name).trim()) continue;
    const photo = row['菜品照片'] || '';
    // Accept both variants: 数据文件里可能用「餐品简介」或「菜品简介」。
    const reason = row['菜品简介'] || row['餐品简介'] || '';
    // Accept both variants: 数据文件里可能用「推荐餐厅」或「推荐餐厅名称」。
    const restaurantName = row['推荐餐厅名称'] || row['推荐餐厅'] || '';
    const restaurantAddress = row['餐厅地址'] || '';
    const phone = row['联系电话'] || '';
    const lng = row['经度'];
    const lat = row['纬度'];
    const nearbyTransport = row['附近交通'] || '';
    const openingHours = row['开放时间'] || '';
    const mustEatIndex = row['必吃指数'];
    const avgCost = row['人均消费'] || '';
    const queueStatus = row['排队情况'] || '';
    const nearbyAttractions = row['附近景点'];

    const stableKey = [name, restaurantName, restaurantAddress].filter(Boolean).join('|') || name;
    const id = makeId('food', stableKey);

    out.push({
      id,
      destinationId: null,
      name: String(name).trim(),
      image: String(photo || '').trim() || null,
      tags: [],
      priceRange: String(avgCost || '').trim() || null,
      reviews: 0,
      reason: String(reason || '').trim() || null,
      topReview: restaurantName ? `Recommended at: ${String(restaurantName).trim()}` : null,
      restaurantName: String(restaurantName || '').trim() || null,
      restaurantAddress: String(restaurantAddress || '').trim() || null,
      phone: String(phone || '').trim() || null,
      lat: toNumberOrNull(lat),
      lng: toNumberOrNull(lng),
      nearbyTransport: String(nearbyTransport || '').trim() || null,
      openingHours: String(openingHours || '').trim() || null,
      mustEatIndex: toNumberOrNull(mustEatIndex),
      avgCost: String(avgCost || '').trim() || null,
      queueStatus: String(queueStatus || '').trim() || null,
      nearbyAttractions: splitMulti(nearbyAttractions)
    });
  }
  return out;
}

async function main() {
  requireEnv('DATABASE_URL');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // In docker compose, we mount repo `data/` to /data (read-only).
  // Locally, fall back to ../../data.
  let dataDir = path.resolve(__dirname, '../../data');
  try {
    await access('/data');
    dataDir = '/data';
  } catch {
    // ignore
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const attractionsRaw = await loadDataOptional(dataDir, 'attractions');
    const restaurantsRaw = await loadDataOptional(dataDir, 'restaurants');
    const foodsRaw = await loadDataOptional(dataDir, 'foods');
    const hotels = await loadDataOptional(dataDir, 'hotels');

    if (!Array.isArray(attractionsRaw)) throw new Error('data/attractions.(csv|json) must be an array');
    if (!Array.isArray(restaurantsRaw)) throw new Error('data/restaurants.(csv|json) must be an array');
    if (!Array.isArray(foodsRaw)) throw new Error('data/foods.(csv|json) must be an array');
    if (!Array.isArray(hotels)) throw new Error('data/hotels.(csv|json) must be an array');

    const attractions = normalizeAttractions(attractionsRaw);
    const restaurants = normalizeRestaurants(restaurantsRaw);
    const foods = normalizeFoods(foodsRaw);

    const destinationsByKey = new Map();
    for (const a of attractions) {
      const city = a.city || '';
      const key = `${city}`;
      if (!destinationsByKey.has(key)) {
        const display = city || 'Other';
        const id = makeId('dest', key || display);
        destinationsByKey.set(key, {
          id,
          name: display,
          description: display,
          longDescription: null,
          image: null,
          tourCount: 0
        });
      }
    }

    const otherDest = {
      id: 'dest_other',
      name: 'Other',
      description: 'Other',
      longDescription: null,
      image: null,
      tourCount: 0
    };
    destinationsByKey.set('__other__', otherDest);

    const attractionNameToDestinationId = new Map();
    for (const a of attractions) {
      const destId = destinationsByKey.get(a.destinationKey)?.id || otherDest.id;
      a.destinationId = destId;
      const keys = [a.nameZh, a.nameEn, a.name].filter(Boolean).map((x) => String(x).trim());
      for (const k of keys) {
        if (!k) continue;
        attractionNameToDestinationId.set(k, destId);
      }
    }

    function resolveDestinationIdByNearbyAndAddress(nearbyAttractions, address) {
      const near = splitMulti(nearbyAttractions) || [];
      for (const n of near) {
        const hit = attractionNameToDestinationId.get(n);
        if (hit) return hit;
      }
      const addr = String(address || '').trim();
      if (addr) {
        for (const dest of destinationsByKey.values()) {
          if (dest && dest.name && addr.includes(dest.name)) return dest.id;
        }
      }
      return otherDest.id;
    }

    for (const r of restaurants) {
      r.destinationId = resolveDestinationIdByNearbyAndAddress(r.nearbyAttractions, r.address);
    }
    for (const f of foods) {
      f.destinationId = resolveDestinationIdByNearbyAndAddress(f.nearbyAttractions, f.restaurantAddress);
    }

    await pool.query('BEGIN');

    for (const d of destinationsByKey.values()) {
      await upsertDestination(pool, d);
    }

    for (const a of attractions) {
      if (!a?.id) throw new Error('attraction.id is required');
      if (!a?.destinationId) throw new Error(`attraction.destinationId is required (id=${a.id})`);
      await upsertAttraction(pool, a);
    }

    for (const f of foods) {
      if (!f?.id) throw new Error('food.id is required');
      if (!f?.destinationId) throw new Error(`food.destinationId is required (id=${f.id})`);
      await upsertFood(pool, f);
    }

    for (const r of restaurants) {
      if (!r?.id) throw new Error('restaurant.id is required');
      if (!r?.destinationId) throw new Error(`restaurant.destinationId is required (id=${r.id})`);
      await upsertRestaurant(pool, r);
    }

    for (const h of hotels) {
      if (!h?.id) throw new Error('hotel.id is required');
      if (!h?.destinationId) throw new Error(`hotel.destinationId is required (id=${h.id})`);
      await upsertHotel(pool, h);
    }

    await pool.query('COMMIT');
    // eslint-disable-next-line no-console
    console.log('Seed completed:', {
      destinations: destinationsByKey.size,
      attractions: attractions.length,
      foods: foods.length,
      restaurants: restaurants.length,
      hotels: hotels.length
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
