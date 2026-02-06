
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

  // Scenic spot extended fields (used by the desktop expanded card).
  nameZh?: string; // 景点名称（中文）
  nameEn?: string; // 景点名称（英文）
  region?: string; // 省市区
  address?: string; // 地址
  category?: string; // 景区分类
  nearbyTransport?: string; // 附近交通
  openingHours?: string; // 开放时间
  ticketPrice?: string; // 门票价格
  ticketPurchase?: string; // 购票方式
  suggestedDuration?: string; // 建议浏览时长
  bestVisitDate?: string; // 最佳浏览日期
  introduction?: string; // 景区介绍
  suitableFor?: string[]; // 适合人群
  sellingPoints?: string[]; // 景区卖点
  photos?: string[]; // 景点照片（补充图）
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
