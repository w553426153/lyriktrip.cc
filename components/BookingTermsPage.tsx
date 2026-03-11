import React from 'react';
import LegalPage from './LegalPage';
import bookingTermsContent from '../data/booking_terms.md?raw';

const BookingTermsPage: React.FC = () => {
  return (
    <LegalPage
      title="Booking Terms"
      subtitle="Understand deposits, cancellations, and how we keep your trip on track."
      heroImage="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1600"
      content={bookingTermsContent}
    />
  );
};

export default BookingTermsPage;
