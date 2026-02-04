
import React, { useState, useEffect } from 'react';
import { Page, Language } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import WhyTrust from './components/WhyTrust';
import SurvivalKits from './components/SurvivalKits';
import FeaturedTours from './components/FeaturedTours';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import FloatingContact from './components/FloatingContact';
import ContactPage from './components/ContactPage';
import DestinationsPage from './components/DestinationsPage';
import DestinationDetail from './components/DestinationDetail';
import TourDetail from './components/TourDetail';
import WishlistPage from './components/WishlistPage';
import SmartFormModal from './components/SmartFormModal';
import { TOURS, DESTINATIONS } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultSource, setConsultSource] = useState('');
  
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lyriktrip_wishlist');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Failed to parse wishlist from local storage", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('lyriktrip_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenConsult = (source: string = 'General Header') => {
    setConsultSource(source);
    setIsConsultModalOpen(true);
  };

  const handleSelectDestination = (id: string) => {
    setSelectedDestinationId(id);
    setCurrentPage(Page.DestinationDetail);
    window.scrollTo(0, 0);
  };

  const handleSelectTour = (id: string) => {
    setSelectedTourId(id);
    setCurrentPage(Page.TourDetail);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Home:
        return (
          <>
            <Hero onStartQuiz={() => handleOpenConsult('Readiness Quiz')} language={language} />
            <WhyTrust onOpenConsult={handleOpenConsult} language={language} />
            <SurvivalKits onOpenConsult={handleOpenConsult} language={language} />
            <FeaturedTours 
              onOpenConsult={handleOpenConsult} 
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              onSelectTour={handleSelectTour}
            />
            <Testimonials />
          </>
        );
      case Page.Contact:
        return <ContactPage />;
      case Page.Destinations:
        return <DestinationsPage onNavigate={setCurrentPage} onSelectDestination={handleSelectDestination} />;
      case Page.DestinationDetail:
        const dest = DESTINATIONS.find(d => d.id === selectedDestinationId);
        if (!dest) return <DestinationsPage onNavigate={setCurrentPage} onSelectDestination={handleSelectDestination} />;
        const related = TOURS.filter(t => t.destinationId === dest.id);
        return (
          <DestinationDetail 
            destination={dest} 
            relatedTours={related}
            onOpenConsult={handleOpenConsult}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            onSelectTour={handleSelectTour}
            onBack={() => setCurrentPage(Page.Destinations)}
          />
        );
      case Page.Tours:
        return (
          <div className="bg-white min-h-screen">
             <div className="relative h-[40vh] flex items-center justify-center overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=1600" 
                  alt="Tours Collection" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-brand-blue/40"></div>
                <div className="relative z-10 text-center text-white px-6 mt-16">
                  <h1 className="text-5xl font-bold mb-4">All Travel Routes</h1>
                  <p className="text-xl opacity-90 max-w-2xl mx-auto">Browse our full collection of hand-crafted Chinese journeys.</p>
                </div>
              </div>
            <FeaturedTours 
              onOpenConsult={handleOpenConsult} 
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              onSelectTour={handleSelectTour}
              title="Hand-crafted Itineraries"
              subtitle="Every route is tested and verified by our local experts."
              items={TOURS}
              hideViewAll
            />
            <div className="container mx-auto px-6 py-20 text-center border-t border-gray-100">
              <h2 className="text-3xl font-bold mb-8 text-brand-blue">Didn't find your perfect match?</h2>
              <button 
                onClick={() => handleOpenConsult('Tours List Bottom')}
                className="bg-brand-orange text-white px-10 py-4 rounded-full font-bold shadow-xl hover:bg-brand-darkOrange transition-all hover:scale-105"
              >
                Request a Custom Itinerary
              </button>
            </div>
          </div>
        );
      case Page.TourDetail:
        const tour = TOURS.find(t => t.id === selectedTourId);
        if (!tour) return <div className="pt-32 text-center h-screen">Tour Not Found</div>;
        return (
          <TourDetail 
            tour={tour}
            onOpenConsult={handleOpenConsult}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            onBack={() => setCurrentPage(Page.Tours)}
          />
        );
      case Page.Wishlist:
        return (
          <WishlistPage 
            wishlist={wishlist} 
            onToggleWishlist={toggleWishlist} 
            onOpenConsult={handleOpenConsult}
            onNavigate={setCurrentPage}
            onSelectTour={handleSelectTour}
          />
        );
      default:
        return <div className="pt-32 text-center h-screen">Page Not Found</div>;
    }
  };

  return (
    <div className="min-h-screen font-sans bg-white selection:bg-brand-orange selection:text-white">
      <Header 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onOpenConsult={() => handleOpenConsult('Header Navigation')} 
        wishlistCount={wishlist.length}
        language={language}
        onLanguageChange={setLanguage}
      />
      
      <main>
        {renderPage()}
      </main>

      <Footer language={language} />
      
      <FloatingContact />

      {isConsultModalOpen && (
        <SmartFormModal 
          onClose={() => setIsConsultModalOpen(false)} 
          initialSource={consultSource} 
          wishlist={wishlist}
        />
      )}
    </div>
  );
};

export default App;
