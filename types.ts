
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

export type RouteNodeType = 'transport' | 'attraction' | 'restaurant';

export interface RouteTransportNode {
  fromLocation?: string | null;
  toLocation?: string | null;
  transportMethod?: string | null;
  routeDetail?: string | null;
  cost?: number | string | null;
  notes?: string | null;
}

export interface RouteAttractionHighlight {
  title: string;
  content?: string | null;
}

export interface RouteAttractionNode {
  name: string;
  address?: string | null;
  openingHours?: string | null;
  ticketPrice?: string | null;
  suggestedDuration?: string | null;
  description?: string | null;
  highlights?: RouteAttractionHighlight[] | null;
  images?: string[];
  bestSeason?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  notes?: string | null;
}

export interface RouteRestaurantDish {
  name: string;
  description?: string | null;
  image?: string | null;
  price?: string | null;
}

export interface RouteRestaurantNode {
  name: string;
  address?: string | null;
  avgCost?: number | string | null;
  mustEatRating?: number | null;
  queueStatus?: string | null;
  phone?: string | null;
  businessHours?: string | null;
  background?: string | null;
  recommendedDishes?: RouteRestaurantDish[] | null;
  images?: string[];
  lat?: number | string | null;
  lng?: number | string | null;
  notes?: string | null;
}

export interface RouteNode {
  id: string;
  dayId?: string;
  nodeOrder: number;
  nodeType: RouteNodeType;
  startTime?: string | null;
  durationMinutes?: number | null;
  transport?: RouteTransportNode | null;
  attraction?: RouteAttractionNode | null;
  restaurant?: RouteRestaurantNode | null;
}

export interface RouteDay {
  id: string;
  dayNumber: number;
  dayTitle?: string | null;
  daySubtitle?: string | null;
  nodes: RouteNode[];
}

export interface RouteSummary {
  id: string;
  routeName: string;
  routeAlias?: string | null;
  price?: number | string | null;
  priceUnit?: string | null;
  highlights: string[];
  coverImages: string[];
  totalDays: number;
  status?: number;
}

export interface RouteDetail extends RouteSummary {
  recommendation?: string | null;
  introduction?: string | null;
  routeOverview?: string | null;
  serviceContent?: string | null;
  days: RouteDay[];
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
  image?: string | null;
  tags?: string[];
  priceRange?: string | null;
  reviews?: number | null;
  reason?: string | null;
  topReview?: string;

  // Optional restaurant reference fields (returned by API when available).
  restaurantName?: string | null;
  restaurantAddress?: string | null;
  restaurantId?: string | null;

  // Optional extended fields from foods table (not always returned by API).
  phone?: string | null;
  nearbyTransport?: string | null;
  openingHours?: string | null;
  mustEatIndex?: number | string | null;
  avgCost?: string | null;
  queueStatus?: string | null;
}

export interface Restaurant {
  id: string;
  destinationId?: string;
  name: string;
  image?: string | null;
  photoUrl?: string | null;
  cuisineType?: string | null;
  recommendedDishes?: string[];
  address?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  nearbyTransport?: string | null;
  phone?: string | null;
  openingHours?: string | null;
  mustEatIndex?: number | string | null;
  avgCost?: string | null;
  queueStatus?: string | null;
  nearbyAttractions?: string[];
  priceRange?: string | null;
  rating?: number | string | null;
  tags?: string[];
}

export interface Destination {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  highlights?: string[]; // Deprecated for attractions
  attractions?: Attraction[];
  famousFoods?: Food[];
  restaurants?: Restaurant[];
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
  RestaurantDetail = 'restaurant-detail',
  Tours = 'tours',
  TourDetail = 'tour-detail',
  Wishlist = 'wishlist'
}
