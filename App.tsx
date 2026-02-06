
import React, { useEffect, useMemo, useState } from 'react';
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
import DestinationDetailPage from './components/DestinationDetailPage';
import RestaurantDetailPage from './components/RestaurantDetailPage';
import TourDetail from './components/TourDetail';
import WishlistPage from './components/WishlistPage';
import SmartFormModal from './components/SmartFormModal';
import { TOURS } from './constants';
import { fetchDestinations } from './apiClient';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  const [routeDestinationSlug, setRouteDestinationSlug] = useState<string | null>(null);
  const [selectedDestinationSlug, setSelectedDestinationSlug] = useState<string | null>(null);
  const [resolveDestinationLoading, setResolveDestinationLoading] = useState(false);
  const [resolveDestinationError, setResolveDestinationError] = useState<string>('');
  
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

  const slugify = (name: string) =>
    String(name || '')
      .normalize('NFKC')
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const parsePath = (pathname: string): { page: Page; params?: Record<string, string> } => {
    const clean = (pathname || '/').split('?')[0].split('#')[0];
    const parts = clean.split('/').filter(Boolean);

    if (parts.length === 0) return { page: Page.Home };

    if (parts[0] === 'contact') return { page: Page.Contact };
    if (parts[0] === 'tours') {
      if (parts[1]) return { page: Page.TourDetail, params: { id: parts[1] } };
      return { page: Page.Tours };
    }
    if (parts[0] === 'wishlist') return { page: Page.Wishlist };
    if (parts[0] === 'restaurants' && parts[1]) return { page: Page.RestaurantDetail, params: { id: parts[1] } };
    if (parts[0] === 'destinations') {
      if (parts[1]) return { page: Page.DestinationDetail, params: { slug: parts[1] } };
      return { page: Page.Destinations };
    }

    return { page: Page.Home };
  };

  const pageToPath = (page: Page): string => {
    switch (page) {
      case Page.Home:
        return '/';
      case Page.Contact:
        return '/contact';
      case Page.Tours:
        return '/tours';
      case Page.Wishlist:
        return '/wishlist';
      case Page.Destinations:
        return '/destinations';
      default:
        return '/';
    }
  };

  const applyRoute = (route: { page: Page; params?: Record<string, string> }) => {
    setResolveDestinationError('');

    if (route.page === Page.DestinationDetail) {
      const slug = route.params?.slug || '';
      setRouteDestinationSlug(slug || null);
      setCurrentPage(Page.DestinationDetail);
      return;
    }

    if (route.page === Page.TourDetail) {
      setSelectedTourId(route.params?.id || null);
      setCurrentPage(Page.TourDetail);
      return;
    }

    if (route.page === Page.RestaurantDetail) {
      setSelectedRestaurantId(route.params?.id || null);
      setCurrentPage(Page.RestaurantDetail);
      return;
    }

    setRouteDestinationSlug(null);
    setCurrentPage(route.page);
  };

  const navigateToPath = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    applyRoute(parsePath(path));
    window.scrollTo(0, 0);
  };

  const navigateToPage = (page: Page) => {
    navigateToPath(pageToPath(page));
  };

  // Initialize route on mount + react to browser back/forward.
  useEffect(() => {
    applyRoute(parsePath(window.location.pathname));
    const onPop = () => applyRoute(parsePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve /destinations/:slug to destinationId.
  useEffect(() => {
    if (currentPage !== Page.DestinationDetail) return;
    if (!routeDestinationSlug) return;
    // If we already have the id and it matches the slug we selected, skip resolving.
    if (selectedDestinationId && selectedDestinationSlug === routeDestinationSlug) return;

    let cancelled = false;
    setResolveDestinationLoading(true);
    setResolveDestinationError('');

    fetchDestinations({ page: 1, pageSize: 500 })
      .then((res) => {
        if (cancelled) return;
        const items = Array.isArray(res.items) ? res.items : [];
        const slug = routeDestinationSlug;
        const match = items.find((d) => slugify(d.name) === slug || d.id === slug);
        if (!match) {
          setResolveDestinationError(`Destination not found for slug: ${slug}`);
          return;
        }
        setSelectedDestinationId(match.id);
        setSelectedDestinationSlug(slugify(match.name));
      })
      .catch((e) => {
        if (cancelled) return;
        setResolveDestinationError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (cancelled) return;
        setResolveDestinationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, routeDestinationSlug, selectedDestinationId, selectedDestinationSlug]);

  const toggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenConsult = (source: string = 'General Header') => {
    setConsultSource(source);
    setIsConsultModalOpen(true);
  };

  const handleSelectDestination = (id: string, name?: string) => {
    setSelectedDestinationId(id);
    const slug = name ? slugify(name) : id;
    setSelectedDestinationSlug(slug);
    navigateToPath(`/destinations/${encodeURIComponent(slug)}`);
  };

  const handleSelectTour = (id: string) => {
    setSelectedTourId(id);
    navigateToPath(`/tours/${encodeURIComponent(id)}`);
  };

  const handleSelectRestaurant = (id: string) => {
    setSelectedRestaurantId(id);
    navigateToPath(`/restaurants/${encodeURIComponent(id)}`);
  };

  const handleNavigate = (page: Page) => {
    navigateToPage(page);
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
        return <DestinationsPage onNavigate={handleNavigate} onSelectDestination={handleSelectDestination} />;
      case Page.DestinationDetail:
        if (resolveDestinationLoading) {
          return <div className="pt-32 text-center text-gray-500 min-h-screen">Loading destination...</div>;
        }
        if (!selectedDestinationId) {
          return (
            <div className="pt-32 text-center min-h-screen">
              <div className="text-red-500 mb-6">{resolveDestinationError || 'Destination not selected.'}</div>
              <button
                onClick={() => navigateToPage(Page.Destinations)}
                className="bg-brand-blue text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition-all"
              >
                Back to Destinations
              </button>
            </div>
          );
        }
        const related = TOURS.filter(t => t.destinationId === selectedDestinationId);
        return (
          <DestinationDetailPage
            destinationId={selectedDestinationId}
            relatedTours={related}
            onOpenConsult={handleOpenConsult}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            onSelectTour={handleSelectTour}
            onSelectRestaurant={handleSelectRestaurant}
            onBack={() => navigateToPage(Page.Destinations)}
          />
        );
      case Page.RestaurantDetail:
        if (!selectedRestaurantId) {
          // Fallback: no restaurant selected, go back to destinations.
          return <DestinationsPage onNavigate={handleNavigate} onSelectDestination={handleSelectDestination} />;
        }
        return (
          <RestaurantDetailPage
            restaurantId={selectedRestaurantId}
            onBack={() => {
              if (window.history.length > 1) window.history.back();
              else navigateToPage(Page.Destinations);
            }}
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
            onBack={() => navigateToPage(Page.Tours)}
          />
        );
      case Page.Wishlist:
        return (
          <WishlistPage 
            wishlist={wishlist} 
            onToggleWishlist={toggleWishlist} 
            onOpenConsult={handleOpenConsult}
            onNavigate={handleNavigate}
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
        onNavigate={handleNavigate} 
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
