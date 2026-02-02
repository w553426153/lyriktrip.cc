
import React, { useState } from 'react';
import { Tour } from '../types';

interface TourDetailProps {
  tour: Tour;
  onOpenConsult: (source: string) => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onBack: () => void;
}

const TourDetail: React.FC<TourDetailProps> = ({
  tour,
  onOpenConsult,
  wishlist,
  onToggleWishlist,
  onBack
}) => {
  const isInWishlist = wishlist.includes(tour.id);
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'inclusions'>('overview');
  const [activeDay, setActiveDay] = useState<number | null>(1);

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative h-[65vh] overflow-hidden">
        <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
          <div className="container mx-auto px-6 pb-12 text-white">
            <div className="flex items-center space-x-2 mb-4">
               {tour.highlights.slice(0, 2).map((h, i) => (
                 <span key={i} className="text-[10px] bg-brand-orange px-2 py-1 rounded-full uppercase font-bold tracking-widest">{h}</span>
               ))}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{tour.title}</h1>
            <p className="text-lg md:text-xl font-light opacity-90 max-w-3xl">{tour.tagline}</p>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="absolute top-24 left-6 md:left-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all z-20 shadow-lg"
        >
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
      </div>

      <div className="container mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs Navigation */}
            <div className="flex space-x-8 border-b border-gray-100 mb-10 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-4 font-bold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === 'overview' ? 'border-brand-orange text-brand-blue' : 'border-transparent text-gray-400 hover:text-brand-blue'
                }`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('itinerary')}
                className={`pb-4 font-bold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === 'itinerary' ? 'border-brand-orange text-brand-blue' : 'border-transparent text-gray-400 hover:text-brand-blue'
                }`}
              >
                Daily Itinerary
              </button>
              <button 
                onClick={() => setActiveTab('inclusions')}
                className={`pb-4 font-bold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === 'inclusions' ? 'border-brand-orange text-brand-blue' : 'border-transparent text-gray-400 hover:text-brand-blue'
                }`}
              >
                Inclusions
              </button>
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="animate-fade-in">
                <div className="prose max-w-none text-gray-600 mb-12">
                  <h2 className="text-2xl font-bold text-brand-blue mb-4">Trip Overview</h2>
                  <p className="text-lg leading-relaxed mb-6">{tour.description || tour.tagline}</p>
                  
                  <h3 className="text-xl font-bold text-brand-blue mb-4">Highlights</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0">
                    {tour.highlights.map((h, i) => (
                      <li key={i} className="flex items-center space-x-2 text-gray-600">
                        <i className="fa-solid fa-circle-check text-brand-orange"></i>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab: Itinerary */}
            {activeTab === 'itinerary' && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-bold text-brand-blue mb-8">Detailed Route</h3>
                <div className="space-y-4 mb-12">
                  {(tour.itinerary || []).map((step) => (
                    <div key={step.day} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setActiveDay(activeDay === step.day ? null : step.day)}
                        className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-all text-left"
                      >
                        <div className="flex items-center space-x-4">
                          <span className="w-10 h-10 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center font-bold">D{step.day}</span>
                          <h4 className="font-bold text-brand-blue">{step.title}</h4>
                        </div>
                        <i className={`fa-solid fa-chevron-${activeDay === step.day ? 'up' : 'down'} text-gray-400`}></i>
                      </button>
                      {activeDay === step.day && (
                        <div className="p-6 pt-0 bg-white text-gray-500 text-sm leading-relaxed animate-fade-in">
                          {step.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Inclusions */}
            {activeTab === 'inclusions' && (
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                    <h4 className="font-bold text-green-800 mb-4 flex items-center">
                      <i className="fa-solid fa-circle-plus mr-2"></i> What's Included
                    </h4>
                    <ul className="space-y-2 text-sm text-green-700">
                      {(tour.included || []).map((item, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <i className="fa-solid fa-check mt-1"></i>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                    <h4 className="font-bold text-red-800 mb-4 flex items-center">
                      <i className="fa-solid fa-circle-minus mr-2"></i> Not Included
                    </h4>
                    <ul className="space-y-2 text-sm text-red-700">
                      {(tour.excluded || []).map((item, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <i className="fa-solid fa-xmark mt-1"></i>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white border border-gray-100 shadow-2xl rounded-3xl p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-gray-400 text-sm">Starting from</span>
                  <div className="text-4xl font-extrabold text-brand-blue">${tour.price}</div>
                </div>
                <button 
                  onClick={() => onToggleWishlist(tour.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                    isInWishlist ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <i className={`${isInWishlist ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                   <i className="fa-solid fa-star text-yellow-500"></i>
                   <span className="font-bold text-brand-blue">{tour.rating}</span>
                   <span>({tour.reviews} reviews)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                   <i className="fa-solid fa-users text-brand-orange"></i>
                   <span>{tour.audience}</span>
                </div>
              </div>

              <button 
                onClick={() => onOpenConsult(`Tour Detail: ${tour.title}`)}
                className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-darkOrange transition-all shadow-lg mb-4"
              >
                Inquire This Trip
              </button>
              <p className="text-center text-xs text-gray-400">No payment required yet. Consult with a butler first.</p>
              
              <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                <h5 className="font-bold text-brand-blue mb-4 text-sm uppercase tracking-widest">Why book with us?</h5>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <i className="fa-solid fa-shield-halved text-brand-orange"></i>
                    <span>Full Refund Guarantee</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <i className="fa-solid fa-headset text-brand-orange"></i>
                    <span>24/7 Butler Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourDetail;
