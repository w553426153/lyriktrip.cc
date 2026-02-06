import React, { useEffect, useMemo, useState } from 'react';
import type { Restaurant } from '../types';
import { fetchRestaurantDetail } from '../apiClient';

interface RestaurantDetailPageProps {
  restaurantId: string;
  onBack: () => void;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const RestaurantDetailPage: React.FC<RestaurantDetailPageProps> = ({ restaurantId, onBack }) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setRestaurant(null);

    fetchRestaurantDetail(restaurantId)
      .then((r) => {
        if (cancelled) return;
        setRestaurant(r);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const fallbackImage =
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1600';

  const heroImage = restaurant?.image || restaurant?.photoUrl || fallbackImage;
  const rating = toNumberOrNull(restaurant?.rating);
  const mustEatIndex = toNumberOrNull(restaurant?.mustEatIndex);

  const openInMapsUrl = useMemo(() => {
    const lat = toNumberOrNull(restaurant?.lat);
    const lng = toNumberOrNull(restaurant?.lng);
    if (lat != null && lng != null) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
    }
    const q = (restaurant?.address || restaurant?.name || '').trim();
    if (!q) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }, [restaurant?.address, restaurant?.lat, restaurant?.lng, restaurant?.name]);

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard APIs may be blocked; fallback to a prompt for manual copy.
      window.prompt('复制内容', text);
    }
  };

  if (loading) {
    return <div className="pt-32 text-center text-gray-500 min-h-screen">Loading restaurant...</div>;
  }

  if (!restaurant) {
    return (
      <div className="pt-32 text-center min-h-screen">
        <div className="text-red-500 mb-6">Failed to load restaurant: {error || 'Unknown error'}</div>
        <button
          onClick={onBack}
          className="bg-brand-blue text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition-all"
        >
          Back
        </button>
      </div>
    );
  }

  const recommendedDishes = (restaurant.recommendedDishes || []).filter(Boolean);
  const tags = (restaurant.tags || []).filter(Boolean);
  const nearbyAttractions = (restaurant.nearbyAttractions || []).filter(Boolean);

  const Fact: React.FC<{ icon: string; label: string; value?: string | null }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-brand-orange shrink-0">
          <i className={icon}></i>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</div>
          <div className="text-sm text-gray-600 break-words">{value}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[420px] overflow-hidden">
        <img src={heroImage} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex items-end">
          <div className="container mx-auto px-6 pb-12 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {restaurant.cuisineType && (
                <span className="text-[10px] bg-brand-orange px-2 py-1 rounded-full uppercase font-bold tracking-widest">
                  {restaurant.cuisineType}
                </span>
              )}
              {restaurant.priceRange && (
                <span className="text-[10px] bg-white/15 px-2 py-1 rounded-full uppercase font-bold tracking-widest">
                  {restaurant.priceRange}
                </span>
              )}
              {rating != null && (
                <span className="text-[10px] bg-white/15 px-2 py-1 rounded-full uppercase font-bold tracking-widest">
                  <i className="fa-solid fa-star mr-1 text-brand-orange"></i>
                  {rating.toFixed(1)}
                </span>
              )}
              {mustEatIndex != null && (
                <span className="text-[10px] bg-white/15 px-2 py-1 rounded-full uppercase font-bold tracking-widest">
                  Must-eat {mustEatIndex.toFixed(1)}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-3">{restaurant.name}</h1>
            {restaurant.address && <p className="text-lg md:text-xl font-light opacity-90 max-w-3xl">{restaurant.address}</p>}
          </div>
        </div>
        <button
          onClick={onBack}
          className="absolute top-24 left-6 md:left-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all z-20 shadow-lg"
          aria-label="Back"
        >
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
      </div>

      <div className="container mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main */}
          <div className="lg:col-span-2 space-y-12">
            {/* Tags */}
            {tags.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-brand-blue mb-6 flex items-center">
                  <i className="fa-solid fa-tags mr-3 text-brand-orange"></i>
                  Highlights
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 12).map((t, i) => (
                    <span
                      key={`${t}-${i}`}
                      className="bg-white border border-gray-200 text-gray-600 text-[11px] px-3 py-1 rounded-full font-bold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Recommended dishes */}
            {recommendedDishes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-brand-blue mb-6 flex items-center">
                  <i className="fa-solid fa-bowl-food mr-3 text-brand-orange"></i>
                  Recommended Dishes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recommendedDishes.slice(0, 18).map((dish, i) => (
                    <span
                      key={`${dish}-${i}`}
                      className="bg-brand-lightBlue text-brand-blue text-[11px] px-3 py-1 rounded-full font-bold"
                    >
                      {dish}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Practical info */}
            <section className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-bold text-brand-blue mb-8 flex items-center">
                <i className="fa-solid fa-circle-info mr-3 text-brand-orange"></i>
                Practical Info
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Fact icon="fa-solid fa-location-dot" label="Address" value={restaurant.address || null} />
                <Fact icon="fa-solid fa-clock" label="Opening Hours" value={restaurant.openingHours || null} />
                <Fact icon="fa-solid fa-phone" label="Phone" value={restaurant.phone || null} />
                <Fact icon="fa-solid fa-train" label="Nearby Transport" value={restaurant.nearbyTransport || null} />
                <Fact icon="fa-solid fa-wallet" label="Avg Cost" value={restaurant.avgCost || null} />
                <Fact icon="fa-solid fa-person-walking" label="Queue Status" value={restaurant.queueStatus || null} />
              </div>
            </section>

            {/* Nearby attractions */}
            {nearbyAttractions.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-brand-blue mb-6 flex items-center">
                  <i className="fa-solid fa-map-location-dot mr-3 text-brand-orange"></i>
                  Nearby Attractions
                </h2>
                <div className="flex flex-wrap gap-2">
                  {nearbyAttractions.slice(0, 18).map((a, i) => (
                    <span
                      key={`${a}-${i}`}
                      className="bg-white border border-gray-200 text-gray-600 text-[11px] px-3 py-1 rounded-full font-bold"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-brand-blue mb-6 flex items-center">
                  <i className="fa-solid fa-location-crosshairs mr-3 text-brand-orange"></i>
                  Get There
                </h3>

                <div className="space-y-4">
                  {restaurant.address && (
                    <button
                      onClick={() => copyText(restaurant.address || '')}
                      className="w-full bg-brand-lightBlue text-brand-blue py-3 rounded-xl font-bold hover:bg-orange-50 transition-all"
                    >
                      <i className="fa-regular fa-copy mr-2"></i> Copy Address
                    </button>
                  )}

                  {openInMapsUrl && (
                    <a
                      href={openInMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full bg-brand-orange text-white py-3 rounded-xl font-bold hover:bg-brand-darkOrange transition-all text-center"
                    >
                      <i className="fa-solid fa-map mr-2"></i> Open in Maps
                    </a>
                  )}

                  {restaurant.phone && (
                    <button
                      onClick={() => copyText(restaurant.phone || '')}
                      className="w-full bg-white border-2 border-brand-orange text-brand-orange py-3 rounded-xl font-bold hover:bg-orange-50 transition-all"
                    >
                      <i className="fa-solid fa-phone mr-2"></i> Copy Phone
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-brand-blue rounded-3xl p-8 text-white shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12">
                  <i className="fa-solid fa-utensils"></i>
                </div>
                <h3 className="text-xl font-bold mb-4 relative z-10">Tip</h3>
                <p className="text-white/75 text-sm leading-relaxed relative z-10">
                  Save this restaurant and share it with your travel butler. We can help schedule it into your route at the best time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailPage;

