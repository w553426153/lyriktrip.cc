import type { Destination, Restaurant } from './types';

export type DestinationsListResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: Destination[];
};

async function apiGetJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export function fetchDestinations(params?: { q?: string; page?: number; pageSize?: number }) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.page) search.set('page', String(params.page));
  if (params?.pageSize) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return apiGetJson<DestinationsListResponse>(`/api/v1/destinations${qs ? `?${qs}` : ''}`);
}

export function fetchDestinationDetail(id: string, include?: string[]) {
  const search = new URLSearchParams();
  if (include?.length) search.set('include', include.join(','));
  const qs = search.toString();
  return apiGetJson<Destination>(`/api/v1/destinations/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`);
}

export function fetchRestaurantDetail(id: string) {
  return apiGetJson<Restaurant>(`/api/v1/restaurants/${encodeURIComponent(id)}`);
}
