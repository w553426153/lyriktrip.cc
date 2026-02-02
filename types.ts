
export type Language = 'en' | 'de' | 'ru';

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Tour {
  id: string;
  title: string;
  tagline: string;
  description?: string;
  highlights: string[];
  itinerary?: ItineraryDay[];
  included?: string[];
  excluded?: string[];
  audience: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  destinationId?: string;
}

export interface Attraction {
  id: string;
  name: string;
  image: string;
  tags: string[];
  reason: string;
  rating: number;
  topReview?: string;
}

export interface Food {
  id: string;
  name: string;
  image: string;
  tags: string[];
  priceRange: string;
  reviews: number;
  reason: string;
  topReview?: string;
}

export interface Destination {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  highlights?: string[]; // Deprecated for attractions
  attractions?: Attraction[];
  famousFoods?: Food[];
  image: string;
  tourCount: number;
}

export interface SurvivalKit {
  id: string;
  title: string;
  description: string;
  icon: string;
  pdfUrl: string;
}

export interface ServiceTier {
  id: string;
  name: string;
  price: string;
  oldPrice?: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

export interface Testimonial {
  id: string;
  user: string;
  country: string;
  story: string;
  category: string;
  avatar: string;
  tourName: string;
}

export enum Page {
  Home = 'home',
  Contact = 'contact',
  Destinations = 'destinations',
  DestinationDetail = 'destination-detail',
  Tours = 'tours',
  TourDetail = 'tour-detail',
  Wishlist = 'wishlist'
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}
