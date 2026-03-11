
import React from 'react';
import { TOURS } from '../constants';
import { RouteSummary, Tour } from '../types';

interface FeaturedToursProps {
  onOpenConsult: (source: string) => void;
  wishlist: string[];
  onToggleWishlist: (tourId: string) => void;
  onSelectTour: (tourId: string) => void;
  title?: string;
  subtitle?: string;
  items?: Array<Tour | RouteSummary>;
  hideViewAll?: boolean;
}

const DEFAULT_ROUTE_IMAGE =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1600';

const isRouteSummary = (item: Tour | RouteSummary): item is RouteSummary => {
  return 'routeName' in item;
};

const FeaturedTours: React.FC<FeaturedToursProps> = ({ 
  onOpenConsult, 
  wishlist, 
  onToggleWishlist,
  onSelectTour,
  title = "Popular China Tours",
  subtitle = "Hand-picked itineraries designed for unforgettable experiences.",
  items = TOURS,
  hideViewAll = false
}) => {
  return (
    <section className="py-20 bg-brand-lightBlue">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold text-brand-blue mb-4">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          {!hideViewAll && (
            <button className="mt-6 md:mt-0 text-brand-orange font-bold flex items-center hover:translate-x-1 transition-transform">
              View All Tours <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-20 text-center border-2 border-dashed border-gray-200">
            <i className="fa-regular fa-folder-open text-5xl text-gray-300 mb-6 block"></i>
            <h3 className="text-xl font-bold text-brand-blue mb-2">No items found</h3>
            <p className="text-gray-500">Try browsing our destinations for inspiration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => {
              const isRoute = isRouteSummary(item);
              const id = item.id;
              const titleText = isRoute ? item.routeName : item.title;
              const tagline = isRoute ? item.routeAlias || 'Curated multi-day route' : item.tagline;
              const highlights = item.highlights || [];
              const image = isRoute ? item.coverImages?.[0] || DEFAULT_ROUTE_IMAGE : item.image;
              const priceLabel = isRoute
                ? item.price != null
                  ? `${item.price}${item.priceUnit ? ` ${item.priceUnit}` : ''}`
                  : 'Contact'
                : `From $${item.price}`;
              const isInWishlist = wishlist.includes(id);
              return (
                <div 
                  key={id} 
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col h-full border border-gray-100 cursor-pointer"
                  onClick={() => onSelectTour(id)}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={image} 
                      alt={titleText} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(id);
                      }}
                      className={`absolute top-4 right-4 p-2.5 rounded-full shadow-md transition-all active:scale-90 z-10 ${
                        isInWishlist ? 'bg-brand-orange text-white' : 'bg-white/90 text-brand-orange hover:bg-white'
                      }`}
                    >
                      <i className={`${isInWishlist ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                    </button>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-center mb-3">
                      {isRoute ? (
                        <div className="flex items-center text-slate-500 text-xs font-bold">
                          <i className="fa-solid fa-calendar-day mr-1"></i> {item.totalDays} Days
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-500 text-xs font-bold">
                          <i className="fa-solid fa-star mr-1"></i> {item.rating} ({item.reviews})
                        </div>
                      )}
                      <div className="text-brand-orange font-extrabold text-xl">{priceLabel}</div>
                    </div>
                    <h3 className="text-xl font-bold text-brand-blue mb-2 leading-snug">{titleText}</h3>
                    <p className="text-gray-500 text-sm mb-4 font-light">{tagline}</p>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {highlights.slice(0, 3).map((h, i) => (
                        <span key={i} className="text-[10px] bg-brand-lightBlue text-brand-blue px-2 py-1 rounded-full uppercase tracking-tighter font-bold">{h}</span>
                      ))}
                    </div>
                    <div className="mt-auto">
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenConsult(`Tour: ${titleText}`);
                        }}
                        className="w-full bg-brand-orange text-white py-3 rounded-md font-bold hover:bg-brand-darkOrange transition-all shadow-md hover:shadow-lg"
                      >
                        Consult This Tour
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedTours;
