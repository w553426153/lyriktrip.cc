
import React, { useMemo } from 'react';
import { Destination, Tour, Attraction, Food } from '../types';
import FeaturedTours from './FeaturedTours';
import ScenicSpotCardExpanded from './ScenicSpotCardExpanded';

type FoodRestaurantRef = {
  id?: string | null;
  name: string;
  address?: string | null;
};

type AggregatedFood = Food & {
  restaurants: FoodRestaurantRef[];
};

function aggregateFoodsByName(foods: Food[]): AggregatedFood[] {
  const byName = new Map<string, Food[]>();

  for (const food of foods) {
    const key = String(food?.name || '').trim();
    if (!key) continue;
    const list = byName.get(key);
    if (list) list.push(food);
    else byName.set(key, [food]);
  }

  const aggregated: AggregatedFood[] = [];

  for (const [name, list] of byName) {
    // Pick a representative item for the card body.
    const base =
      list.find((f) => String(f.image || '').trim() && String(f.reason || '').trim()) ||
      list.find((f) => String(f.image || '').trim()) ||
      list.find((f) => String(f.reason || '').trim()) ||
      list[0];

    const restaurantsByKey = new Map<string, FoodRestaurantRef>();
    for (const f of list) {
      const restName = String((f as Food).restaurantName || '').trim();
      if (!restName) continue;
      const restId = (f as Food).restaurantId || null;
      const restAddr = (f as Food).restaurantAddress || null;

      const dedupeKey = restId ? `id:${restId}` : `name:${restName}|addr:${restAddr || ''}`;
      if (!restaurantsByKey.has(dedupeKey)) {
        restaurantsByKey.set(dedupeKey, { id: restId, name: restName, address: restAddr });
      }
    }

    const restaurants = Array.from(restaurantsByKey.values()).sort((a, b) => a.name.localeCompare(b.name));

    aggregated.push({
      ...base,
      name,
      restaurants
    });
  }

  aggregated.sort((a, b) => {
    const byCount = (b.restaurants?.length || 0) - (a.restaurants?.length || 0);
    if (byCount !== 0) return byCount;
    return a.name.localeCompare(b.name);
  });

  return aggregated;
}

interface DestinationDetailProps {
  destination: Destination;
  relatedTours: Tour[];
  onOpenConsult: (source: string) => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onSelectTour: (id: string) => void;
  onSelectRestaurant: (id: string) => void;
  onBack: () => void;
}

const DestinationDetail: React.FC<DestinationDetailProps> = ({
  destination,
  relatedTours,
  onOpenConsult,
  wishlist,
  onToggleWishlist,
  onSelectTour,
  onSelectRestaurant,
  onBack
}) => {
  const fallbackImage =
    'https://images.unsplash.com/photo-1504109586057-7a2ae83d1338?auto=format&fit=crop&q=80&w=1600';

  const foods = useMemo(() => aggregateFoodsByName(destination.famousFoods || []), [destination.famousFoods]);
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[450px] overflow-hidden">
        <img src={destination.image || fallbackImage} alt={destination.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-6 mt-16">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 drop-shadow-2xl">{destination.name}</h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light drop-shadow-lg">{destination.description}</p>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="absolute top-24 left-6 md:left-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all z-20 shadow-lg"
        >
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-brand-blue mb-6">About {destination.name}</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-12">
              {destination.longDescription || destination.description}
            </p>

            {/* Attractions / Highlights */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-brand-blue mb-8 flex items-center">
                <i className="fa-solid fa-camera-retro mr-3 text-brand-orange"></i>
                Must-Visit Highlights
              </h3>
              <div className="grid grid-cols-1 gap-10">
                {(destination.attractions || []).map((attr, i) => {
                  const isLiked = wishlist.includes(attr.id);
                  return (
                    <ScenicSpotCardExpanded
                      key={attr.id || i}
                      spot={attr}
                      isLiked={isLiked}
                      onToggleWishlist={onToggleWishlist}
                    />
                  );
                })}
              </div>
            </div>

            {/* Local Cuisine */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-brand-blue mb-8 flex items-center">
                <i className="fa-solid fa-utensils mr-3 text-brand-orange"></i>
                Taste of {destination.name}
              </h3>
              <div className="grid grid-cols-1 gap-8">
                {foods.map((food, i) => {
                  const isLiked = wishlist.includes(food.id);
                  return (
                    <div
                      key={food.name || i}
                      className="bg-gray-50/50 rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row"
                    >
                      <div className="md:w-1/3 h-64 md:h-auto relative">
                        <img src={food.image || fallbackImage} alt={food.name} className="w-full h-full object-cover" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(food.id);
                          }}
                          className={`absolute top-4 right-4 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all transform active:scale-90 z-10 ${
                            isLiked ? 'bg-brand-orange text-white' : 'bg-white/90 text-brand-orange hover:bg-white'
                          }`}
                        >
                          <i className={`${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                        </button>
                      </div>
                      <div className="md:w-2/3 p-8">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-brand-blue mb-1">{food.name}</h4>
                            <div className="flex items-center space-x-3 text-xs text-gray-400">
                               <span className="flex items-center text-brand-orange font-bold">{food.priceRange}</span>
                               <span>•</span>
                               <span>{food.reviews}+ Reviews</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(food.tags || []).map((t, ti) => (
                              <span key={ti} className="bg-white border border-gray-200 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{t}</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">"{food.reason}"</p>
                        
                        {food.topReview && (
                          <div className="bg-white p-4 rounded-2xl border border-gray-100 text-xs text-gray-500 italic flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-brand-lightBlue flex items-center justify-center text-brand-orange shrink-0">
                              <i className="fa-solid fa-comment-dots"></i>
                            </div>
                            <div>
                              <p>"{food.topReview}"</p>
                              <span className="text-[9px] font-bold uppercase text-gray-400 mt-1 block">Verified Feedback</span>
                            </div>
                          </div>
                        )}

                        {(food.restaurants || []).length > 0 && (
                          <div className="mt-6">
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center">
                              <i className="fa-solid fa-location-dot text-brand-orange mr-2"></i>
                              Recommended Restaurants
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(food.restaurants || []).map((r) => {
                                const clickable = Boolean(r.id);
                                const label = r.name;
                                return (
                                  <button
                                    key={`${r.id || r.name}`}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!r.id) return;
                                      onSelectRestaurant(r.id);
                                    }}
                                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                                      clickable
                                        ? 'bg-white border-gray-200 text-brand-blue hover:bg-orange-50'
                                        : 'bg-gray-100 border-gray-100 text-gray-400 cursor-default'
                                    }`}
                                    title={r.address || label}
                                    aria-disabled={!clickable}
                                    disabled={!clickable}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="sticky top-24">
              <div className="bg-brand-blue rounded-3xl p-8 text-white shadow-xl mb-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12">
                   <i className="fa-solid fa-compass"></i>
                </div>
                <h3 className="text-xl font-bold mb-4 relative z-10">Plan Your Visit</h3>
                <p className="text-white/70 text-sm mb-6 relative z-10">Our local butlers in {destination.name} are ready to help you navigate this amazing city.</p>
                <button 
                  onClick={() => onOpenConsult(`Destination Detail: ${destination.name}`)}
                  className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold hover:bg-brand-darkOrange transition-all shadow-lg relative z-10"
                >
                  Request Custom Roadbook
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-3xl p-8 bg-white shadow-sm">
                <h4 className="font-bold text-brand-blue mb-6 flex items-center">
                  <i className="fa-solid fa-lightbulb text-brand-orange mr-2"></i> Local Insights
                </h4>
                <ul className="space-y-6">
                  <li className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-brand-orange shrink-0">
                      <i className="fa-solid fa-cloud-sun"></i>
                    </div>
                    <div className="text-sm">
                      <p className="font-bold text-brand-blue">Best Time</p>
                      <p className="text-gray-500">April to October offers the mildest weather.</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-brand-orange shrink-0">
                      <i className="fa-solid fa-train"></i>
                    </div>
                    <div className="text-sm">
                      <p className="font-bold text-brand-blue">Transportation</p>
                      <p className="text-gray-500">Major high-speed rail hub connecting all provinces.</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-brand-orange shrink-0">
                      <i className="fa-solid fa-credit-card"></i>
                    </div>
                    <div className="text-sm">
                      <p className="font-bold text-brand-blue">Payments</p>
                      <p className="text-gray-500">Alipay is widely accepted even in small stalls.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeaturedTours 
        onOpenConsult={onOpenConsult}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onSelectTour={onSelectTour}
        items={relatedTours}
        title={`Routes including ${destination.name}`}
        subtitle="Explore our hand-picked itineraries featuring this destination."
        hideViewAll
      />
    </div>
  );
};

export default DestinationDetail;
