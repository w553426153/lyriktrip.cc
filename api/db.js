import pg from 'pg';

const { Pool } = pg;

export function createPool() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  return new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000
  });
}

export function parsePageParams(query) {
  const page = Math.max(1, Math.min(10_000, Number(query?.page) || 1));
  const pageSize = Math.max(1, Math.min(100, Number(query?.pageSize) || 20));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

export function parseInclude(query, allowed, defaults) {
  const raw = String(query?.include || '').trim();
  if (!raw) return new Set(defaults);
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set();
  for (const p of parts) {
    if (allowed.has(p)) set.add(p);
  }
  return set.size > 0 ? set : new Set(defaults);
}

