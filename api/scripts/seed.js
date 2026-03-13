import { readFile, access, readdir } from 'node:fs/promises';
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

const MUNICIPALITY_NAME_MAP = new Map([
  ['Beijing', 'Beijing'],
  ['Beijing City', 'Beijing'],
  ['Shanghai', 'Shanghai'],
  ['Shanghai City', 'Shanghai'],
  ['Tianjin', 'Tianjin'],
  ['Tianjin City', 'Tianjin'],
  ['Chongqing', 'Chongqing'],
  ['Chongqing City', 'Chongqing']
]);

const PROVINCE_SUFFIXES = [
  ' Province',
  ' Autonomous Region',
  ' Special Administrative Region',
  ' SAR',
  ' Municipality'
];

const CITY_SUFFIXES = [' City'];

function normalizeLocationToken(v) {
  if (v == null) return '';
  return String(v)
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ');
}

function stripSuffix(value, suffixes) {
  let out = value;
  for (const suffix of suffixes) {
    if (out.toLowerCase().endsWith(suffix.toLowerCase())) {
      out = out.slice(0, -suffix.length).trim();
    }
  }
  return out;
}

function normalizeProvinceName(v) {
  const p = normalizeLocationToken(v);
  if (!p) return '';
  const mapped = MUNICIPALITY_NAME_MAP.get(p);
  if (mapped) return mapped;
  return stripSuffix(p, PROVINCE_SUFFIXES);
}

function normalizeCityName(cityRaw, provinceRaw) {
  const c = normalizeLocationToken(cityRaw);
  const province = normalizeProvinceName(provinceRaw);

  if (!c) {
    if (MUNICIPALITY_NAME_MAP.has(province)) return province;
    return '';
  }

  const mapped = MUNICIPALITY_NAME_MAP.get(c);
  if (mapped) return mapped;

  const provinceMapped = MUNICIPALITY_NAME_MAP.get(province);
  if (provinceMapped) {
    const provinceBase = stripSuffix(provinceMapped, CITY_SUFFIXES);
    if (c === provinceBase || c === provinceMapped) return provinceMapped;
  }

  return stripSuffix(c, CITY_SUFFIXES);
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
    trim: true,
    // Some upstream CSVs contain unescaped quotes in plain text fields.
    // Keep parser tolerant to avoid silently dropping to fallback data source.
    relax_quotes: true
  });
}

async function loadData(dataDir, baseName) {
  const csvPath = path.join(dataDir, `${baseName}.csv`);
  const jsonPath = path.join(dataDir, `${baseName}.json`);
  let hasCsv = false;

  try {
    await access(csvPath);
    hasCsv = true;
  } catch {
    // ignore
  }
  if (hasCsv) {
    try {
      return await loadCsv(csvPath);
    } catch (err) {
      throw new Error(`Failed to parse CSV file: ${csvPath}. ${err?.message || err}`);
    }
  }

  return await loadJson(jsonPath);
}

async function loadDataOptional(dataDir, baseName) {
  const csvPath = path.join(dataDir, `${baseName}.csv`);
  const jsonPath = path.join(dataDir, `${baseName}.json`);
  let hasCsv = false;
  try {
    await access(csvPath);
    hasCsv = true;
  } catch {
    // ignore
  }
  if (hasCsv) {
    try {
      return await loadCsv(csvPath);
    } catch (err) {
      throw new Error(`Failed to parse CSV file: ${csvPath}. ${err?.message || err}`);
    }
  }
  try {
    await access(jsonPath);
    return await loadJson(jsonPath);
  } catch {
    // ignore
  }
  return [];
}

async function loadAttractionsData(dataDir) {
  const nationwideRows = await loadDataOptional(dataDir, '全国景点数据');
  if (Array.isArray(nationwideRows) && nationwideRows.length > 0) {
    // eslint-disable-next-line no-console
    console.log('Using attractions source: data/全国景点数据.(csv|json)');
    return nationwideRows;
  }
  return await loadDataOptional(dataDir, 'attractions');
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
  const firstNonEmpty = (row, keys) => {
    for (const key of keys) {
      const value = row[key];
      if (value == null) continue;
      if (typeof value === 'string' && !value.trim()) continue;
      return value;
    }
    return '';
  };

  const out = [];
  for (const row of rows) {
    const nameLocal = firstNonEmpty(row, ['Attraction Name (Local)', 'Attraction Name', 'Attraction Name (English)']) || '';
    const nameEn = firstNonEmpty(row, ['Attraction Name (English)', 'Attraction Name']) || '';
    const provinceRaw = firstNonEmpty(row, ['Province']) || '';
    const cityRaw = firstNonEmpty(row, ['City']) || '';
    const district = firstNonEmpty(row, ['District']) || '';
    const regionFromSource = firstNonEmpty(row, ['Region']) || '';
    const address = firstNonEmpty(row, ['Address']) || '';
    const lng = row['Longitude'];
    const lat = row['Latitude'];
    const category = firstNonEmpty(row, ['Category']) || '';
    const nearbyTransport = firstNonEmpty(row, ['Nearby Transport']) || '';
    const openingHours = firstNonEmpty(row, ['Opening Hours']) || '';
    const ticketPrice = firstNonEmpty(row, ['Ticket Price']) || '';
    const ticketPurchase = firstNonEmpty(row, ['Ticket Purchase']) || '';
    const suggestedDuration = firstNonEmpty(row, ['Suggested Duration']) || '';
    const bestVisitDate = firstNonEmpty(row, ['Best Visit Date', 'Best Visit Months']) || '';
    const introduction = firstNonEmpty(row, ['Introduction']) || '';
    const suitableFor = firstNonEmpty(row, ['Suitable For']);
    const sellingPoints = firstNonEmpty(row, ['Selling Points']);
    const photos = firstNonEmpty(row, ['Attraction Photos', 'Photo URL']);
    const coreCategory = firstNonEmpty(row, ['Core Category']);
    const themeTags = firstNonEmpty(row, ['Theme Tags']);
    const scenicLevel = firstNonEmpty(row, ['Scenic Level']);
    const feeType = firstNonEmpty(row, ['Fee Type']);
    let province = normalizeProvinceName(provinceRaw);
    const city = normalizeCityName(cityRaw, provinceRaw);
    if (!province && MUNICIPALITY_NAME_MAP.has(city)) {
      province = city;
    }
    const cityForKey = city || province || 'Other';

    const name = String(nameEn || nameLocal || '').trim();
    const stableKey = [name, address, province, city, district].filter(Boolean).join('|') || name;
    const id = makeId('attr', stableKey);

    const regionParts = [province, city, district].map((x) => String(x || '').trim()).filter(Boolean);
    const region = regionParts.length ? regionParts.join(' · ') : (String(regionFromSource || '').trim() || null);

    const photosArr = splitMulti(photos);
    const tags = Array.from(
      new Set([
        ...(splitMulti(coreCategory) || []),
        ...(splitMulti(themeTags) || []),
        ...(splitMulti(scenicLevel) || []),
        ...(splitMulti(feeType) || []),
        ...(splitMulti(regionFromSource) || [])
      ])
    );

    out.push({
      id,
      destinationKey: `${province || 'Other'}|${cityForKey}`,
      name,
      nameZh: null,
      nameEn: String(nameEn || nameLocal || '').trim() || null,
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
      tags,
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
  const byId = new Map();
  for (const row of rows) {
    const name = row['Restaurant Name'] || '';
    if (!String(name).trim()) continue;
    // Accept both variants: data files may use "Restaurant Photo" or "Restaurant Image".
    const photo = row['Restaurant Photo'] || row['Restaurant Image'] || '';
    const cuisineType = row['Cuisine Type'] || '';
    const recommendedDishes = row['Recommended Dishes'];
    const address = row['Restaurant Address'] || '';
    const lng = row['Longitude'];
    const lat = row['Latitude'];
    const nearbyTransport = row['Nearby Transport'] || '';
    const phone = row['Phone'] || '';
    const openingHours = row['Opening Hours'] || '';
    const mustEatIndex = row['Must-Try Index'];
    const avgCost = row['Avg Cost'] || '';
    const queueStatus = row['Queue Status'] || '';
    const nearbyAttractions = row['Nearby Attractions'];

    const stableKey = [name, address, phone].filter(Boolean).join('|') || name;
    const id = makeId('rest', stableKey);

    const next = {
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
    };

    const prev = byId.get(id);
    if (!prev) {
      byId.set(id, next);
      continue;
    }

    // Merge rows: some CSVs list one recommended dish per row for the same restaurant.
    const mergeUniq = (a, b) => Array.from(new Set([...(a || []), ...(b || [])].filter(Boolean)));

    prev.photo = prev.photo || next.photo;
    prev.image = prev.image || next.image;
    prev.cuisineType = prev.cuisineType || next.cuisineType;
    prev.address = prev.address || next.address;
    prev.phone = prev.phone || next.phone;
    prev.nearbyTransport = prev.nearbyTransport || next.nearbyTransport;
    prev.openingHours = prev.openingHours || next.openingHours;
    prev.avgCost = prev.avgCost || next.avgCost;
    prev.queueStatus = prev.queueStatus || next.queueStatus;
    prev.priceRange = prev.priceRange || next.priceRange;
    prev.lat = prev.lat != null ? prev.lat : next.lat;
    prev.lng = prev.lng != null ? prev.lng : next.lng;

    prev.recommendedDishes = mergeUniq(prev.recommendedDishes, next.recommendedDishes);
    prev.tags = mergeUniq(prev.tags, next.tags);
    prev.nearbyAttractions = mergeUniq(prev.nearbyAttractions, next.nearbyAttractions);

    // Keep max for numeric-ish indicators.
    prev.mustEatIndex = Math.max(prev.mustEatIndex || 0, next.mustEatIndex || 0) || prev.mustEatIndex || next.mustEatIndex;
    prev.rating = Math.max(prev.rating || 0, next.rating || 0) || prev.rating || next.rating;
  }
  return Array.from(byId.values());
}

function normalizeFoods(rows) {
  const out = [];
  for (const row of rows) {
    const name = row['Dish Name'] || '';
    if (!String(name).trim()) continue;
    const photo = row['Dish Photo'] || '';
    // Accept both variants: data files may use "Dish Description".
    const reason = row['Dish Description'] || '';
    // Accept both variants: data files may use "Recommended Restaurant" or "Recommended Restaurant Name".
    const restaurantName = row['Recommended Restaurant Name'] || row['Recommended Restaurant'] || '';
    const restaurantAddress = row['Restaurant Address'] || '';
    const phone = row['Phone'] || '';
    const lng = row['Longitude'];
    const lat = row['Latitude'];
    const nearbyTransport = row['Nearby Transport'] || '';
    const openingHours = row['Opening Hours'] || '';
    const mustEatIndex = row['Must-Try Index'];
    const avgCost = row['Avg Cost'] || '';
    const queueStatus = row['Queue Status'] || '';
    const nearbyAttractions = row['Nearby Attractions'];
    const city = row['City'] || row['city'] || '';

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
      nearbyAttractions: splitMulti(nearbyAttractions),
      city: String(city || '').trim() || null
    });
  }
  return out;
}

function parseHhmmToMinutes(s) {
  const m = String(s || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mm)) return null;
  return h * 60 + mm;
}

function minutesToTimeString(totalMinutes) {
  if (totalMinutes == null) return null;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}:00`;
}

function diffMinutes(startHhmm, endHhmm) {
  const a = parseHhmmToMinutes(startHhmm);
  const b = parseHhmmToMinutes(endHhmm);
  if (a == null || b == null) return null;
  let d = b - a;
  if (d < 0) d += 24 * 60;
  return d;
}

function parseApproxDurationMinutes(line) {
  const s = String(line || '');
  // Examples:
  // - "⏱️ Total time: about 15 minutes"
  // - "⏱️ Total time: about 1.5 hours"
  // - "Total time: about 2 hours"
  const min = s.match(/(?:~|about)?\s*([\d.]+)\s*(minutes?|mins?|min)\b/i);
  if (min) {
    const n = Number(min[1]);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const hr = s.match(/(?:~|about)?\s*([\d.]+)\s*(hours?|hrs?|hr|h)\b/i);
  if (hr) {
    const n = Number(hr[1]);
    return Number.isFinite(n) ? Math.round(n * 60) : null;
  }
  return null;
}

function parseMoneyNumber(line) {
  const s = String(line || '');
  const m = s.match(/([\d.,]+)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function countStars(line) {
  const s = String(line || '');
  const matches = s.match(/⭐/g);
  return matches ? matches.length : null;
}

function isEmojiTitleLine(line) {
  const s = String(line || '').trim();
  if (!s) return false;
  if (s.includes('：') || s.includes(':')) return false;
  // Exclude itinerary node headers (they also start with emoji).
  if (/^(📅|📍|🚇|🍜|🍽️)\s*/u.test(s)) return false;
  // A loose heuristic: highlight/dish titles tend to be short.
  if (s.length > 60) return false;
  return /^\p{Extended_Pictographic}/u.test(s);
}

function extractImageUrl(line) {
  const s = String(line || '').trim();
  if (!s) return null;
  const imageLabelMatch = s.match(/^(Image|图片)[：:]\s*(https?:\/\/\S+)$/iu);
  if (imageLabelMatch) return imageLabelMatch[1].trim();
  const markdownImageMatch = s.match(/^!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)$/u);
  if (markdownImageMatch) return markdownImageMatch[1].trim();
  return null;
}

function collectSectionText(lines, startIdx, endIdxExclusive) {
  const slice = lines.slice(startIdx, endIdxExclusive);
  return slice
    .map((l) => String(l || '').trim())
    .filter(Boolean)
    .join('\n');
}

function collectKeyValue(lines, key) {
  const idx = lines.findIndex((l) => String(l || '').trim() === key);
  if (idx === -1) return null;
  for (let i = idx + 1; i < lines.length; i++) {
    const v = String(lines[i] || '').trim();
    if (v) return v;
  }
  return null;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectKeyValueAny(lines, keys) {
  const normalizedKeys = (Array.isArray(keys) ? keys : [])
    .map((k) => String(k || '').trim())
    .filter(Boolean);
  if (!normalizedKeys.length) return null;

  const keySet = new Set(normalizedKeys.map((k) => k.toLowerCase()));
  const labelPattern = normalizedKeys.map(escapeRegExp).join('|');
  const inlinePattern = labelPattern ? new RegExp(`^(${labelPattern})\\s*[：:]\\s*(.+)$`, 'iu') : null;

  for (let i = 0; i < lines.length; i++) {
    const raw = String(lines[i] || '').trim();
    if (!raw) continue;

    if (inlinePattern) {
      const inline = raw.match(inlinePattern);
      if (inline) {
        const value = String(inline[2] || '').trim();
        if (value) return value;
      }
    }

    if (keySet.has(raw.toLowerCase())) {
      for (let j = i + 1; j < lines.length; j++) {
        const v = String(lines[j] || '').trim();
        if (v) return v;
      }
    }
  }

  return null;
}

function parsePriceUnit(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const m = s.match(/[\d.,]+/);
  if (!m || m.index == null) return null;
  const after = s.slice(m.index + m[0].length).trim();
  if (after) return after;
  const before = s.slice(0, m.index).trim();
  return before || null;
}

function normalizeNameToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-—_()（）【】\[\]《》"'`.,，。:：·•]/g, '');
}

function buildAttractionImageResolver(attractions) {
  const imageByName = new Map();
  for (const a of attractions || []) {
    const images = [...new Set([a?.image, ...(a?.photos || [])].map((x) => String(x || '').trim()).filter(Boolean))];
    if (!images.length) continue;
    const keys = [a?.name, a?.nameZh, a?.nameEn]
      .map((x) => normalizeNameToken(x))
      .filter(Boolean);
    for (const key of keys) {
      if (!imageByName.has(key)) imageByName.set(key, images);
    }
  }

  const imageEntries = Array.from(imageByName.entries()).sort((a, b) => b[0].length - a[0].length);
  return (name) => {
    const token = normalizeNameToken(name);
    if (!token) return [];
    if (imageByName.has(token)) return imageByName.get(token) || [];
    for (const [key, images] of imageEntries) {
      if (token.includes(key) || key.includes(token)) return images;
    }
    return [];
  };
}

const ROUTE_HEADER_TITLE_KEYS = ['Main Itinerary Title', '行程主标题', '行程标题', '行程名称', '产品名称'];
const ROUTE_HEADER_ALIAS_KEYS = ['Itinerary Subtitle', '行程副标题', '副标题'];
const ROUTE_HEADER_PRICE_KEYS = ['Price', '价格', '价位', '费用'];
const ROUTE_COVER_KEYS = ['Cover Image', 'Cover', '封面图', '封面图片', '封面', 'Image', '图片', 'Image URL'];

function extractCoverImageUrl(line, opts = {}) {
  const { allowBare = false } = opts;
  const s = String(line || '').trim();
  if (!s) return null;
  const labelPattern = ROUTE_COVER_KEYS.map(escapeRegExp).join('|');
  const labeled = labelPattern ? s.match(new RegExp(`^(${labelPattern})\\s*[：:]\\s*(https?:\\/\\/\\S+)$`, 'iu')) : null;
  if (labeled) return labeled[2].trim();
  const markdownImageMatch = s.match(/^!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)$/u);
  if (markdownImageMatch) return markdownImageMatch[1].trim();
  if (allowBare) {
    const bareUrlMatch = s.match(/^(https?:\/\/\S+)$/u);
    if (bareUrlMatch) return bareUrlMatch[1].trim();
  }
  return null;
}

function collectCoverImagesFromLines(lines, opts = {}) {
  const { allowBare = false } = opts;
  const out = [];
  const keySet = new Set(ROUTE_COVER_KEYS.map((k) => String(k).toLowerCase()));
  const isKeyLine = (s) => keySet.has(String(s || '').trim().toLowerCase());

  for (let i = 0; i < lines.length; i++) {
    const raw = String(lines[i] || '').trim();
    if (!raw) continue;

    const direct = extractCoverImageUrl(raw, { allowBare });
    if (direct) {
      out.push(direct);
      continue;
    }

    if (isKeyLine(raw)) {
      for (let j = i + 1; j < lines.length; j++) {
        const next = String(lines[j] || '').trim();
        if (!next) continue;
        const url = extractCoverImageUrl(next, { allowBare: true });
        if (url) out.push(url);
        break;
      }
    }
  }

  return Array.from(new Set(out));
}

function collectCoverImages(headerLines, allLines) {
  const headerImages = collectCoverImagesFromLines(headerLines, { allowBare: true });
  if (headerImages.length) return headerImages;
  const bodyImages = collectCoverImagesFromLines(allLines, { allowBare: false });
  return bodyImages.length ? [bodyImages[0]] : [];
}

function parseRouteMarkdown(routeId, markdown) {
  const lines = String(markdown || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => String(l || '').trimEnd());

  const dayMarkers = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].trim().match(/^📅\s*Day\s+(\d+):\s*(.+)$/u);
    if (m) {
      dayMarkers.push({ idx: i, dayNumber: Number(m[1]), dayTitle: m[2].trim() });
    }
  }

  const firstDayIdx = dayMarkers.length ? dayMarkers[0].idx : lines.length;
  const headerLines = lines.slice(0, firstDayIdx);

  const routeName = collectKeyValueAny(headerLines, ROUTE_HEADER_TITLE_KEYS) || routeId;
  const routeAlias = collectKeyValueAny(headerLines, ROUTE_HEADER_ALIAS_KEYS);

  const priceRaw = collectKeyValueAny(headerLines, ROUTE_HEADER_PRICE_KEYS);
  const price = priceRaw ? parseMoneyNumber(priceRaw) : null;
  const priceUnit = priceRaw ? parsePriceUnit(priceRaw) : null;

  const recIdx = headerLines.findIndex((l) => String(l || '').trim() === 'Why We Recommend');
  const introIdx = headerLines.findIndex((l) => String(l || '').trim() === 'Itinerary Overview');
  const hlIdx = headerLines.findIndex((l) => String(l || '').trim() === 'Key Highlights');
  const overviewIdx = headerLines.findIndex((l) => String(l || '').trim().startsWith('🗓️'));

  const recommendation =
    recIdx !== -1
      ? collectSectionText(
          headerLines,
          recIdx + 1,
          introIdx !== -1 ? introIdx : hlIdx !== -1 ? hlIdx : overviewIdx !== -1 ? overviewIdx : headerLines.length
        )
          .split('\n')
          .filter((l) => !l.startsWith('//'))
          .join('\n') || null
      : null;

  const introduction =
    introIdx !== -1
      ? collectSectionText(
          headerLines,
          introIdx + 1,
          hlIdx !== -1 ? hlIdx : overviewIdx !== -1 ? overviewIdx : headerLines.length
        ) || null
      : null;

  const highlights = [];
  if (hlIdx !== -1) {
    const end = overviewIdx !== -1 ? overviewIdx : headerLines.length;
    for (const l of headerLines.slice(hlIdx + 1, end)) {
      const s = String(l || '').trim();
      if (!s) continue;
      if (!s.startsWith('•')) continue;
      highlights.push(s.replace(/^•\s*/, '').trim());
    }
  }

  const days = [];
  for (let d = 0; d < dayMarkers.length; d++) {
    const cur = dayMarkers[d];
    const next = dayMarkers[d + 1];
    const start = cur.idx;
    const end = next ? next.idx : lines.length;
    const dayLines = lines.slice(start, end);

    // day subtitle is the first non-empty line after the day header.
    let daySubtitle = null;
    for (let i = 1; i < dayLines.length; i++) {
      const s = String(dayLines[i] || '').trim();
      if (s) {
        daySubtitle = s;
        break;
      }
    }

    // Find itinerary nodes for this day.
    const nodeStarts = [];
    for (let i = 0; i < dayLines.length; i++) {
      const l = String(dayLines[i] || '').trim();
      const mt = l.match(/^🚇\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s*\|\s*Transport:\s*(.+)$/u);
      if (mt) {
        nodeStarts.push({ idx: i, type: 'transport', m: mt });
        continue;
      }
      const ma = l.match(/^📍\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s*\|\s*(.+)$/u);
      if (ma) {
        nodeStarts.push({ idx: i, type: 'attraction', m: ma });
        continue;
      }
      const mr = l.match(/^(🍜|🍽️)\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s*\|\s*(.+)$/u);
      if (mr) {
        nodeStarts.push({ idx: i, type: 'restaurant', m: mr });
        continue;
      }
    }

    const nodes = [];
    for (let n = 0; n < nodeStarts.length; n++) {
      const curNode = nodeStarts[n];
      const nextNode = nodeStarts[n + 1];
      const blockStart = curNode.idx;
      const blockEnd = nextNode ? nextNode.idx : dayLines.length;
      const block = dayLines.slice(blockStart, blockEnd).map((x) => String(x || '').trimEnd());
      const header = String(block[0] || '').trim();

      if (curNode.type === 'transport') {
        const startHhmm = curNode.m[1];
        const endHhmm = curNode.m[2];
        const duration = diffMinutes(startHhmm, endHhmm) ?? block.map(parseApproxDurationMinutes).find((x) => x != null) ?? null;

        const fromLine =
          block.find((l) => /^(🟢\s*)?(Pickup Location|Departure Location):/i.test(String(l || '').trim())) ||
          block.find((l) => /^📍\s*Departure Location:/i.test(String(l || '').trim())) ||
          null;
        const toLine =
          block.find((l) => /^(🔴\s*)?(Drop-off Location|Arrival Location):/i.test(String(l || '').trim())) || null;

        const fromLocation = fromLine
          ? String(fromLine)
              .replace(/^(🟢\s*)?(Pickup Location|Departure Location):\s*/i, '')
              .replace(/^📍\s*Departure Location:\s*/i, '')
              .trim()
          : null;
        const toLocation = toLine
          ? String(toLine).replace(/^(🔴\s*)?(Drop-off Location|Arrival Location):\s*/i, '').trim()
          : null;

        const costLine = block.find((l) => String(l || '').toLowerCase().includes('fare'));
        const cost = costLine ? parseMoneyNumber(costLine) : null;

        const method =
          block.some((l) => /walk/i.test(String(l || '')) || String(l || '').trim().startsWith('👣'))
            ? 'Walk'
            : block.some((l) => /(subway|metro)/i.test(String(l || '')) || String(l || '').trim().startsWith('🚊'))
              ? 'Subway'
              : block.some((l) => /bus/i.test(String(l || '')))
                ? 'Bus'
                : block.some((l) => /(taxi|ride-hail)/i.test(String(l || '')))
                  ? 'Taxi'
                  : 'Transport';

        const detailLines = block
          .slice(1)
          .map((l) => String(l || '').trimEnd())
          .filter(Boolean);

        nodes.push({
          nodeType: 'transport',
          startTime: minutesToTimeString(parseHhmmToMinutes(startHhmm)),
          durationMinutes: duration,
          transport: {
            fromLocation,
            toLocation,
            transportMethod: method,
            routeDetail: detailLines.join('\n') || null,
            cost,
            notes: header || null
          }
        });
        continue;
      }

      if (curNode.type === 'attraction') {
        const startHhmm = curNode.m[1];
        const endHhmm = curNode.m[2];
        const duration = diffMinutes(startHhmm, endHhmm) ?? null;
        const name = curNode.m[3].trim();

        const address = (block.find((l) => String(l || '').trim().startsWith('Address:')) || '').replace(/^Address:\s*/i, '').trim() || null;
        const openingHours = (block.find((l) => String(l || '').trim().startsWith('Opening Hours:')) || '').replace(/^Opening Hours:\s*/i, '').trim() || null;
        const ticketPrice = (block.find((l) => String(l || '').trim().startsWith('Ticket:')) || '').replace(/^Ticket:\s*/i, '').trim() || null;
        const suggestedDuration = (block.find((l) => String(l || '').trim().startsWith('Suggested Duration:')) || '').replace(/^Suggested Duration:\s*/i, '').trim() || null;
        const bestSeason = (block.find((l) => String(l || '').trim().startsWith('Best Season:')) || '').replace(/^Best Season:\s*/i, '').trim() || null;

        const introMarkerIdx = block.findIndex((l) => String(l || '').trim() === 'Attraction Overview');
        const highlightMarkerIdx = block.findIndex((l) =>
          /^(Visit Highlights|Sight Highlights|Architecture Highlights|Best Photo Spots)$/i.test(String(l || '').trim())
        );

        const desc =
          introMarkerIdx !== -1
            ? collectSectionText(block, introMarkerIdx + 1, highlightMarkerIdx !== -1 ? highlightMarkerIdx : block.length) || null
            : null;

        let highlightItems = null;
        if (highlightMarkerIdx !== -1) {
          const rest = block.slice(highlightMarkerIdx + 1).map((l) => String(l || '').trimEnd());
          const items = [];
          let current = null;
          let currentImage = null;
          let buf = [];
          for (const l of rest) {
            const s = String(l || '').trim();
            if (!s) continue;
            if (isEmojiTitleLine(s)) {
              if (current) {
                items.push({ title: current, content: buf.join('\n').trim() || null, image: currentImage });
              }
              current = s;
              currentImage = null;
              buf = [];
            } else if (current) {
              const imageUrl = extractImageUrl(s);
              if (imageUrl) {
                currentImage = imageUrl;
              } else {
                buf.push(s);
              }
            }
          }
          if (current) items.push({ title: current, content: buf.join('\n').trim() || null, image: currentImage });
          highlightItems = items.length ? items : null;
        }

        const notes = block
          .filter((l) => /:/.test(String(l || '').trim()))
          .filter((l) => !/^(Address|Opening Hours|Ticket|Suggested Duration|Best Season):/i.test(String(l || '').trim()))
          .join('\n')
          .trim() || null;

        nodes.push({
          nodeType: 'attraction',
          startTime: minutesToTimeString(parseHhmmToMinutes(startHhmm)),
          durationMinutes: duration,
          attraction: {
            name,
            address,
            openingHours,
            ticketPrice,
            suggestedDuration,
            description: desc,
            highlights: highlightItems,
            images: [],
            bestSeason,
            lat: null,
            lng: null,
            notes
          }
        });
        continue;
      }

      if (curNode.type === 'restaurant') {
        const startHhmm = curNode.m[2];
        const endHhmm = curNode.m[3];
        const duration = diffMinutes(startHhmm, endHhmm) ?? null;

        const headerLabel = curNode.m[4].trim();
        const headerName = headerLabel.includes(':') ? headerLabel.split(':').slice(1).join(':').trim() : headerLabel;
        const nameLine = block.find((l) => String(l || '').trim().startsWith('Restaurant Name:'));
        const name = nameLine ? String(nameLine).replace(/^Restaurant Name:\s*/i, '').trim() : headerName;

        const address = (block.find((l) => String(l || '').trim().startsWith('Address:')) || '').replace(/^Address:\s*/i, '').trim() || null;
        const avgCostLine = block.find((l) => String(l || '').trim().startsWith('Avg Cost:'));
        const avgCost = avgCostLine ? parseMoneyNumber(avgCostLine) : null;
        const mustEatLine = block.find((l) => String(l || '').trim().startsWith('Must-Try Index:'));
        const mustEatRating = mustEatLine ? countStars(mustEatLine) : null;
        const queueStatus = (block.find((l) => String(l || '').trim().startsWith('Queue Status:')) || '').replace(/^Queue Status:\s*/i, '').trim() || null;
        const phoneLine = block.find((l) => /Phone/i.test(String(l || '')));
        const phone = phoneLine ? String(phoneLine).replace(/^.*Phone:\s*/i, '').trim() : null;
        const businessHours = (block.find((l) => String(l || '').trim().startsWith('Business Hours:')) || '').replace(/^Business Hours:\s*/i, '').trim() || null;

        const bgIdx = block.findIndex((l) => String(l || '').trim() === 'Restaurant Background');
        const dishesIdx = block.findIndex((l) => String(l || '').trim() === 'Recommended Dishes');

        const background =
          bgIdx !== -1
            ? collectSectionText(block, bgIdx + 1, dishesIdx !== -1 ? dishesIdx : block.length) || null
            : null;

        let recommendedDishes = null;
        if (dishesIdx !== -1) {
          const rest = block.slice(dishesIdx + 1).map((l) => String(l || '').trimEnd());
          const items = [];
          let current = null;
          let buf = [];
          for (const l of rest) {
            const s = String(l || '').trim();
            if (!s) continue;
            if (isEmojiTitleLine(s)) {
              if (current) {
                items.push({ name: current, description: buf.join('\n').trim() || null });
              }
              current = s;
              buf = [];
            } else if (current) {
              buf.push(s);
            }
          }
          if (current) items.push({ name: current, description: buf.join('\n').trim() || null });
          recommendedDishes = items.length ? items : null;
        }

        nodes.push({
          nodeType: 'restaurant',
          startTime: minutesToTimeString(parseHhmmToMinutes(startHhmm)),
          durationMinutes: duration,
          restaurant: {
            name,
            address,
            avgCost,
            mustEatRating,
            queueStatus,
            phone,
            businessHours,
            background,
            recommendedDishes,
            images: [],
            lat: null,
            lng: null,
            notes: header || null
          }
        });
      }
    }

    days.push({
      dayNumber: cur.dayNumber,
      dayTitle: cur.dayTitle,
      daySubtitle,
      nodes
    });
  }

  return {
    id: routeId,
    routeName,
    routeAlias,
    price,
    priceUnit,
    recommendation,
    introduction,
    highlights,
    coverImages: collectCoverImages(headerLines, lines),
    totalDays: days.length || dayMarkers.length || null,
    status: 1,
    days
  };
}

async function resolveRoutesDir(dataDir) {
  const envDir = String(process.env.ROUTES_DIR || process.env.ROUTES_DATA_DIR || '').trim();
  const candidates = [
    envDir ? path.resolve(envDir) : null,
    path.join(dataDir, 'routes'),
    path.join(path.dirname(dataDir), 'data_translated', 'routes')
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate);
      // eslint-disable-next-line no-console
      console.log(`Using routes source: ${candidate}`);
      return candidate;
    } catch {
      // ignore
    }
  }
  return null;
}

async function loadRouteMarkdownFiles(dataDir) {
  const routesDir = await resolveRoutesDir(dataDir);
  if (!routesDir) return [];

  const entries = await readdir(routesDir, { withFileTypes: true });
  const mdFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'));
  mdFiles.sort((a, b) => a.name.localeCompare(b.name));

  const out = [];
  for (const file of mdFiles) {
    const routeId = path.basename(file.name, path.extname(file.name));
    const raw = await readFile(path.join(routesDir, file.name), 'utf8');
    out.push(parseRouteMarkdown(routeId, raw));
  }
  return out;
}

async function seedRoute(pool, route) {
  // Replace the whole route in one shot (read-only app; avoids partial updates).
  await pool.query('DELETE FROM routes WHERE id = $1', [route.id]);

  await pool.query(
    `
      INSERT INTO routes (
        id, route_name, route_alias, price, price_unit, recommendation, introduction,
        highlights, cover_images, total_days, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `,
    [
      route.id,
      route.routeName,
      route.routeAlias || null,
      route.price != null ? route.price : null,
      route.priceUnit || null,
      route.recommendation || null,
      route.introduction || null,
      route.highlights || [],
      route.coverImages || [],
      Number(route.totalDays || (route.days ? route.days.length : 1) || 1),
      Number(route.status || 1)
    ]
  );

  let dayCount = 0;
  let nodeCount = 0;

  for (const day of route.days || []) {
    dayCount++;
    const dayId = `${route.id}_d${day.dayNumber}`;
    await pool.query(
      `
        INSERT INTO route_days (id, route_id, day_number, day_title, day_subtitle)
        VALUES ($1,$2,$3,$4,$5)
      `,
      [dayId, route.id, Number(day.dayNumber), day.dayTitle || null, day.daySubtitle || null]
    );

    let order = 0;
    for (const node of day.nodes || []) {
      order++;
      nodeCount++;
      const nodeId = `${dayId}_n${order}`;

      await pool.query(
        `
          INSERT INTO route_nodes (id, day_id, node_order, node_type, start_time, duration_minutes)
          VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          nodeId,
          dayId,
          order,
          node.nodeType,
          node.startTime || null,
          node.durationMinutes != null ? Number(node.durationMinutes) : null
        ]
      );

      if (node.nodeType === 'transport') {
        const t = node.transport || {};
        await pool.query(
          `
            INSERT INTO transport_nodes (
              node_id, from_location, to_location, transport_method, route_detail, cost, notes
            ) VALUES ($1,$2,$3,$4,$5,$6,$7)
          `,
          [
            nodeId,
            t.fromLocation || null,
            t.toLocation || null,
            t.transportMethod || null,
            t.routeDetail || null,
            t.cost != null ? Number(t.cost) : null,
            t.notes || null
          ]
        );
      }

      if (node.nodeType === 'attraction') {
        const a = node.attraction || {};
        // pg treats JS arrays as Postgres arrays, not JSON. We must serialize JSONB payloads ourselves.
        const highlightsJson = JSON.stringify(a.highlights || []);
        await pool.query(
          `
            INSERT INTO attraction_nodes (
              node_id, name, address, opening_hours, ticket_price, suggested_duration,
              description, highlights, images, best_season, lat, lng, notes
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13)
          `,
          [
            nodeId,
            a.name,
            a.address || null,
            a.openingHours || null,
            a.ticketPrice || null,
            a.suggestedDuration || null,
            a.description || null,
            highlightsJson,
            a.images || [],
            a.bestSeason || null,
            a.lat != null ? Number(a.lat) : null,
            a.lng != null ? Number(a.lng) : null,
            a.notes || null
          ]
        );
      }

      if (node.nodeType === 'restaurant') {
        const r = node.restaurant || {};
        // Same as above: ensure JSONB is sent as valid JSON text.
        const dishesJson = r.recommendedDishes != null ? JSON.stringify(r.recommendedDishes) : null;
        await pool.query(
          `
            INSERT INTO restaurant_nodes (
              node_id, name, address, avg_cost, must_eat_rating, queue_status, phone, business_hours,
              background, recommended_dishes, images, lat, lng, notes
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14)
          `,
          [
            nodeId,
            r.name,
            r.address || null,
            r.avgCost != null ? Number(r.avgCost) : null,
            r.mustEatRating != null ? Number(r.mustEatRating) : null,
            r.queueStatus || null,
            r.phone || null,
            r.businessHours || null,
            r.background || null,
            dishesJson,
            r.images || [],
            r.lat != null ? Number(r.lat) : null,
            r.lng != null ? Number(r.lng) : null,
            r.notes || null
          ]
        );
      }
    }
  }

  return { dayCount, nodeCount };
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
    const attractionsRaw = await loadAttractionsData(dataDir);
    const restaurantsRaw = await loadDataOptional(dataDir, 'restaurants');
    const foodsRaw = await loadDataOptional(dataDir, 'foods');
    const hotels = await loadDataOptional(dataDir, 'hotels');
    const routesMd = await loadRouteMarkdownFiles(dataDir);

    if (!Array.isArray(attractionsRaw)) throw new Error('data/attractions.(csv|json) or data/全国景点数据.(csv|json) must be an array');
    if (!Array.isArray(restaurantsRaw)) throw new Error('data/restaurants.(csv|json) must be an array');
    if (!Array.isArray(foodsRaw)) throw new Error('data/foods.(csv|json) must be an array');
    if (!Array.isArray(hotels)) throw new Error('data/hotels.(csv|json) must be an array');

    const attractions = normalizeAttractions(attractionsRaw);
    const restaurants = normalizeRestaurants(restaurantsRaw);
    const foods = normalizeFoods(foodsRaw);
    const resolveAttractionImages = buildAttractionImageResolver(attractions);

    for (const route of routesMd) {
      for (const day of route.days || []) {
        for (const node of day.nodes || []) {
          if (node.nodeType !== 'attraction' || !node.attraction) continue;
          const images = resolveAttractionImages(node.attraction.name);
          if (!images.length) continue;

          if (!Array.isArray(node.attraction.images) || node.attraction.images.length === 0) {
            node.attraction.images = images.slice(0, 12);
          }

          if (Array.isArray(node.attraction.highlights) && node.attraction.highlights.length > 0) {
            node.attraction.highlights = node.attraction.highlights.map((item, idx) => {
              if (item && item.image) return item;
              return { ...item, image: images[idx % images.length] };
            });
          }
        }
      }
    }

    const destinationsByKey = new Map();
    for (const a of attractions) {
      const key = String(a.destinationKey || `${a.province || 'Other'}|${a.city || a.province || 'Other'}`);
      if (!destinationsByKey.has(key)) {
        const display = a.city || a.province || 'Other';
        const cover = a.image || ((Array.isArray(a.photos) && a.photos.length > 0) ? a.photos[0] : null) || null;
        const id = makeId('dest', key || display);
        destinationsByKey.set(key, {
          id,
          name: display,
          description: a.province && a.province !== display ? `${a.province} · ${display}` : display,
          longDescription: null,
          image: cover,
          tourCount: 0
        });
      } else {
        const current = destinationsByKey.get(key);
        if (current && !current.image) {
          current.image = a.image || ((Array.isArray(a.photos) && a.photos.length > 0) ? a.photos[0] : null) || null;
        }
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

    function normalizeCityKey(value) {
      const raw = String(value || '').normalize('NFKC').trim();
      if (!raw) return '';
      const compact = raw.replace(/\s+/g, '');
      const zhAliasMap = new Map([
        ['北京', 'beijing'],
        ['上海', 'shanghai'],
        ['天津', 'tianjin'],
        ['重庆', 'chongqing']
      ]);
      for (const [cn, en] of zhAliasMap) {
        if (compact.includes(cn)) return en;
      }
      let key = raw.toLowerCase();
      key = key.replace(/[\s\p{P}\p{S}]+/gu, '');
      key = key.replace(/city$/, '');
      key = key.replace(/市$/, '');
      return key;
    }

    const cityToDestinationId = new Map();
    for (const dest of destinationsByKey.values()) {
      const key = normalizeCityKey(dest?.name);
      if (!key) continue;
      if (!cityToDestinationId.has(key)) {
        cityToDestinationId.set(key, dest.id);
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
      const cityKey = normalizeCityKey(f.city);
      if (cityKey && cityToDestinationId.has(cityKey)) {
        f.destinationId = cityToDestinationId.get(cityKey);
      } else {
        f.destinationId = resolveDestinationIdByNearbyAndAddress(f.nearbyAttractions, f.restaurantAddress);
      }
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

    await pool.query(`
      DELETE FROM destinations d
      WHERE d.id <> 'dest_other'
        AND NOT EXISTS (SELECT 1 FROM attractions a WHERE a.destination_id = d.id)
        AND NOT EXISTS (SELECT 1 FROM foods f WHERE f.destination_id = d.id)
        AND NOT EXISTS (SELECT 1 FROM restaurants r WHERE r.destination_id = d.id)
        AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.destination_id = d.id)
    `);

    let routesSeeded = 0;
    let routeDaysSeeded = 0;
    let routeNodesSeeded = 0;

    if (routesMd.length > 0) {
      const reg = await pool.query(
        `
          SELECT
            to_regclass('public.routes') IS NOT NULL AS has_routes,
            to_regclass('public.route_days') IS NOT NULL AS has_route_days,
            to_regclass('public.route_nodes') IS NOT NULL AS has_route_nodes,
            to_regclass('public.transport_nodes') IS NOT NULL AS has_transport_nodes,
            to_regclass('public.attraction_nodes') IS NOT NULL AS has_attraction_nodes,
            to_regclass('public.restaurant_nodes') IS NOT NULL AS has_restaurant_nodes
        `
      );
      const ok = reg.rows[0] || {};
      const hasAll =
        ok.has_routes &&
        ok.has_route_days &&
        ok.has_route_nodes &&
        ok.has_transport_nodes &&
        ok.has_attraction_nodes &&
        ok.has_restaurant_nodes;

      if (!hasAll) {
        // eslint-disable-next-line no-console
        console.warn('Routes markdown found, but itinerary tables are missing. Skipping routes seed. Did you apply deploy/db/schema.sql updates?');
      } else {
        for (const r of routesMd) {
          const { dayCount, nodeCount } = await seedRoute(pool, r);
          routesSeeded++;
          routeDaysSeeded += dayCount;
          routeNodesSeeded += nodeCount;
        }
      }
    }

    await pool.query('COMMIT');
    // eslint-disable-next-line no-console
    console.log('Seed completed:', {
      destinations: destinationsByKey.size,
      attractions: attractions.length,
      foods: foods.length,
      restaurants: restaurants.length,
      hotels: hotels.length,
      routes: routesSeeded,
      routeDays: routeDaysSeeded,
      routeNodes: routeNodesSeeded
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
