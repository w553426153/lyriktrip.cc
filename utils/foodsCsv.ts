import type { Destination, Food, Attraction } from '../types';

type CsvFoodRow = {
  dishName: string;
  dishPhoto: string;
  dishDescription: string;
  restaurantName: string;
  restaurantAddress: string;
  phone: string;
  nearbyTransport: string;
  openingHours: string;
  mustTryIndex: string;
  avgCost: string;
  queueStatus: string;
  nearbyAttractions: string;
};

const FOODS_CSV_URL = new URL('../DATA/foods.csv', import.meta.url).toString();

let cachedRows: CsvFoodRow[] | null = null;
let inflight: Promise<CsvFoodRow[]> | null = null;

function normalizeText(value: unknown): string {
  return String(value ?? '').normalize('NFKC').trim();
}

function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function slugify(value: string): string {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function splitNearbyAttractions(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[,、;]+/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function parseFoodsRows(text: string): CsvFoodRow[] {
  const rows = parseCsv(text);
  if (!rows.length) return [];

  const headers = rows[0].map((h) => normalizeText(h).replace(/^\uFEFF/, ''));
  const headerIndex = new Map(headers.map((h, idx) => [normalizeLower(h), idx]));
  const pick = (row: string[], name: string) => {
    const idx = headerIndex.get(normalizeLower(name));
    return idx == null ? '' : row[idx] || '';
  };

  return rows.slice(1).map((row) => ({
    dishName: pick(row, 'Dish Name'),
    dishPhoto: pick(row, 'Dish Photo'),
    dishDescription: pick(row, 'Dish Description'),
    restaurantName: pick(row, 'Recommended Restaurant'),
    restaurantAddress: pick(row, 'Restaurant Address'),
    phone: pick(row, 'Phone'),
    nearbyTransport: pick(row, 'Nearby Transport'),
    openingHours: pick(row, 'Opening Hours'),
    mustTryIndex: pick(row, 'Must-Try Index'),
    avgCost: pick(row, 'Avg Cost'),
    queueStatus: pick(row, 'Queue Status'),
    nearbyAttractions: pick(row, 'Nearby Attractions')
  }));
}

async function loadFoodsCsv(): Promise<CsvFoodRow[]> {
  if (cachedRows) return cachedRows;
  if (!inflight) {
    inflight = fetch(FOODS_CSV_URL)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to load foods CSV: ${res.status} ${text || res.statusText}`);
        }
        const text = await res.text();
        const rows = parseFoodsRows(text);
        cachedRows = rows;
        return rows;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

function buildAttractionKeySet(attractions?: Attraction[]): Set<string> {
  const keys = new Set<string>();
  (attractions || []).forEach((attr) => {
    const names = [attr.name, attr.nameEn, attr.nameZh];
    names.forEach((name) => {
      const normalized = normalizeLower(name);
      if (normalized) keys.add(normalized);
    });
  });
  return keys;
}

function matchesDestination(row: CsvFoodRow, destination: Destination, attractionKeys: Set<string>): boolean {
  const nearbyList = splitNearbyAttractions(row.nearbyAttractions);
  const normalizedNearby = nearbyList.map((item) => normalizeLower(item)).filter(Boolean);
  if (normalizedNearby.some((item) => attractionKeys.has(item))) return true;

  const destinationKey = normalizeLower(destination.name);
  const cityKey = normalizeLower(destination.city);
  const provinceKey = normalizeLower(destination.province);
  const address = normalizeLower(row.restaurantAddress);

  if (destinationKey && (normalizedNearby.includes(destinationKey) || address.includes(destinationKey))) return true;
  if (cityKey && (normalizedNearby.includes(cityKey) || address.includes(cityKey))) return true;
  if (provinceKey && address.includes(provinceKey)) return true;

  return false;
}

function toNullable(value: string): string | null {
  const normalized = normalizeText(value);
  return normalized ? normalized : null;
}

export async function loadFoodsForDestination(destination: Destination): Promise<Food[]> {
  const rows = await loadFoodsCsv();
  const attractionKeys = buildAttractionKeySet(destination.attractions);
  const destSlug = slugify(destination.id || destination.name);

  return rows
    .filter((row) => matchesDestination(row, destination, attractionKeys))
    .map((row) => {
      const dishName = normalizeText(row.dishName);
      const id = `food-${destSlug}-${slugify(dishName)}`;
      return {
        id,
        name: dishName,
        image: toNullable(row.dishPhoto),
        reason: toNullable(row.dishDescription),
        restaurantName: toNullable(row.restaurantName),
        restaurantAddress: toNullable(row.restaurantAddress),
        phone: toNullable(row.phone),
        nearbyTransport: toNullable(row.nearbyTransport),
        openingHours: toNullable(row.openingHours),
        mustEatIndex: toNullable(row.mustTryIndex),
        avgCost: toNullable(row.avgCost),
        queueStatus: toNullable(row.queueStatus)
      };
    })
    .filter((food) => Boolean(food.name));
}
