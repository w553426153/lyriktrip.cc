import React, { useEffect, useState } from 'react';
import type { Tour, Destination } from '../types';
import DestinationDetail from './DestinationDetail';
import { fetchDestinationDetail } from '../apiClient';

interface DestinationDetailPageProps {
  destinationId: string;
  relatedTours: Tour[];
  onOpenConsult: (source: string) => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onSelectTour: (id: string) => void;
  onBack: () => void;
}

const DestinationDetailPage: React.FC<DestinationDetailPageProps> = ({
  destinationId,
  relatedTours,
  onOpenConsult,
  wishlist,
  onToggleWishlist,
  onSelectTour,
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

    fetchDestinationDetail(destinationId, ['attractions', 'foods', 'restaurants', 'hotels'])
      .then((d) => {
        if (cancelled) return;
        setDestination(d);
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
      onBack={onBack}
    />
  );
};

export default DestinationDetailPage;

