
import React, { useEffect, useMemo, useState } from 'react';
import { Page } from '../types';
import type { Destination } from '../types';
import { fetchDestinations } from '../apiClient';

interface DestinationsPageProps {
  onNavigate: (page: Page) => void;
  onSelectDestination: (id: string, name?: string) => void;
}

const DestinationsPage: React.FC<DestinationsPageProps> = ({ onNavigate, onSelectDestination }) => {
  const [items, setItems] = useState<Destination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const municipalityOrder = ['北京市', '上海市', '天津市', '重庆市'];
  const municipalitySet = new Set(municipalityOrder);

  const normalizeProvince = (province?: string, city?: string, name?: string) => {
    const p = String(province || '').trim();
    if (p) return p;
    const c = String(city || name || '').trim();
    if (!c) return '其他';
    if (municipalitySet.has(c)) return c;
    return '其他';
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetchDestinations({ page: 1, pageSize: 1000 })
      .then((res) => {
        if (cancelled) return;
        setItems(Array.isArray(res.items) ? res.items : []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setItems([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const provinceGroups = useMemo(() => {
    const grouped = new Map<string, Destination[]>();
    for (const dest of items) {
      const cityName = String(dest.city || dest.name || '').trim();
      const provinceName = normalizeProvince(dest.province, cityName, dest.name);
      const list = grouped.get(provinceName) || [];
      list.push({ ...dest, city: cityName || dest.name });
      grouped.set(provinceName, list);
    }

    const compareProvince = (a: string, b: string) => {
      const ia = municipalityOrder.indexOf(a);
      const ib = municipalityOrder.indexOf(b);
      const aIsMunicipality = ia >= 0;
      const bIsMunicipality = ib >= 0;
      if (aIsMunicipality && bIsMunicipality) return ia - ib;
      if (aIsMunicipality) return -1;
      if (bIsMunicipality) return 1;
      return a.localeCompare(b, 'zh-Hans-CN');
    };

    return Array.from(grouped.entries())
      .sort((a, b) => compareProvince(a[0], b[0]))
      .map(([province, destinations]) => ({
        province,
        destinations: destinations.sort((a, b) =>
          String(a.city || a.name).localeCompare(String(b.city || b.name), 'zh-Hans-CN')
        )
      }));
  }, [items]);

  const fallbackImage =
    'https://images.unsplash.com/photo-1504109586057-7a2ae83d1338?auto=format&fit=crop&q=80&w=1600';

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative h-[45vh] flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1504109586057-7a2ae83d1338?auto=format&fit=crop&q=80&w=1600" 
          alt="China Landscapes" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center text-white px-6 mt-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">Discover Your China</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto font-light leading-relaxed">From futuristic skylines to ancient wonders, explore cities that redefine the boundaries of history.</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20">
        {loading && (
          <div className="text-center text-gray-500 py-10">Loading destinations...</div>
        )}
        {!loading && error && (
          <div className="text-center text-red-500 py-10">
            Failed to load destinations: {error}
          </div>
        )}

        {!loading && !error && provinceGroups.length === 0 && (
          <div className="text-center text-gray-500 py-10">No destinations found.</div>
        )}

        <div className="space-y-16">
          {provinceGroups.map((group) => (
            <section key={group.province}>
              <div className="flex items-end justify-between mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-brand-blue">{group.province}</h2>
                <span className="text-sm text-gray-500">{group.destinations.length} Cities</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {group.destinations.map((dest) => (
                  <div
                    key={dest.id}
                    className="group cursor-pointer bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all"
                    onClick={() => onSelectDestination(dest.id, dest.name)}
                  >
                    <div className="relative h-72 overflow-hidden">
                      <img
                        src={dest.image || fallbackImage}
                        alt={dest.city || dest.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                      <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-brand-blue shadow-sm">
                        {dest.tourCount || 0} Tours Available
                      </div>
                    </div>

                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-brand-blue mb-3">{dest.city || dest.name}</h3>
                      <p className="text-gray-500 mb-6 leading-relaxed text-sm">{dest.description}</p>
                      <div className="flex items-center text-brand-orange font-bold">
                        View Details <i className="fa-solid fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DestinationsPage;
