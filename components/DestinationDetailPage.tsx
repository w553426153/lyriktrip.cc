import React, { useEffect, useState } from 'react';
import type { Tour, Destination } from '../types';
import DestinationDetail from './DestinationDetail';
import { fetchDestinationDetail } from '../apiClient';
import { loadFoodsForDestination } from '../utils/foodsCsv';

interface DestinationDetailPageProps {
  destinationId: string;
  relatedTours: Tour[];
  onOpenConsult: (source: string) => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onSelectTour: (id: string) => void;
  onSelectRestaurant: (id: string) => void;
  onBack: () => void;
}

const DestinationDetailPage: React.FC<DestinationDetailPageProps> = ({
  destinationId,
  relatedTours,
  onOpenConsult,
  wishlist,
  onToggleWishlist,
  onSelectTour,
  onSelectRestaurant,
  onBack
}) => {
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setDestination(null);

    const run = async () => {
      try {
        const d = await fetchDestinationDetail(destinationId, ['attractions', 'foods', 'restaurants', 'hotels']);
        if (cancelled) return;

        let resolved = d;
        try {
          const csvFoods = await loadFoodsForDestination(d);
          if (cancelled) return;
          if (csvFoods.length > 0) {
            resolved = { ...d, famousFoods: csvFoods };
          }
        } catch (csvError) {
          console.warn('Failed to load foods from CSV', csvError);
        }

        setDestination(resolved);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [destinationId]);

  if (loading) {
    return <div className="pt-32 text-center text-gray-500 min-h-screen">Loading destination...</div>;
  }

  if (!destination) {
    return (
      <div className="pt-32 text-center min-h-screen">
        <div className="text-red-500 mb-6">Failed to load destination: {error || 'Unknown error'}</div>
        <button
          onClick={onBack}
          className="bg-brand-blue text-white px-6 py-3 rounded-full font-bold hover:bg-brand-darkBlue transition-all"
        >
          Back to Destinations
        </button>
      </div>
    );
  }

  return (
    <DestinationDetail
      destination={destination}
      relatedTours={relatedTours}
      onOpenConsult={onOpenConsult}
      wishlist={wishlist}
      onToggleWishlist={onToggleWishlist}
      onSelectTour={onSelectTour}
      onSelectRestaurant={onSelectRestaurant}
      onBack={onBack}
    />
  );
};

export default DestinationDetailPage;
