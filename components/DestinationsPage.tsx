
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetchDestinations({ page: 1, pageSize: 200 })
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

  const destinations = useMemo(() => items, [items]);
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {destinations.map((dest) => (
            <div 
              key={dest.id} 
              className="group cursor-pointer bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all"
              onClick={() => onSelectDestination(dest.id, dest.name)}
            >
              <div className="relative h-72 overflow-hidden">
                <img 
                  src={dest.image || fallbackImage} 
                  alt={dest.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-brand-blue shadow-sm">
                  {dest.tourCount || 0} Tours Available
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-brand-blue mb-3">{dest.name}</h3>
                <p className="text-gray-500 mb-6 leading-relaxed text-sm">{dest.description}</p>
                <div className="flex items-center text-brand-orange font-bold">
                  View Details <i className="fa-solid fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DestinationsPage;
