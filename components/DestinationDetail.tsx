
import React from 'react';
import { Destination, Tour, Attraction, Food } from '../types';
import FeaturedTours from './FeaturedTours';

interface DestinationDetailProps {
  destination: Destination;
  relatedTours: Tour[];
  onOpenConsult: (source: string) => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onSelectTour: (id: string) => void;
  onBack: () => void;
}

const DestinationDetail: React.FC<DestinationDetailProps> = ({
  destination,
  relatedTours,
  onOpenConsult,
  wishlist,
  onToggleWishlist,
  onSelectTour,
  onBack
}) => {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[450px] overflow-hidden">
        <img src={destination.image} alt={destination.name} className="w-full h-full object-cover" />
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
                    <div key={i} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all flex flex-col md:flex-row min-h-[300px]">
                      <div className="md:w-2/5 relative overflow-hidden h-64 md:h-auto">
                        <img src={attr.image} alt={attr.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute top-4 left-4 bg-brand-orange text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                          <i className="fa-solid fa-star mr-1"></i> {attr.rating} Rating
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(attr.id);
                          }}
                          className={`absolute top-4 right-4 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all transform active:scale-90 z-10 ${
                            isLiked ? 'bg-brand-orange text-white' : 'bg-white/90 text-brand-orange hover:bg-white'
                          }`}
                        >
                          <i className={`${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                        </button>
                      </div>
                      <div className="md:w-3/5 p-8 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {attr.tags.map((tag, ti) => (
                              <span key={ti} className="text-[10px] bg-brand-lightBlue text-brand-blue px-3 py-1 rounded-full font-bold uppercase tracking-widest">{tag}</span>
                            ))}
                          </div>
                          <h4 className="text-2xl font-bold text-brand-blue mb-3">{attr.name}</h4>
                          <p className="text-gray-500 mb-6 leading-relaxed">{attr.reason}</p>
                        </div>
                        
                        {attr.topReview && (
                          <div className="bg-orange-50/50 p-4 rounded-2xl border-l-4 border-brand-orange italic text-sm text-gray-600 relative">
                            <i className="fa-solid fa-quote-left absolute -top-2 -left-1 text-brand-orange/20 text-3xl"></i>
                            <p className="relative z-10">"{attr.topReview}"</p>
                            <div className="text-[10px] font-bold text-brand-orange mt-2 uppercase tracking-tighter">— Top Traveler Review</div>
                          </div>
                        )}
                      </div>
                    </div>
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
                {(destination.famousFoods || []).map((food, i) => {
                  const isLiked = wishlist.includes(food.id);
                  return (
                    <div key={i} className="bg-gray-50/50 rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row">
                      <div className="md:w-1/3 h-64 md:h-auto relative">
                        <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
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
                            {food.tags.map((t, ti) => (
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
