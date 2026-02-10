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
  const byId = new Map();
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
  // - "⏱️ 总耗时：约 15 分钟"
  // - "⏱️ 总耗时：约 1.5 小时"
  // - "总耗时：约 2 小时"
  const min = s.match(/约?\s*([\d.]+)\s*分钟/);
  if (min) {
    const n = Number(min[1]);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const hr = s.match(/约?\s*([\d.]+)\s*小时/);
  if (hr) {
    const n = Number(hr[1]);
    return Number.isFinite(n) ? Math.round(n * 60) : null;
  }
  return null;
}

function parseMoneyNumber(line) {
  const s = String(line || '');
  const m = s.match(/([\d.]+)/);
  if (!m) return null;
  const n = Number(m[1]);
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
  if (s.includes('：')) return false;
  // Exclude itinerary node headers (they also start with emoji).
  if (/^(📅|📍|🚇|🍜|🍽️)\s*/u.test(s)) return false;
  // A loose heuristic: highlight/dish titles tend to be short.
  if (s.length > 60) return false;
  return /^\p{Extended_Pictographic}/u.test(s);
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

  const routeName = collectKeyValue(headerLines, '行程主标题') || routeId;
  const routeAlias = collectKeyValue(headerLines, '行程副标题');

  const priceRaw = collectKeyValue(headerLines, '价格');
  const price = priceRaw ? parseMoneyNumber(priceRaw) : null;
  const priceUnit = priceRaw ? String(priceRaw).replace(/^[\s\d.]+/, '').trim() || null : null;

  const recIdx = headerLines.findIndex((l) => String(l || '').trim() === '推荐理由');
  const introIdx = headerLines.findIndex((l) => String(l || '').trim() === '行程简介');
  const hlIdx = headerLines.findIndex((l) => String(l || '').trim() === '核心亮点');
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
      const mt = l.match(/^🚇\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s*\|\s*交通：(.+)$/u);
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
          block.find((l) => /^(🟢\s*)?(上车地点|出发地点)：/u.test(String(l || '').trim())) ||
          block.find((l) => /^📍\s*出发地点：/u.test(String(l || '').trim())) ||
          null;
        const toLine =
          block.find((l) => /^(🔴\s*)?(下车地点|到达地点)：/u.test(String(l || '').trim())) || null;

        const fromLocation = fromLine ? String(fromLine).replace(/^(🟢\s*)?(上车地点|出发地点)：\s*/u, '').replace(/^📍\s*出发地点：\s*/u, '').trim() : null;
        const toLocation = toLine ? String(toLine).replace(/^(🔴\s*)?(下车地点|到达地点)：\s*/u, '').trim() : null;

        const costLine = block.find((l) => String(l || '').includes('票价'));
        const cost = costLine ? parseMoneyNumber(costLine) : null;

        const method =
          block.some((l) => String(l || '').includes('步行') || String(l || '').trim().startsWith('👣'))
            ? '步行'
            : block.some((l) => String(l || '').includes('地铁') || String(l || '').trim().startsWith('🚊'))
              ? '地铁'
              : block.some((l) => String(l || '').includes('公交'))
                ? '公交'
                : block.some((l) => String(l || '').includes('打车') || String(l || '').includes('出租车'))
                  ? '打车'
                  : '交通';

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

        const address = (block.find((l) => String(l || '').trim().startsWith('地址：')) || '').replace(/^地址：\s*/, '').trim() || null;
        const openingHours = (block.find((l) => String(l || '').trim().startsWith('开放时间：')) || '').replace(/^开放时间：\s*/, '').trim() || null;
        const ticketPrice = (block.find((l) => String(l || '').trim().startsWith('门票：')) || '').replace(/^门票：\s*/, '').trim() || null;
        const suggestedDuration = (block.find((l) => String(l || '').trim().startsWith('建议游览时间：')) || '').replace(/^建议游览时间：\s*/, '').trim() || null;
        const bestSeason = (block.find((l) => String(l || '').trim().startsWith('最佳游览季节：')) || '').replace(/^最佳游览季节：\s*/, '').trim() || null;

        const introMarkerIdx = block.findIndex((l) => String(l || '').trim() === '景点介绍');
        const highlightMarkerIdx = block.findIndex((l) => /^(游览要点|观光亮点|建筑亮点|最佳拍照点)$/u.test(String(l || '').trim()));

        const desc =
          introMarkerIdx !== -1
            ? collectSectionText(block, introMarkerIdx + 1, highlightMarkerIdx !== -1 ? highlightMarkerIdx : block.length) || null
            : null;

        let highlightItems = null;
        if (highlightMarkerIdx !== -1) {
          const rest = block.slice(highlightMarkerIdx + 1).map((l) => String(l || '').trimEnd());
          const items = [];
          let current = null;
          let buf = [];
          for (const l of rest) {
            const s = String(l || '').trim();
            if (!s) continue;
            if (isEmojiTitleLine(s)) {
              if (current) {
                items.push({ title: current, content: buf.join('\n').trim() || null });
              }
              current = s;
              buf = [];
            } else if (current) {
              buf.push(s);
            }
          }
          if (current) items.push({ title: current, content: buf.join('\n').trim() || null });
          highlightItems = items.length ? items : null;
        }

        const notes = block
          .filter((l) => /：/.test(String(l || '').trim()))
          .filter((l) => !/^(地址|开放时间|门票|建议游览时间|最佳游览季节)[:：]/u.test(String(l || '').trim()))
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
        const headerName = headerLabel.includes('：') ? headerLabel.split('：').slice(1).join('：').trim() : headerLabel;
        const nameLine = block.find((l) => String(l || '').trim().startsWith('餐厅名称：'));
        const name = nameLine ? String(nameLine).replace(/^餐厅名称：\s*/, '').trim() : headerName;

        const address = (block.find((l) => String(l || '').trim().startsWith('地址：')) || '').replace(/^地址：\s*/, '').trim() || null;
        const avgCostLine = block.find((l) => String(l || '').trim().startsWith('人均消费：'));
        const avgCost = avgCostLine ? parseMoneyNumber(avgCostLine) : null;
        const mustEatLine = block.find((l) => String(l || '').trim().startsWith('必吃指数：'));
        const mustEatRating = mustEatLine ? countStars(mustEatLine) : null;
        const queueStatus = (block.find((l) => String(l || '').trim().startsWith('排队情况：')) || '').replace(/^排队情况：\s*/, '').trim() || null;
        const phoneLine = block.find((l) => String(l || '').includes('联系电话'));
        const phone = phoneLine ? String(phoneLine).replace(/^.*联系电话：\s*/u, '').trim() : null;
        const businessHours = (block.find((l) => String(l || '').trim().startsWith('营业时间：')) || '').replace(/^营业时间：\s*/, '').trim() || null;

        const bgIdx = block.findIndex((l) => String(l || '').trim() === '餐厅背景');
        const dishesIdx = block.findIndex((l) => String(l || '').trim() === '推荐菜品');

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
    coverImages: [],
    totalDays: days.length || dayMarkers.length || null,
    status: 1,
    days
  };
}

async function loadRouteMarkdownFiles(dataDir) {
  const routesDir = path.join(dataDir, 'routes');
  try {
    await access(routesDir);
  } catch {
    return [];
  }

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
        const highlightsJson = a.highlights != null ? JSON.stringify(a.highlights) : null;
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
    const attractionsRaw = await loadDataOptional(dataDir, 'attractions');
    const restaurantsRaw = await loadDataOptional(dataDir, 'restaurants');
    const foodsRaw = await loadDataOptional(dataDir, 'foods');
    const hotels = await loadDataOptional(dataDir, 'hotels');
    const routesMd = await loadRouteMarkdownFiles(dataDir);

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
