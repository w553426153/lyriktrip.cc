
import React from 'react';
import { TOURS, DESTINATIONS } from '../constants';
import FeaturedTours from './FeaturedTours';
import { Page, Attraction, Food } from '../types';

interface WishlistPageProps {
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onOpenConsult: (source: string) => void;
  onNavigate: (page: Page) => void;
  onSelectTour: (id: string) => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ 
  wishlist, 
  onToggleWishlist, 
  onOpenConsult,
  onNavigate,
  onSelectTour
}) => {
  const wishlistTours = TOURS.filter(tour => wishlist.includes(tour.id));
  
  // Extract all attractions and food items across all destinations that are in the wishlist
  const wishlistAttractions: Attraction[] = [];
  const wishlistFoods: Food[] = [];

  DESTINATIONS.forEach(dest => {
    (dest.attractions || []).forEach(attr => {
      if (wishlist.includes(attr.id)) wishlistAttractions.push(attr);
    });
    (dest.famousFoods || []).forEach(food => {
      if (wishlist.includes(food.id)) wishlistFoods.push(food);
    });
  });

  const hasItems = wishlistTours.length > 0 || wishlistAttractions.length > 0 || wishlistFoods.length > 0;

  const handleConsultAll = () => {
    const tourNames = wishlistTours.map(t => t.title).join(', ');
    const attrNames = wishlistAttractions.map(a => a.name).join(', ');
    const foodNames = wishlistFoods.map(f => f.name).join(', ');
    const summary = `Wishlist: Tours [${tourNames}], Places [${attrNames}], Food [${foodNames}]`;
    onOpenConsult(summary);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[35vh] flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1600" 
          alt="Travel Planning" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-orange/30 backdrop-blur-[1px]"></div>
        <div className="relative z-10 text-center text-white px-6 mt-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">My Wishlist</h1>
          <p className="text-xl opacity-90">Your saved dream trips, spots, and flavors. Ready to explore?</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        {!hasItems ? (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-24 h-24 bg-brand-lightBlue text-brand-orange rounded-full flex items-center justify-center text-4xl mx-auto mb-8 animate-pulse-slow">
              <i className="fa-regular fa-heart"></i>
            </div>
            <h2 className="text-2xl font-bold text-brand-blue mb-4">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-10 leading-relaxed">Browse our tours and destinations to start planning your fear-free China adventure.</p>
            <div className="space-y-4">
              <button 
                onClick={() => onNavigate(Page.Tours)}
                className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold hover:bg-brand-darkOrange transition-all shadow-lg"
              >
                Explore All Tours
              </button>
              <button 
                onClick={() => onNavigate(Page.Destinations)}
                className="w-full bg-white border-2 border-brand-orange text-brand-orange py-4 rounded-xl font-bold hover:bg-orange-50 transition-all"
              >
                Browse Destinations
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-20">
            {/* Sections */}
            {wishlistTours.length > 0 && (
              <FeaturedTours 
                wishlist={wishlist} 
                onToggleWishlist={onToggleWishlist} 
                onOpenConsult={onOpenConsult}
                onSelectTour={onSelectTour}
                items={wishlistTours}
                title="Saved Routes"
                subtitle="Your hand-picked itineraries."
                hideViewAll
              />
            )}

            {wishlistAttractions.length > 0 && (
              <section>
                <div className="mb-12">
                  <h2 className="text-4xl font-bold text-brand-blue mb-4">Favorite Places</h2>
                  <p className="text-gray-600">Must-visit highlights you've saved.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {wishlistAttractions.map((attr) => (
                    <div key={attr.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                      <div className="relative h-48 overflow-hidden">
                        <img src={attr.image} alt={attr.name} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => onToggleWishlist(attr.id)}
                          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-brand-orange text-white shadow-lg flex items-center justify-center transition-all transform active:scale-90"
                        >
                          <i className="fa-solid fa-heart"></i>
                        </button>
                      </div>
                      <div className="p-6">
                        <h4 className="text-xl font-bold text-brand-blue mb-2">{attr.name}</h4>
                        <div className="flex items-center text-xs text-brand-orange font-bold mb-4">
                          <i className="fa-solid fa-star mr-1"></i> {attr.rating} Rating
                        </div>
                        <p className="text-gray-500 text-sm line-clamp-2">{attr.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {wishlistFoods.length > 0 && (
              <section>
                <div className="mb-12">
                  <h2 className="text-4xl font-bold text-brand-blue mb-4">Local Flavors</h2>
                  <p className="text-gray-600">Culinary experiences you can't wait to try.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {wishlistFoods.map((food) => (
                    <div key={food.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                      <div className="relative h-48 overflow-hidden">
                        <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => onToggleWishlist(food.id)}
                          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-brand-orange text-white shadow-lg flex items-center justify-center transition-all transform active:scale-90"
                        >
                          <i className="fa-solid fa-heart"></i>
                        </button>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-xl font-bold text-brand-blue">{food.name}</h4>
                          <span className="text-xs font-bold text-brand-orange">{food.priceRange}</span>
                        </div>
                        <p className="text-gray-500 text-sm line-clamp-2">{food.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Bottom Call to Action */}
            <div className="mt-20 bg-gray-50 rounded-3xl p-10 text-center border border-gray-100 shadow-sm max-w-4xl mx-auto">
               <h3 className="text-2xl font-bold text-brand-blue mb-4">Plan them all at once!</h3>
               <p className="text-gray-600 mb-8">Ready to turn these {wishlist.length} saved items into a real journey? Send your list to a butler for a cohesive custom itinerary.</p>
               <button 
                onClick={handleConsultAll}
                className="bg-brand-blue text-white px-10 py-4 rounded-full font-bold shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center mx-auto"
              >
                <i className="fa-solid fa-paper-plane mr-3"></i> Send Full Wishlist to Butler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
