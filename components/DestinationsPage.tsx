
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
  const provinceOrder = [
    'Beijing',
    'Tianjin',
    'Hebei',
    'Shanxi',
    'Inner Mongolia',
    'Liaoning',
    'Jilin',
    'Heilongjiang',
    'Shanghai',
    'Jiangsu',
    'Zhejiang',
    'Anhui',
    'Fujian',
    'Jiangxi',
    'Shandong',
    'Henan',
    'Hubei',
    'Hunan',
    'Guangdong',
    'Guangxi',
    'Hainan',
    'Chongqing',
    'Sichuan',
    'Guizhou',
    'Yunnan',
    'Tibet',
    'Shaanxi',
    'Gansu',
    'Qinghai',
    'Ningxia',
    'Xinjiang',
    'Hong Kong',
    'Macau'
  ];
  const provinceNameMap = new Map(provinceOrder.map((p) => [p.toLowerCase(), p]));
  const provinceOrderIndex = new Map(provinceOrder.map((p, i) => [p.toLowerCase(), i]));
  const municipalitySet = new Set(['Beijing', 'Tianjin', 'Shanghai', 'Chongqing', '北京', '天津', '上海', '重庆']);

  const normalizeProvince = (province?: string, city?: string, name?: string) => {
    const raw = String(province || '').trim();
    let p = raw;
    if (!p) {
      const c = String(city || name || '').trim();
      if (municipalitySet.has(c)) p = c;
      if (!p) p = c;
    }
    if (!p) return '';
    if (/\\s*Special Administrative Region$/i.test(p)) p = p.replace(/\\s*Special Administrative Region$/i, '');
    if (/\\s*SAR$/i.test(p)) p = p.replace(/\\s*SAR$/i, '');
    if (/\\s*Autonomous Region$/i.test(p)) p = p.replace(/\\s*Autonomous Region$/i, '');
    if (/\\s*Province$/i.test(p)) p = p.replace(/\\s*Province$/i, '');
    if (/\\s*Municipality$/i.test(p)) p = p.replace(/\\s*Municipality$/i, '');
    p = p.replace(/(省|市|自治区|特别行政区|行政区)$/g, '');
    return p;
  };

  const normalizeCityLabel = (city?: string, fallback?: string) => {
    let raw = String(city || fallback || '').trim();
    if (!raw) return '';
    if (!/(\\bRegion|\\bPrefecture|\\bLeague|\\bCounty)$/i.test(raw) && !municipalitySet.has(raw)) {
      raw = raw.replace(/\\s*City$/i, '');
    }
    raw = raw.replace(/市$/, '');
    return raw.trim();
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
    const grouped = new Map<string, Map<string, Destination>>();

    const pickBetter = (current: Destination, next: Destination) => {
      const currentHasImage = Boolean(current.image && String(current.image).trim());
      const nextHasImage = Boolean(next.image && String(next.image).trim());
      if (!currentHasImage && nextHasImage) return next;
      if (current.tourCount === (next.tourCount || 0)) return current;
      return (next.tourCount || 0) > (current.tourCount || 0) ? next : current;
    };

    for (const dest of items) {
      const cityLabel = normalizeCityLabel(dest.city, dest.name);
      const provinceName = normalizeProvince(dest.province, cityLabel, dest.name);
      const provinceLabel = provinceName || 'Other';
      const provinceKey = provinceNameMap.get(provinceLabel.toLowerCase()) || provinceLabel;

      const byCity = grouped.get(provinceKey) || new Map<string, Destination>();
      const existing = byCity.get(cityLabel);
      const next = { ...dest, city: cityLabel };
      byCity.set(cityLabel, existing ? pickBetter(existing, next) : next);
      grouped.set(provinceKey, byCity);
    }

    const groups = Array.from(grouped.entries()).map(([province, byCity]) => {
      const destinations = Array.from(byCity.values()).sort((a, b) =>
        String(a.city || a.name).localeCompare(String(b.city || b.name), 'en')
      );
      return { province, destinations };
    });

    groups.sort((a, b) => {
      const aIndex = provinceOrderIndex.get(a.province.toLowerCase()) ?? 9999;
      const bIndex = provinceOrderIndex.get(b.province.toLowerCase()) ?? 9999;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return String(a.province).localeCompare(String(b.province));
    });

    return groups.filter((group) => group.destinations.length > 0);
  }, [items]);

  const provinceNav = useMemo(
    () =>
      provinceGroups.map((group) => ({
        name: group.province,
        id: `province-${group.province}`
      })),
    [provinceGroups]
  );

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

        <div className="lg:hidden mb-8">
          <div className="text-sm font-semibold text-gray-500 mb-3">Browse by Province</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {provinceNav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold text-brand-blue whitespace-nowrap hover:border-brand-blue/50 hover:text-brand-darkBlue transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-28">
              <div className="text-sm font-semibold text-gray-500 mb-4">Browse by Province</div>
              <div className="space-y-2">
                {provinceNav.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block px-4 py-2 rounded-lg text-sm font-semibold text-brand-blue hover:bg-brand-blue/5 hover:text-brand-darkBlue transition-colors"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1 space-y-16">
            {provinceGroups.map((group) => (
              <section key={group.province} id={`province-${group.province}`}>
                <div className="flex items-end justify-between mb-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-brand-blue">{group.province}</h2>
                  <span className="text-sm text-gray-500">{group.destinations.length} Cities</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
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
    </div>
  );
};

export default DestinationsPage;
